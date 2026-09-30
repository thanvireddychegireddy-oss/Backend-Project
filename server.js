require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/* =====================================================
   BASIC TEST ROUTE
===================================================== */

app.get("/", (req, res) => {
    res.json({
        message: "CRM Backend is running"
    });
});


/* =====================================================
   REGISTER
===================================================== */

app.post("/api/register", (req, res) => {
    const {
        name,
        email,
        password,
        role
    } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required"
        });
    }

    const selectedRole = role || "SalesRep";

    const salt = crypto.randomBytes(16).toString("hex");

    crypto.scrypt(
        password,
        salt,
        64,
        (err, derivedKey) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Password processing failed"
                });
            }

            const passwordHash =
                salt +
                ":" +
                derivedKey.toString("hex");

            const sql = `
                INSERT INTO users
                (name, email, password_hash, role)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    name,
                    email,
                    passwordHash,
                    selectedRole
                ],
                (err, result) => {
                    if (err) {
                        console.error(err);

                        if (err.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({
                                message: "Email already registered"
                            });
                        }

                        return res.status(500).json({
                            message: "Failed to create account"
                        });
                    }

                    res.status(201).json({
                        message: "Account created successfully",
                        user_id: result.insertId
                    });
                }
            );
        }
    );
});


/* =====================================================
   LOGIN
===================================================== */

app.post("/api/login", (req, res) => {
    const {
        email,
        password
    } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const sql = `
        SELECT
            user_id,
            name,
            email,
            password_hash,
            role
        FROM users
        WHERE email = ?
    `;

    db.query(
        sql,
        [email],
        (err, results) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Login failed"
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            const user = results[0];

            const storedHash =
                user.password_hash;

            const parts =
                storedHash.split(":");

            if (parts.length !== 2) {
                return res.status(401).json({
                    message:
                        "This account needs to be registered again"
                });
            }

            const salt = parts[0];
            const originalHash = parts[1];

            crypto.scrypt(
                password,
                salt,
                64,
                (err, derivedKey) => {
                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            message: "Login failed"
                        });
                    }

                    const newHash =
                        derivedKey.toString("hex");

                    if (newHash !== originalHash) {
                        return res.status(401).json({
                            message:
                                "Invalid email or password"
                        });
                    }

                    res.json({
                        message: "Login successful",

                        user: {
                            user_id: user.user_id,
                            name: user.name,
                            email: user.email,
                            role: user.role
                        }
                    });
                }
            );
        }
    );
});


/* =====================================================
   USERS
===================================================== */

app.get("/api/users", (req, res) => {
    const sql = `
        SELECT
            user_id,
            name,
            email,
            role,
            created_at
        FROM users
        ORDER BY user_id DESC
    `;

    db.query(
        sql,
        (err, results) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to fetch users"
                });
            }

            res.json(results);
        }
    );
});


/* =====================================================
   DASHBOARD
===================================================== */

app.get("/api/dashboard", (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM leads) AS leads,
            (SELECT COUNT(*) FROM customers) AS customers,
            (SELECT COUNT(*) FROM products) AS products,
            (SELECT COUNT(*) FROM sales) AS sales,
            (SELECT COUNT(*) FROM followups) AS followups,
            (SELECT COUNT(*) FROM interactions) AS interactions
    `;

    db.query(
        sql,
        (err, results) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to load dashboard"
                });
            }

            res.json(results[0]);
        }
    );
});


/* =====================================================
   LEADS - GET
===================================================== */

app.get("/api/leads", (req, res) => {
    const sql = `
        SELECT *
        FROM leads
        ORDER BY lead_id DESC
    `;

    db.query(
        sql,
        (err, results) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to fetch leads"
                });
            }

            res.json(results);
        }
    );
});


/* =====================================================
   LEADS - POST
===================================================== */

