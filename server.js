const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // CRITICAL: Allows the server to read data sent from the frontend

// DB CONNECTION
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // Ensure your friend adds their MySQL root password here if they have one!
  database: "blood_donation" // CRITICAL: Fixed to match the name in schmea.sql
});

db.connect(err => {
  if (err) console.error("Database connection failed:", err);
  else console.log("Connected to MySQL Database");
});

// ==========================================
// GET ROUTES (Loads data into frontend)
// ==========================================

app.get("/donors", (req, res) => {
  const sql = `
    SELECT d.donor_id, d.name, d.phone, i.blood_group
    FROM donors d
    LEFT JOIN inventory i ON d.blood_id = i.blood_id
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

app.get("/inventory", (req, res) => {
  db.query("SELECT * FROM inventory", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

app.get("/camps", (req, res) => {
  const sql = `
    SELECT dc.donation_id, d.name, dc.donation_date, dc.units_given
    FROM donationcamp dc
    LEFT JOIN donors d ON dc.donor_id = d.donor_id
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// ==========================================
// POST ROUTES (Saves new data from frontend)
// ==========================================

app.post("/donors", (req, res) => {
  const { name, phone, blood_id } = req.body;
  const sql = "INSERT INTO donors (name, phone, blood_id) VALUES (?, ?, ?)";
  db.query(sql, [name, phone, blood_id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Donor successfully added!" });
  });
});

app.post("/inventory", (req, res) => {
  const { blood_id, blood_group, total_units } = req.body;
  const sql = "INSERT INTO inventory (blood_id, blood_group, total_units) VALUES (?, ?, ?)";
  db.query(sql, [blood_id, blood_group, total_units], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Inventory successfully added!" });
  });
});

app.post("/donationcamp", (req, res) => {
  const { donor_id, donation_date, units_given } = req.body;
  const sql = "INSERT INTO donationcamp (donor_id, donation_date, units_given) VALUES (?, ?, ?)";
  db.query(sql, [donor_id, donation_date, units_given], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Camp record successfully added!" });
  });
});

// Start Server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});