// --- THEME TOGGLE ---
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const body = document.body;

themeToggleBtn.addEventListener('click', () => {
    if (body.classList.contains('dark-theme')) {
        body.classList.replace('dark-theme', 'light-theme');
        themeIcon.textContent = 'dark_mode';
    } else {
        body.classList.replace('light-theme', 'dark-theme');
        themeIcon.textContent = 'light_mode';
    }
});

// --- TAB SWITCHING ---
const tabs = document.querySelectorAll('md-primary-tab');
const sections = document.querySelectorAll('.tab-section');

tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        sections.forEach(s => s.classList.remove('active'));
        sections[index].classList.add('active');
    });
});

// --- API FETCHING & RENDERING ---
const API_BASE = "http://localhost:3000";

async function loadDonors() {
    try {
        const res = await fetch(`${API_BASE}/donors`);
        const data = await res.json();
        const container = document.getElementById("donors-container");
        
        if (!container) return;
        container.innerHTML = data.map(d => `
            <div class="data-card">
                <div class="chip" style="margin-bottom: 12px;">Donor #${d.donor_id}</div>
                <div class="data-title">${d.name}</div>
                <div class="data-subtitle">
                    <span class="material-symbols-outlined" style="font-size: 18px;">bloodtype</span>
                    Group: ${d.blood_group || 'O+'}
                </div>
                <div class="data-subtitle">
                    <span class="material-symbols-outlined" style="font-size: 18px;">call</span>
                    ${d.phone || 'N/A'}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error loading donors:", err);
    }
}

async function loadInventory() {
    try {
        const res = await fetch(`${API_BASE}/inventory`);
        const data = await res.json();
        const container = document.getElementById("inv-container");

        if (!container) return;
        container.innerHTML = data.map(i => `
            <div class="data-card">
                <div class="data-title" style="font-size: 32px;">${i.blood_group}</div>
                <div class="data-subtitle">Available Stock: ${i.total_units} Units</div>
                <div style="margin-top: 15px; background: var(--surface-border); height: 6px; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${Math.min(i.total_units * 10, 100)}%; height: 100%; background: var(--accent-gradient);"></div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error loading inventory:", err);
    }
}

async function loadCamps() {
    try {
        const res = await fetch(`${API_BASE}/camps`);
        const data = await res.json();
        const container = document.getElementById("camps-container");

        if (!container) return;
        container.innerHTML = data.map(c => `
            <div class="data-card">
                <div class="data-title">Camp Donation</div>
                <div class="data-subtitle"><b>Donor:</b> ${c.name || 'Anonymous'}</div>
                <div class="data-subtitle"><b>Units:</b> ${c.units_given}</div>
                <div class="data-subtitle"><b>Date:</b> ${new Date(c.donation_date).toLocaleDateString()}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error loading camps:", err);
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    loadDonors();
    loadInventory();
    loadCamps();
});