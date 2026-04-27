const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB CONNECTION
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "kunju123", 
  database: "blood_donation_db"
});

db.connect(err => {
  if (err) console.error("Database connection failed:", err);
  else console.log("Connected to MySQL Database");
});

// ==========================================
// GET ROUTES
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
// POST ROUTES
// ==========================================

// DETECTIVE DONOR ROUTE
app.post("/donors", (req, res) => {
  console.log("📥 Incoming Donor Data:", req.body); 

  const { name, phone, blood_group, blood_id } = req.body;

  const bloodMap = {
    'O+': 100, 'O-': 101, 'A+': 102, 'A-': 103,
    'B+': 104, 'B-': 105, 'AB+': 106, 'AB-': 107
  };

  let finalBloodId = blood_id; 
  if (!finalBloodId && blood_group) {
      finalBloodId = bloodMap[blood_group];
  }

  if (!finalBloodId) {
      console.error("❌ Add Donor Error: Could not determine blood_id from the data sent.");
      return res.status(400).send("Invalid blood group.");
  }

  const sql = "INSERT INTO donors (name, phone, blood_id) VALUES (?, ?, ?)";
  
  db.query(sql, [name, phone, finalBloodId], (err, result) => {
    if (err) {
      console.error("❌ Database Insert Error:", err.message); 
      return res.status(500).send(err);
    }
    console.log(`✅ Donor ${name} added successfully! (Blood ID: ${finalBloodId})`);
    res.json({ message: "Donor successfully added!" });
  });
});

// INVENTORY UPSERT ROUTE
app.post("/inventory", (req, res) => {
  const { blood_id, blood_group, total_units } = req.body;
  const sql = `
    INSERT INTO inventory (blood_id, blood_group, total_units) 
    VALUES (?, ?, ?) 
    ON DUPLICATE KEY UPDATE total_units = total_units + VALUES(total_units)
  `;
  db.query(sql, [blood_id, blood_group, total_units], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Inventory successfully updated!" });
  });
});

// BULLETPROOF CAMP ROUTE
app.post("/donationcamp", (req, res) => {
  const { donor_id, donation_date, units_given } = req.body;

  db.beginTransaction((err) => {
    if (err) return res.status(500).send(err);

    const sqlInsert = "INSERT INTO donationcamp (donor_id, donation_date, units_given) VALUES (?, ?, ?)";
    db.query(sqlInsert, [donor_id, donation_date, units_given], (err, result) => {
      if (err) {
        console.error("Camp Insert Error:", err.message);
        return db.rollback(() => res.status(500).send(err));
      }

      db.query("SELECT blood_id FROM donors WHERE donor_id = ?", [donor_id], (err, donorRows) => {
        if (err || donorRows.length === 0) {
          console.error("❌ Donor ID not found in database!");
          return db.rollback(() => res.status(400).send("Donor not found"));
        }

        const b_id = donorRows[0].blood_id;

        const reverseMap = { 
            100: 'O+', 101: 'O-', 102: 'A+', 103: 'A-', 
            104: 'B+', 105: 'B-', 106: 'AB+', 107: 'AB-' 
        };
        const b_group = reverseMap[b_id];

        const sqlUpdate = "UPDATE inventory SET total_units = total_units + ? WHERE blood_group = ? OR blood_id = ?";
        
        db.query(sqlUpdate, [units_given, b_group, b_id], (err, updateResult) => {
          if (err) {
            console.error("Inventory Update Error:", err.message);
            return db.rollback(() => res.status(500).send(err));
          }

          if (updateResult.affectedRows === 0) {
            console.error(`❌ SILENT FAIL: No inventory row matched ${b_group} or ${b_id}!`);
            return db.rollback(() => res.status(400).send("No matching inventory row found."));
          }

          db.commit((err) => {
            if (err) return db.rollback(() => res.status(500).send(err));
            res.json({ message: "Camp record added and Inventory updated!" });
          });
        });
      });
    });
  });
});

// Start Server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});