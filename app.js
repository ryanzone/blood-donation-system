// --- 1. THEME TOGGLE WITH MEMORY ---
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const body = document.body;

if (localStorage.getItem('theme') === 'light') {
    body.classList.replace('dark-theme', 'light-theme');
    themeIcon.textContent = 'dark_mode';
}

themeToggleBtn.addEventListener('click', () => {
    if (body.classList.contains('dark-theme')) {
        body.classList.replace('dark-theme', 'light-theme');
        themeIcon.textContent = 'dark_mode';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.replace('light-theme', 'dark-theme');
        themeIcon.textContent = 'light_mode';
        localStorage.setItem('theme', 'dark');
    }
});

// --- 2. GLOBAL STATE & TAB SWITCHING (Pure HTML/CSS) ---
const API_BASE = "http://localhost:3000";
let allDonors = [];
let allInventory = [];
let allCamps = [];
let currentTabIndex = 0; 
let activeFilter = "";

const tabBtns = document.querySelectorAll('.tab-btn');
const sections = [
    document.getElementById('section-donors'),
    document.getElementById('section-inventory'),
    document.getElementById('section-camps')
];

tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentTabIndex = parseInt(btn.getAttribute('data-index') || btn.getAttribute('data-target'));
        
        sections.forEach((section, idx) => {
            if (idx === currentTabIndex) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        document.getElementById('global-search').value = "";
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        activeFilter = "";
        
        document.querySelector('.search-section').style.display = '';

        if (currentTabIndex === 0) {
            allDonors.length === 0 ? loadDonors() : applyFilters();
        } else if (currentTabIndex === 1) {
            allInventory.length === 0 ? loadInventory() : applyFilters();
        } else if (currentTabIndex === 2) {
            allCamps.length === 0 ? loadCamps() : applyFilters();
        }
    });
});

// --- 3. SEARCH & TOGGLE FILTERS ---
const searchInput = document.getElementById('global-search');
if(searchInput) searchInput.addEventListener('input', applyFilters);

const filterToggleBtn = document.getElementById('filter-toggle');
const filterDropdown = document.getElementById('filter-dropdown');

if (filterToggleBtn && filterDropdown) {
    filterToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.classList.toggle('active');
        filterToggleBtn.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!filterToggleBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterDropdown.classList.remove('active');
            filterToggleBtn.classList.remove('active');
        }
    });
}

const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            activeFilter = "";
        } else {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.getAttribute('data-filter');
        }
        applyFilters();
    });
});

function applyFilters() {
    const term = searchInput.value.toLowerCase();
    
    if (currentTabIndex === 0) {
        const filtered = allDonors.filter(d => 
            ((d.name && d.name.toLowerCase().includes(term)) || (d.blood_group && d.blood_group.toLowerCase().includes(term))) &&
            (activeFilter === "" || d.blood_group === activeFilter)
        );
        renderDonors(filtered);
    } else if (currentTabIndex === 1) {
        const filtered = allInventory.filter(i => 
            (i.blood_group && i.blood_group.toLowerCase().includes(term)) &&
            (activeFilter === "" || i.blood_group === activeFilter)
        );
        renderInventory(filtered);
    } else if (currentTabIndex === 2) {
        const filtered = allCamps.filter(c => 
            (c.name && c.name.toLowerCase().includes(term)) || 
            (c.donation_id && c.donation_id.toString().includes(term))
        );
        renderCamps(filtered);
    }
}

// --- 4. DYNAMIC MODAL & MYSQL SCHEMA FORM LOGIC ---
const fabAdd = document.getElementById('fab-add');
const addModal = document.getElementById('add-modal');
const closeModal = document.getElementById('close-modal');
const addForm = document.getElementById('add-form');
const toastContainer = document.getElementById('toast-container');

fabAdd.addEventListener('click', () => {
    addModal.classList.add('active');
    const today = new Date();
    document.getElementById('camp-date').value = today.toISOString().split('T')[0];
});

