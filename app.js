const express = require("express");
const cors = require("cors");
const db = require("./database/db");

const app = express();
const PORT = 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "CRM Backend is running successfully!"
    });
});

// ==========================================
// DATABASE TEST
// ==========================================

app.get("/db-test", (req, res) => {
    db.query(
        "SELECT DATABASE() AS database_name",
        (err, results) => {
            if (err) {
                console.error("Database test error:", err);

                return res.status(500).json({
                    message: "Database query failed",
                    error: err.message
                });
            }

            res.json({
                message: "Database connected successfully!",
                database: results[0].database_name
            });
        }
    );
});

// ==========================================
// GET USERS
// Used for assigned_to / handled_by dropdowns
// ==========================================

app.get("/users", (req, res) => {
    const sql = `
        SELECT
            user_id,
            name,
            email,
            role
        FROM users
        ORDER BY name ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching users:", err);

            return res.status(500).json({
                message: "Failed to fetch users",
                error: err.message
            });
        }

        res.json(results);
    });
});

// ======================================================
// CUSTOMERS
// ======================================================

// ADD CUSTOMER

app.post("/customers", (req, res) => {
    const {
        name,
        email,
        phone,
        company,
        address,
        assigned_to
    } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            message: "Customer name is required"
        });
    }

    const assignedUser =
        assigned_to === "" ||
        assigned_to === undefined ||
        assigned_to === null
            ? null
            : assigned_to;

    const sql = `
        INSERT INTO customers
        (name, email, phone, company, address, assigned_to)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        name.trim(),
        email || null,
        phone || null,
        company || null,
        address || null,
        assignedUser
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding customer:", err);

            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "A customer with this email already exists."
                });
            }

            return res.status(500).json({
                message: "Failed to add customer",
                error: err.message
            });
        }

        res.status(201).json({
            message: "Customer added successfully!",
            customer_id: result.insertId
        });
    });
});

// GET CUSTOMERS

app.get("/customers", (req, res) => {
    const sql = `
        SELECT
            customer_id,
            lead_id,
            name,
            email,
            phone,
            company,
            address,
            assigned_to,
            created_at
        FROM customers
        ORDER BY customer_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching customers:", err);

            return res.status(500).json({
                message: "Failed to fetch customers",
                error: err.message
            });
        }

        res.json(results);
    });
});

// DELETE CUSTOMER

app.delete("/customers/:id", (req, res) => {
    const customerId = req.params.id;

    const sql = `
        DELETE FROM customers
        WHERE customer_id = ?
    `;

    db.query(sql, [customerId], (err, result) => {
        if (err) {
            console.error("Error deleting customer:", err);

            return res.status(500).json({
                message: "Failed to delete customer",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.json({
            message: "Customer deleted successfully!"
        });
    });
});

// ======================================================
// LEADS
// ======================================================

// ADD LEAD

app.post("/leads", (req, res) => {
    const {
        name,
        email,
        phone,
        source,
        status,
        assigned_to
    } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            message: "Lead name is required"
        });
    }

    const assignedUser =
        assigned_to === "" ||
        assigned_to === undefined ||
        assigned_to === null
            ? null
            : assigned_to;

    const leadStatus = status || "New";

    const sql = `
        INSERT INTO leads
        (name, email, phone, source, status, assigned_to)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        name.trim(),
        email || null,
        phone || null,
        source || null,
        leadStatus,
        assignedUser
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding lead:", err);

            return res.status(500).json({
                message: "Failed to add lead",
                error: err.message
            });
        }

        res.status(201).json({
            message: "Lead added successfully!",
            lead_id: result.insertId
        });
    });
});

// GET LEADS

app.get("/leads", (req, res) => {
    const sql = `
        SELECT
            lead_id,
            name,
            email,
            phone,
            source,
            status,
            assigned_to,
            created_at
        FROM leads
        ORDER BY lead_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching leads:", err);

            return res.status(500).json({
                message: "Failed to fetch leads",
                error: err.message
            });
        }

        res.json(results);
    });
});

// DELETE LEAD

app.delete("/leads/:id", (req, res) => {
    const leadId = req.params.id;

    const sql = `
        DELETE FROM leads
        WHERE lead_id = ?
    `;

    db.query(sql, [leadId], (err, result) => {
        if (err) {
            console.error("Error deleting lead:", err);

            return res.status(500).json({
                message: "Failed to delete lead",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Lead not found"
            });
        }

        res.json({
            message: "Lead deleted successfully!"
        });
    });
});

// ======================================================
// PRODUCTS
// ======================================================

// ADD PRODUCT

app.post("/products", (req, res) => {
    const {
        name,
        description,
        price
    } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            message: "Product name is required"
        });
    }

    if (
        price === undefined ||
        price === null ||
        price === "" ||
        Number(price) < 0
    ) {
        return res.status(400).json({
            message: "Valid product price is required"
        });
    }

    const sql = `
        INSERT INTO products
        (name, description, price)
        VALUES (?, ?, ?)
    `;

    const values = [
        name.trim(),
        description || null,
        Number(price)
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding product:", err);

            return res.status(500).json({
                message: "Failed to add product",
                error: err.message
            });
        }

        res.status(201).json({
            message: "Product added successfully!",
            product_id: result.insertId
        });
    });
});

// GET PRODUCTS

app.get("/products", (req, res) => {
    const sql = `
        SELECT
            product_id,
            name,
            description,
            price
        FROM products
        ORDER BY product_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching products:", err);

            return res.status(500).json({
                message: "Failed to fetch products",
                error: err.message
            });
        }

        res.json(results);
    });
});

