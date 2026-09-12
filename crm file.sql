CREATE DATABASE crm_database;
USE crm_database;
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'SalesRep', 'Manager') DEFAULT 'SalesRep',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
DESC users;
CREATE TABLE leads (
    lead_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    source VARCHAR(50),
    status ENUM('New','Contacted','Qualified','Converted','Lost') DEFAULT 'New',
    assigned_to INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (assigned_to)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);
DESC leads;
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    company VARCHAR(100),
    address VARCHAR(255),
    assigned_to INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lead_id)
        REFERENCES leads(lead_id)
        ON DELETE SET NULL,

    FOREIGN KEY (assigned_to)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);
DESC customers;
CREATE TABLE interactions (
    interaction_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    lead_id INT,
    logged_by INT NOT NULL,
    type ENUM('Call','Email','Meeting','Other') NOT NULL,
    notes TEXT,
    interaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE,

    FOREIGN KEY (lead_id)
        REFERENCES leads(lead_id)
        ON DELETE CASCADE,

    FOREIGN KEY (logged_by)
        REFERENCES users(user_id),

    CHECK (customer_id IS NOT NULL OR lead_id IS NOT NULL)
);
DESC interactions;
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL
);
DESC products;
CREATE TABLE sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    handled_by INT NOT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('Pending','Completed','Cancelled') DEFAULT 'Pending',
    sale_date DATE DEFAULT (CURRENT_DATE),

    FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE,

    FOREIGN KEY (handled_by)
        REFERENCES users(user_id)
);
DESC sales;
CREATE TABLE sale_items (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (sale_id)
        REFERENCES sales(sale_id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);
DESC sale_items;
CREATE TABLE followups (
    followup_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    lead_id INT,
    assigned_to INT NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('Pending','Completed','Missed') DEFAULT 'Pending',
    remarks TEXT,

    FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE CASCADE,

    FOREIGN KEY (lead_id)
        REFERENCES leads(lead_id)
        ON DELETE CASCADE,

    FOREIGN KEY (assigned_to)
        REFERENCES users(user_id),

    CHECK (customer_id IS NOT NULL OR lead_id IS NOT NULL)
);
DESC followups;
SHOW TABLES;