closeModal.addEventListener('click', () => addModal.classList.remove('active'));

const typeBtns = document.querySelectorAll('.type-btn');
const formSections = document.querySelectorAll('.form-section');
let currentRecordType = 'donor';

typeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRecordType = btn.getAttribute('data-type');
        
        formSections.forEach(sec => {
            sec.classList.remove('active');
            sec.querySelectorAll('input, select').forEach(input => input.required = false);
        });
        
        const activeSection = document.getElementById(`form-${currentRecordType}`);
        activeSection.classList.add('active');
        activeSection.querySelectorAll('input, select').forEach(input => input.required = true);
    });
});

// =========================================================
// AUTO-FILL BLOOD ID LOGIC (MATCHES SCHEMA)
// =========================================================
const bloodGroupMap = {
    'O+': 100, 'O-': 101, 'A+': 102, 'A-': 103,
    'B+': 104, 'B-': 105, 'AB+': 106, 'AB-': 107
};

// Listen to Donor Dropdown and auto-fill Donor Blood ID
document.getElementById('donor-bg').addEventListener('change', (e) => {
    document.getElementById('donor-blood-id').value = bloodGroupMap[e.target.value];
});

// Listen to Inventory Dropdown and auto-fill Inventory Blood ID
document.getElementById('inv-bg').addEventListener('change', (e) => {
    document.getElementById('inv-blood-id').value = bloodGroupMap[e.target.value];
});

// Submit Form exactly matching your MySQL parameters
addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let endpoint = "";
    let payload = {};

    if (currentRecordType === 'donor') {
        endpoint = "/donors";
        payload = {
            name: document.getElementById('donor-name').value,
            phone: document.getElementById('donor-phone').value,
            // Grabs the ID directly from the auto-filled input box exactly like the schema wants
            blood_id: parseInt(document.getElementById('donor-blood-id').value) 
        };
    } else if (currentRecordType === 'inventory') {
        endpoint = "/inventory";
        payload = {
            // Grabs the ID directly from the auto-filled input box
            blood_id: parseInt(document.getElementById('inv-blood-id').value),
            blood_group: document.getElementById('inv-bg').value,
            total_units: parseInt(document.getElementById('inv-units').value)
        };
    } else if (currentRecordType === 'camp') {
        endpoint = "/donationcamp";
        payload = {
            donor_id: parseInt(document.getElementById('camp-donor-id').value),
            donation_date: document.getElementById('camp-date').value,
            units_given: parseInt(document.getElementById('camp-units').value)
        };
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast("Database Record successfully saved!");
            addModal.classList.remove('active');
            addForm.reset();
            if (currentTabIndex === 0) loadDonors();
            if (currentTabIndex === 1) loadInventory();
            if (currentTabIndex === 2) loadCamps();
        } else {
            showToast("Database Error: Check Foreign Keys!");
        }
    } catch (err) {
        showToast("Server Connection Failed. Please check Node.js backend.");
        addModal.classList.remove('active');
    }
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="material-symbols-outlined" style="color: #ff6b7a;">check_circle</span> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 5. DATA FETCHING & RENDERING UI ---
function renderSkeleton(containerId) {
    document.getElementById(containerId).innerHTML = `
        <div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>
    `;
}

function renderEmptyState(containerId, message) {
    document.getElementById(containerId).innerHTML = `
        <div class="empty-state"><span class="material-symbols-outlined">search_off</span>
        <div class="data-title">No Results</div><div class="data-subtitle">${message}</div></div>
    `;
}

async function loadDonors() {
    renderSkeleton("donors-container");
    try {
        const res = await fetch(`${API_BASE}/donors`);
        allDonors = await res.json();
        setTimeout(() => renderDonors(allDonors), 600); 
    } catch (err) { showToast("Error connecting to server"); }
}

