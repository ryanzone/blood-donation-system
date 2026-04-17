-- Create Database
CREATE DATABASE blood_donation;
USE blood_donation;

-- Table: INVENTORY
CREATE TABLE inventory (
    blood_id INT PRIMARY KEY,
    blood_group VARCHAR(5) NOT NULL,
    total_units INT DEFAULT 0
);

-- Table: DONORS
CREATE TABLE donors (
    donor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    blood_id INT,
    FOREIGN KEY (blood_id) REFERENCES inventory(blood_id)
);

-- Table: DONATIONCAMP
CREATE TABLE donationcamp (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT,
    donation_date DATE NOT NULL,
    units_given INT NOT NULL,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id)
);