app.post("/api/leads", (req, res) => {
    const {
        name,
        email,
        phone,
        source,
        status,
        assigned_to
    } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Lead name is required"
        });
    }

    const sql = `
        INSERT INTO leads
        (
            name,
            email,
            phone,
            source,
            status,
            assigned_to
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name,
            email || null,
            phone || null,
            source || null,
            status || "New",
            assigned_to || null
        ],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to create lead"
                });
            }

            res.status(201).json({
                message: "Lead created successfully",
                lead_id: result.insertId
            });
        }
    );
});


/* =====================================================
   CUSTOMERS - GET
===================================================== */

app.get("/api/customers", (req, res) => {
    const sql = `
        SELECT *
        FROM customers
        ORDER BY customer_id DESC
    `;

    db.query(
        sql,
        (err, results) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to fetch customers"
                });
            }

            res.json(results);
        }
    );
});


/* =====================================================
   CUSTOMERS - POST
===================================================== */

app.post("/api/customers", (req, res) => {
    const {
        lead_id,
        name,
        email,
        phone,
        company,
        address,
        assigned_to
    } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Customer name is required"
        });
    }

    const sql = `
        INSERT INTO customers
        (
            lead_id,
            name,
            email,
            phone,
            company,
            address,
            assigned_to
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            lead_id || null,
            name,
            email || null,
            phone || null,
            company || null,
            address || null,
            assigned_to || null
        ],
        (err, result) => {
            if (err) {
                console.error(err);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message:
                            "A customer with this email already exists"
                    });
                }

                return res.status(500).json({
                    message: "Failed to create customer"
                });
            }

            res.status(201).json({
                message:
                    "Customer created successfully",
                customer_id: result.insertId
            });
        }
    );
});


/* =====================================================
   PRODUCTS - GET
===================================================== */

app.get("/api/products", (req, res) => {
    const sql = `
        SELECT *
        FROM products
        ORDER BY product_id DESC
    `;

    db.query(
        sql,
        (err, results) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to fetch products"
                });
            }

            res.json(results);
        }
    );
});


/* =====================================================
   PRODUCTS - POST
===================================================== */

app.post("/api/products", (req, res) => {
    const {
        name,
        description,
        price
    } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({
            message:
                "Product name and price are required"
        });
    }

    const sql = `
        INSERT INTO products
        (
            name,
            description,
            price
        )
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [
            name,
            description || null,
            price
        ],
        (err, result) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to create product"
                });
            }

            res.status(201).json({
                message:
                    "Product created successfully",
                product_id: result.insertId
            });
        }
    );
});


/* =====================================================
   SALES - GET
===================================================== */

app.get("/api/sales", (req, res) => {
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
        LEFT JOIN customers c
            ON s.customer_id = c.customer_id
        LEFT JOIN users u
            ON s.handled_by = u.user_id
        ORDER BY s.sale_id DESC
    `;

    db.query(
        sql,
        (err, results) => {
            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to fetch sales"
                });
            }

            res.json(results);
        }
    );
});


/* =====================================================
   SALES - POST
   Uses a database transaction
===================================================== */

app.post("/api/sales", (req, res) => {

    const {
        customer_id,
        handled_by,
        status,
        items
    } = req.body;

    if (!customer_id || !handled_by) {
        return res.status(400).json({
            message:
                "Customer and handled-by user are required"
        });
    }

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            message:
                "At least one sale item is required"
        });
    }

    db.beginTransaction((transactionError) => {

        if (transactionError) {
            console.error(transactionError);

            return res.status(500).json({
                message:
                    "Could not start transaction"
            });
        }

        const saleSql = `
            INSERT INTO sales
            (
                customer_id,
                handled_by,
                total_amount,
                status
            )
            VALUES (?, ?, 0, ?)
        `;

        db.query(
            saleSql,
            [
                customer_id,
                handled_by,
                status || "Pending"
            ],
            (saleError, saleResult) => {

                if (saleError) {

                    return db.rollback(() => {

                        console.error(saleError);

                        res.status(500).json({
                            message:
                                "Failed to create sale"
                        });

                    });
                }

                const saleId =
                    saleResult.insertId;

                let totalAmount = 0;

                function insertItem(index) {

                    if (index >= items.length) {

                        const updateSaleSql = `
                            UPDATE sales
                            SET total_amount = ?
                            WHERE sale_id = ?
                        `;

                        return db.query(
                            updateSaleSql,
                            [
                                totalAmount,
                                saleId
                            ],
                            (updateError) => {

                                if (updateError) {

                                    return db.rollback(
                                        () => {

                                            console.error(
                                                updateError
                                            );

                                            res.status(
                                                500
                                            ).json({
                                                message:
                                                    "Failed to update sale total"
                                            });

                                        }
                                    );
                                }

                                db.commit(
                                    (commitError) => {

                                        if (commitError) {

                                            return db.rollback(
                                                () => {

                                                    console.error(
                                                        commitError
                                                    );

                                                    res.status(
                                                        500
                                                    ).json({
                                                        message:
                                                            "Failed to complete sale"
                                                    });

                                                }
                                            );
                                        }

                                        res.status(201).json({
                                            message:
                                                "Sale created successfully",

                                            sale_id:
                                                saleId,

                                            total_amount:
                                                totalAmount
                                        });
                                    }
                                );
                            }
                        );
                    }

                    const item =
                        items[index];

                    if (
                        !item.product_id ||
                        !item.quantity ||
                        item.quantity <= 0
                    ) {

                        return db.rollback(
                            () => {

                                res.status(400).json({
                                    message:
                                        "Invalid sale item"
                                });

                            }
                        );
                    }

                    const productSql = `
                        SELECT price
                        FROM products
                        WHERE product_id = ?
                    `;

                    db.query(
                        productSql,
                        [item.product_id],
                        (productError, productResults) => {

                            if (productError) {

                                return db.rollback(
                                    () => {

                                        console.error(
                                            productError
                                        );

                                        res.status(
                                            500
                                        ).json({
                                            message:
                                                "Failed to find product"
                                        });

                                    }
                                );
                            }

                            if (
                                productResults.length === 0
                            ) {

                                return db.rollback(
                                    () => {

                                        res.status(
                                            400
                                        ).json({
                                            message:
                                                "Product not found"
                                        });

                                    }
                                );
                            }

                            const unitPrice =
                                Number(
                                    productResults[0]
                                        .price
                                );

                            const quantity =
                                Number(
                                    item.quantity
                                );

                            const itemTotal =
                                unitPrice *
                                quantity;

                            totalAmount +=
                                itemTotal;

                            const itemSql = `
                                INSERT INTO sale_items
                                (
                                    sale_id,
                                    product_id,
                                    quantity,
                                    unit_price
                                )
                                VALUES (?, ?, ?, ?)
                            `;

                            db.query(
                                itemSql,
                                [
                                    saleId,
                                    item.product_id,
                                    quantity,
                                    unitPrice
                                ],
                                (itemError) => {

                                    if (itemError) {

                                        return db.rollback(
                                            () => {

                                                console.error(
                                                    itemError
                                                );

                                                res.status(
                                                    500
                                                ).json({
                                                    message:
                                                        "Failed to create sale item"
                                                });

                                            }
                                        );
                                    }

                                    insertItem(
                                        index + 1
                                    );
                                }
                            );
                        }
                    );
                }

                insertItem(0);
            }
        );
    });
});