function renderDonors(data) {
    const container = document.getElementById("donors-container");
    if (data.length === 0) return renderEmptyState("donors-container", "No donors match your criteria.");
    container.innerHTML = data.map(d => `
        <div class="data-card">
            <div class="chip" style="margin-bottom: 12px;">Donor ID #${d.donor_id}</div>
            <div class="data-title">${d.name}</div>
            <div class="data-subtitle"><b>Blood Group:</b> <span style="color: var(--text-primary); font-weight: 600;">${d.blood_group || 'Unknown'}</span></div>
            <div class="data-subtitle" style="margin-top: 8px;">
                <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">phone</span> ${d.phone}
            </div>
        </div>
    `).join('');
}

async function loadInventory() {
    renderSkeleton("inventory-container");
    try {
        const res = await fetch(`${API_BASE}/inventory`);
        allInventory = await res.json();
        setTimeout(() => renderInventory(allInventory), 600);
    } catch (err) { showToast("Error connecting to server"); }
}

function renderInventory(data) {
    const container = document.getElementById("inventory-container");
    if (data.length === 0) return renderEmptyState("inventory-container", "No blood groups match your criteria.");
    
    container.innerHTML = data.map(i => {
        const isCritical = i.total_units <= 5;
        const pulseClass = isCritical ? 'critical-stock' : '';
        const chipText = isCritical ? '<div class="chip" style="color: #ff6b7a; border-color: #ff6b7a;">Low Stock!</div>' : '';
        const percentage = Math.min((i.total_units / 20) * 100, 100);
        
        const radius = 38;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        return `
            <div class="data-card ${pulseClass}">
                <div class="inventory-card-header">
                    <div>
                        <div class="data-title" style="font-size: 36px;">${i.blood_group}</div>
                        <div class="data-subtitle" style="font-size: 12px; margin-bottom: 8px;">Blood ID: ${i.blood_id}</div>
                        ${chipText}
                    </div>
                    <div class="ring-container">
                        <svg width="90" height="90" viewBox="0 0 90 90" style="position: absolute; top: 0; left: 0;">
                            <defs>
                                <linearGradient id="grad${i.blood_group ? i.blood_group.replace('+', 'p').replace('-', 'm') : i.blood_id}" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="${isCritical ? '#ff0000' : '#ff6b7a'}" />
                                    <stop offset="100%" stop-color="${isCritical ? '#ff6b7a' : '#ffb4ab'}" />
                                </linearGradient>
                            </defs>
                            <circle class="ring-bg" cx="45" cy="45" r="${radius}"></circle>
                            <circle class="ring-progress" cx="45" cy="45" r="${radius}" stroke="url(#grad${i.blood_group ? i.blood_group.replace('+', 'p').replace('-', 'm') : i.blood_id})" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
                        </svg>
                        <div class="ring-text">
                            <span style="font-size: 20px; font-weight: 700;">${i.total_units}</span>
                            <span style="font-size: 11px; font-weight: 500; color: var(--text-secondary); margin-top: 2px;">Units</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadCamps() {
    renderSkeleton("camps-container");
    try {
        const res = await fetch(`${API_BASE}/camps`);
        allCamps = await res.json();
        setTimeout(() => renderCamps(allCamps), 600);
    } catch (err) { showToast("Error connecting to server"); }
}

function renderCamps(data) {
    const container = document.getElementById("camps-container");
    if (data.length === 0) return renderEmptyState("camps-container", "No camps match your criteria.");
    container.innerHTML = data.map(c => `
        <div class="data-card">
            <div class="chip" style="margin-bottom: 12px;">Camp Record #${c.donation_id}</div>
            <div class="data-title">Camp Donation</div>
            <div class="data-subtitle"><b>Donor:</b> ${c.name || `Donor ID: ${c.donor_id}`}</div>
            <div class="data-subtitle"><b>Units Given:</b> ${c.units_given}</div>
            <div class="data-subtitle"><b>Date:</b> ${new Date(c.donation_date).toLocaleDateString()}</div>
        </div>
    `).join('');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', loadDonors);