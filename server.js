const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());

// DB CONNECTION
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  // password: "",
  database: "blood_donation_db"
});

app.get("/donors", (req, res) => {
  const sql = `
    SELECT d.donor_id, d.name, d.phone, i.blood_group
    FROM donors d
    LEFT JOIN inventory i ON d.blood_id = i.blood_id
  `;
  db.query(sql, (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});

// INVENTORY
app.get("/inventory", (req, res) => {
  db.query("SELECT * FROM inventory", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});

// DONATION CAMP
app.get("/camps", (req, res) => {
  const sql = `
    SELECT dc.donation_id, d.name, dc.donation_date, dc.units_given
    FROM donationcamp dc
    LEFT JOIN donors d ON dc.donor_id = d.donor_id
  `;
  db.query(sql, (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});

app.listen(3000, () => console.log("Server running on 3000"));
