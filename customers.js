app.post("/customers", (req, res) => {

    console.log("Customer data received:");
    console.log(req.body);

    const {
        name,
        email,
        phone,
        company,
        address,
        assigned_to
    } = req.body;

    // Customer name is required
    if (!name || name.trim() === "") {
        return res.status(400).json({
            message: "Customer name is required"
        });
    }

    // Convert empty assigned_to to NULL
    // This is important because assigned_to is optional
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
        name,
        email || null,
        phone || null,
        company || null,
        address || null,
        assignedUser
    ];

    db.query(sql, values, (err, result) => {

        if (err) {

            console.error("================================");
            console.error("CUSTOMER INSERT ERROR");
            console.error(err);
            console.error("================================");

            return res.status(500).json({
                message: "Failed to add customer",
                error: err.message
            });
        }

        console.log("Customer added successfully!");
        console.log("Customer ID:", result.insertId);

        res.status(201).json({
            message: "Customer added successfully!",
            customer_id: result.insertId
        });
    });
});