// DELETE PRODUCT

app.delete("/products/:id", (req, res) => {
    const productId = req.params.id;

    const sql = `
        DELETE FROM products
        WHERE product_id = ?
    `;

    db.query(sql, [productId], (err, result) => {
        if (err) {
            console.error("Error deleting product:", err);

            return res.status(500).json({
                message: "Failed to delete product",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product deleted successfully!"
        });
    });
});

// ======================================================
// FOLLOW-UPS
// ======================================================

// ADD FOLLOW-UP

app.post("/followups", (req, res) => {
    const {
        customer_id,
        lead_id,
        assigned_to,
        due_date,
        status,
        remarks
    } = req.body;

    if (!assigned_to) {
        return res.status(400).json({
            message: "Assigned user is required"
        });
    }

    if (!due_date) {
        return res.status(400).json({
            message: "Due date is required"
        });
    }

    if (!customer_id && !lead_id) {
        return res.status(400).json({
            message: "Select either a customer or a lead"
        });
    }

    const followupStatus = status || "Pending";

    const sql = `
        INSERT INTO followups
        (customer_id, lead_id, assigned_to, due_date, status, remarks)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        customer_id || null,
        lead_id || null,
        assigned_to,
        due_date,
        followupStatus,
        remarks || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding follow-up:", err);

            return res.status(500).json({
                message: "Failed to add follow-up",
                error: err.message
            });
        }

        res.status(201).json({
            message: "Follow-up added successfully!",
            followup_id: result.insertId
        });
    });
});

// GET FOLLOW-UPS

app.get("/followups", (req, res) => {
    const sql = `
        SELECT
            f.followup_id,
            f.customer_id,
            c.name AS customer_name,
            f.lead_id,
            l.name AS lead_name,
            f.assigned_to,
            u.name AS assigned_user,
            f.due_date,
            f.status,
            f.remarks
        FROM followups f
        LEFT JOIN customers c
            ON f.customer_id = c.customer_id
        LEFT JOIN leads l
            ON f.lead_id = l.lead_id
        LEFT JOIN users u
            ON f.assigned_to = u.user_id
        ORDER BY f.followup_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching follow-ups:", err);

            return res.status(500).json({
                message: "Failed to fetch follow-ups",
                error: err.message
            });
        }

        res.json(results);
    });
});

// DELETE FOLLOW-UP

app.delete("/followups/:id", (req, res) => {
    const followupId = req.params.id;

    const sql = `
        DELETE FROM followups
        WHERE followup_id = ?
    `;

    db.query(sql, [followupId], (err, result) => {
        if (err) {
            console.error("Error deleting follow-up:", err);

            return res.status(500).json({
                message: "Failed to delete follow-up",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Follow-up not found"
            });
        }

        res.json({
            message: "Follow-up deleted successfully!"
        });
    });
});

// ======================================================
// INTERACTIONS
// ======================================================

// ADD INTERACTION

app.post("/interactions", (req, res) => {
    const {
        customer_id,
        lead_id,
        logged_by,
        type,
        notes,
        interaction_date
    } = req.body;

    if (!logged_by) {
        return res.status(400).json({
            message: "Logged by user is required"
        });
    }

    if (!type) {
        return res.status(400).json({
            message: "Interaction type is required"
        });
    }

    if (!customer_id && !lead_id) {
        return res.status(400).json({
            message: "Select either a customer or a lead"
        });
    }

    const sql = `
        INSERT INTO interactions
        (customer_id, lead_id, logged_by, type, notes, interaction_date)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        customer_id || null,
        lead_id || null,
        logged_by,
        type,
        notes || null,
        interaction_date || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding interaction:", err);

            return res.status(500).json({
                message: "Failed to add interaction",
                error: err.message
            });
        }

        res.status(201).json({
            message: "Interaction added successfully!",
            interaction_id: result.insertId
        });
    });
});

// GET INTERACTIONS

app.get("/interactions", (req, res) => {
    const sql = `
        SELECT
            i.interaction_id,
            i.customer_id,
            c.name AS customer_name,
            i.lead_id,
            l.name AS lead_name,
            i.logged_by,
            u.name AS logged_by_name,
            i.type,
            i.notes,
            i.interaction_date
        FROM interactions i
        LEFT JOIN customers c
            ON i.customer_id = c.customer_id
        LEFT JOIN leads l
            ON i.lead_id = l.lead_id
        LEFT JOIN users u
            ON i.logged_by = u.user_id
        ORDER BY i.interaction_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching interactions:", err);

            return res.status(500).json({
                message: "Failed to fetch interactions",
                error: err.message
            });
        }

        res.json(results);
    });
});

