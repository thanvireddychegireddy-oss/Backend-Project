USE crm_database;

-- 1. Display all customers
SELECT *
FROM customers;


-- 2. Display all leads with their assigned user
SELECT
    l.lead_id,
    l.name AS lead_name,
    l.email,
    l.status,
    u.name AS assigned_user
FROM leads l
LEFT JOIN users u
    ON l.assigned_to = u.user_id;


-- 3. Display customers and their assigned sales representative
SELECT
    c.customer_id,
    c.name AS customer_name,
    c.email,
    u.name AS assigned_user
FROM customers c
LEFT JOIN users u
    ON c.assigned_to = u.user_id;


-- 4. Display completed sales
SELECT
    sale_id,
    customer_id,
    handled_by,
    total_amount,
    sale_date
FROM sales
WHERE status = 'Completed';


-- 5. Calculate total sales amount
SELECT
    SUM(total_amount) AS total_sales
FROM sales
WHERE status = 'Completed';


-- 6. Display sales with customer names
SELECT
    s.sale_id,
    c.name AS customer_name,
    s.total_amount,
    s.status,
    s.sale_date
FROM sales s
JOIN customers c
    ON s.customer_id = c.customer_id;


-- 7. Count leads according to their status
SELECT
    status,
    COUNT(*) AS lead_count
FROM leads
GROUP BY status;


-- 8. Display products with their prices
SELECT
    product_id,
    name,
    price
FROM products
ORDER BY price DESC;


-- 9. Display sale items with product details
SELECT
    si.sale_item_id,
    si.sale_id,
    p.name AS product_name,
    si.quantity,
    si.unit_price,
    (si.quantity * si.unit_price) AS item_total
FROM sale_items si
JOIN products p
    ON si.product_id = p.product_id;