/* =====================================================
   FOLLOW-UPS - GET
===================================================== */

app.get("/api/followups", (req, res) => {

    const sql = `
        SELECT *
        FROM followups
        ORDER BY due_date ASC
    `;

    db.query(
        sql,
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message:
                        "Failed to fetch follow-ups"
                });
            }

            res.json(results);
        }
    );
});


/* =====================================================
   FOLLOW-UPS - POST
===================================================== */

app.post("/api/followups", (req, res) => {

    const {
        customer_id,
        lead_id,
        assigned_to,
        due_date,
        status,
        remarks
    } = req.body;

    if (!assigned_to || !due_date) {
        return res.status(400).json({
            message:
                "Assigned user and due date are required"
        });
    }

    if (!customer_id && !lead_id) {
        return res.status(400).json({
            message:
                "Customer or lead is required"
        });
    }

    const sql = `
        INSERT INTO followups
        (
            customer_id,
            lead_id,
            assigned_to,
            due_date,
            status,
            remarks
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            customer_id || null,
            lead_id || null,
            assigned_to,
            due_date,
            status || "Pending",
            remarks || null
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message:
                        "Failed to create follow-up"
                });
            }

            res.status(201).json({
                message:
                    "Follow-up created successfully",

                followup_id:
                    result.insertId
            });
        }
    );
});


/* =====================================================
   INTERACTIONS - GET
===================================================== */

app.get("/api/interactions", (req, res) => {

    const sql = `
        SELECT *
        FROM interactions
        ORDER BY interaction_date DESC
    `;

    db.query(
        sql,
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message:
                        "Failed to fetch interactions"
                });
            }

            res.json(results);
        }
    );
});


/* =====================================================
   INTERACTIONS - POST
===================================================== */

app.post("/api/interactions", (req, res) => {

    const {
        customer_id,
        lead_id,
        logged_by,
        type,
        notes
    } = req.body;

    if (!logged_by || !type) {
        return res.status(400).json({
            message:
                "Logged user and interaction type are required"
        });
    }

    if (!customer_id && !lead_id) {
        return res.status(400).json({
            message:
                "Customer or lead is required"
        });
    }

    const sql = `
        INSERT INTO interactions
        (
            customer_id,
            lead_id,
            logged_by,
            type,
            notes
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            customer_id || null,
            lead_id || null,
            logged_by,
            type,
            notes || null
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message:
                        "Failed to create interaction"
                });
            }

            res.status(201).json({
                message:
                    "Interaction created successfully",

                interaction_id:
                    result.insertId
            });
        }
    );
});


/* =====================================================
   START SERVER
===================================================== */

const PORT = 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});