// DELETE INTERACTION

app.delete("/interactions/:id", (req, res) => {
    const interactionId = req.params.id;

    const sql = `
        DELETE FROM interactions
        WHERE interaction_id = ?
    `;

    db.query(sql, [interactionId], (err, result) => {
        if (err) {
            console.error("Error deleting interaction:", err);

            return res.status(500).json({
                message: "Failed to delete interaction",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Interaction not found"
            });
        }

        res.json({
            message: "Interaction deleted successfully!"
        });
    });
});

// ======================================================
// SALES
// ======================================================

// ADD SALE

app.post("/sales", (req, res) => {
    const {
        customer_id,
        handled_by,
        total_amount,
        status,
        sale_date
    } = req.body;

    if (!customer_id) {
        return res.status(400).json({
            message: "Customer is required"
        });
    }

    if (!handled_by) {
        return res.status(400).json({
            message: "Handled by user is required"
        });
    }

    if (
        total_amount === undefined ||
        total_amount === null ||
        total_amount === "" ||
        Number(total_amount) < 0
    ) {
        return res.status(400).json({
            message: "Valid total amount is required"
        });
    }

    const saleStatus = status || "Pending";

    const sql = `
        INSERT INTO sales
        (customer_id, handled_by, total_amount, status, sale_date)
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        customer_id,
        handled_by,
        Number(total_amount),
        saleStatus,
        sale_date || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding sale:", err);

            return res.status(500).json({
                message: "Failed to add sale",
                error: err.message
            });
        }

        res.status(201).json({
            message: "Sale added successfully!",
            sale_id: result.insertId
        });
    });
});

// GET SALES

app.get("/sales", (req, res) => {
    const sql = `
        SELECT
            s.sale_id,
            s.customer_id,
            c.name AS customer_name,
            s.handled_by,
            u.name AS handled_by_name,
            s.total_amount,
            s.status,
            s.sale_date
        FROM sales s
        INNER JOIN customers c
            ON s.customer_id = c.customer_id
        INNER JOIN users u
            ON s.handled_by = u.user_id
        ORDER BY s.sale_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching sales:", err);

            return res.status(500).json({
                message: "Failed to fetch sales",
                error: err.message
            });
        }

        res.json(results);
    });
});

// DELETE SALE

app.delete("/sales/:id", (req, res) => {
    const saleId = req.params.id;

    const sql = `
        DELETE FROM sales
        WHERE sale_id = ?
    `;

    db.query(sql, [saleId], (err, result) => {
        if (err) {
            console.error("Error deleting sale:", err);

            return res.status(500).json({
                message: "Failed to delete sale",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Sale not found"
            });
        }

        res.json({
            message: "Sale deleted successfully!"
        });
    });
});

// ======================================================
// DASHBOARD STATISTICS
// ======================================================

app.get("/dashboard-stats", (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM customers) AS customers,
            (SELECT COUNT(*) FROM leads) AS leads,
            (SELECT COUNT(*) FROM products) AS products,
            (SELECT COUNT(*) FROM followups WHERE status = 'Pending') AS pending_followups,
            (SELECT COUNT(*) FROM sales) AS sales_count,
            (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE status = 'Completed') AS completed_sales_amount
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching dashboard stats:", err);

            return res.status(500).json({
                message: "Failed to fetch dashboard statistics",
                error: err.message
            });
        }

        res.json(results[0]);
    });
});

// ======================================================
// REPORTS
// ======================================================

// SALES REPORT

app.get("/reports/sales", (req, res) => {
    const sql = `
        SELECT
            s.status,
            COUNT(*) AS total_sales,
            COALESCE(SUM(s.total_amount), 0) AS total_amount
        FROM sales s
        GROUP BY s.status
        ORDER BY s.status
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error generating sales report:", err);

            return res.status(500).json({
                message: "Failed to generate sales report",
                error: err.message
            });
        }

        res.json(results);
    });
});

// LEADS REPORT

app.get("/reports/leads", (req, res) => {
    const sql = `
        SELECT
            status,
            COUNT(*) AS total_leads
        FROM leads
        GROUP BY status
        ORDER BY status
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error generating leads report:", err);

            return res.status(500).json({
                message: "Failed to generate leads report",
                error: err.message
            });
        }

        res.json(results);
    });
});

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {
    console.log(
        `CRM Backend running on http://localhost:${PORT}`
    );
});