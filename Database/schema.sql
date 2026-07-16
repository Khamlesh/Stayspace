-- StaySpace Database Schema Reference Script
-- Target Database: MySQL Server
-- Generated for use in MySQL Workbench

CREATE DATABASE IF NOT EXISTS stayspace;
USE stayspace;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    role ENUM('Guest', 'Host', 'Admin') NOT NULL DEFAULT 'Guest',
    profile_picture VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Guests Table
CREATE TABLE IF NOT EXISTS Guests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Hosts Table
CREATE TABLE IF NOT EXISTS Hosts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    is_approved BOOLEAN DEFAULT FALSE,
    gender VARCHAR(20) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Admins Table
CREATE TABLE IF NOT EXISTS Admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Properties Table
CREATE TABLE IF NOT EXISTS Properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    host_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    address VARCHAR(255) NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL,
    max_guests INT NOT NULL,
    latitude DECIMAL(9, 6) NULL,
    longitude DECIMAL(9, 6) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES Hosts(id) ON DELETE CASCADE,
    INDEX idx_price (price_per_night),
    INDEX idx_host (host_id)
) ENGINE=InnoDB;

-- 6. Amenities Table
CREATE TABLE IF NOT EXISTS Amenities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE,
    INDEX idx_property (property_id)
) ENGINE=InnoDB;

-- 7. Bookings Table
CREATE TABLE IF NOT EXISTS Bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    guest_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Checked-In', 'Completed', 'Cancelled') DEFAULT 'Pending',
    guests_count INT DEFAULT 1,
    special_requests TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES Guests(id) ON DELETE CASCADE,
    INDEX idx_dates (check_in, check_out)
) ENGINE=InnoDB;

-- 8. Payments Table
CREATE TABLE IF NOT EXISTS Payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('Credit Card', 'Debit Card', 'UPI', 'Net Banking') NOT NULL,
    status ENUM('Success', 'Failed') DEFAULT 'Success',
    transaction_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES Bookings(id) ON DELETE CASCADE,
    INDEX idx_transaction (transaction_id)
) ENGINE=InnoDB;

-- 9. Reviews Table
CREATE TABLE IF NOT EXISTS Reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    guest_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES Guests(id) ON DELETE CASCADE,
    INDEX idx_property_rev (property_id)
) ENGINE=InnoDB;

-- 10. Wishlist Table
CREATE TABLE IF NOT EXISTS Wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    property_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_wishlist (guest_id, property_id),
    FOREIGN KEY (guest_id) REFERENCES Guests(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system',
    title VARCHAR(255) DEFAULT '',
    link_url VARCHAR(500) NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_user_notif (user_id),
    INDEX idx_notif_type (type),
    INDEX idx_notif_read (is_read)
) ENGINE=InnoDB;

-- 12. Receipts Table
CREATE TABLE IF NOT EXISTS Receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL UNIQUE,
    receipt_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES Payments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Reports Table
CREATE TABLE IF NOT EXISTS Reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('Earnings', 'Analytics', 'Activity', 'Revenue') NOT NULL,
    path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 14. Sessions Table (Used for API authentication state)
CREATE TABLE IF NOT EXISTS Sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_token (session_token)
) ENGINE=InnoDB;

-- 15. Complaints Table
CREATE TABLE IF NOT EXISTS Complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
    admin_response TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Ensure Properties table has image_url and property_type columns
ALTER TABLE Properties ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER description;
ALTER TABLE Properties ADD COLUMN IF NOT EXISTS property_type ENUM('Apartment', 'House', 'Villa') DEFAULT 'House' AFTER image_url;
ALTER TABLE Properties ADD COLUMN IF NOT EXISTS bedrooms INT DEFAULT 1 AFTER max_guests;
ALTER TABLE Properties ADD COLUMN IF NOT EXISTS bathrooms INT DEFAULT 1 AFTER bedrooms;
ALTER TABLE Properties ADD COLUMN IF NOT EXISTS beds INT DEFAULT 1 AFTER bathrooms;
ALTER TABLE Properties ADD COLUMN IF NOT EXISTS property_size INT DEFAULT 0 AFTER beds;
ALTER TABLE Properties ADD COLUMN IF NOT EXISTS nearby_location VARCHAR(200) DEFAULT '' AFTER property_size;

-- Ensure Hosts table has gender, phone, city columns
ALTER TABLE Hosts ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT '' AFTER is_approved;
ALTER TABLE Hosts ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT '' AFTER gender;
ALTER TABLE Hosts ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT '' AFTER phone;
