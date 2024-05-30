const express = require("express");
const app = express();
const port = 9600;
const path = require("path");
const methodOverride = require('method-override');
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1', // Force use of IPv4
    user: 'root',
    database: 'store',
    password: 'pass5678'
});

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));


//Index
app.get("/", (req, res) => {
    let query = "SELECT orders.*, customers.customer_name FROM orders " +
                        "JOIN customers ON orders.customer_id = customers.customer_id";

    connection.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error in database");
        }

        // Calculate total cost
        let totalCost = 0;
            result.forEach(order => {
            totalCost += order.total;
        });

        res.render("index.ejs", { orders: result, totalCost });
    });
});



// Manage Products
app.get("/manage-products", (req, res) => {
    let query = `SELECT * FROM products`;
    connection.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.send("Error in database");
        }
        console.log("Showing Products")
        res.render("manage-product.ejs", { products: results });
    });
});

app.post("/manage-products", (req, res) => {
    let { productName, productUnit, productPrice } = req.body;
    let uomId = productUnit === 'each' ? 1 : 2; // Set uom_id based on productUnit

    let query = `INSERT INTO products (name, uom_id, price_per_unit) VALUES (?, ?, ?)`;
    let values = [productName, uomId, productPrice];

    connection.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error in database");
        }
        console.log("Product added successfully");
        res.redirect("/manage-products"); // Redirect to products page or any other route
    });
});

app.patch("/manage-products/:id", (req, res) => {
    let { id } = req.params;
    let { new_price } = req.body
    let query = `UPDATE products SET price_per_unit = ? WHERE product_id = ?`;
    let values = [new_price, id];

    connection.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error in database");
        }
        console.log(`Product price updated successfully for product ID ${id}`);
        res.redirect("/manage-products");
    });
});

app.delete("/manage-products/:id", (req, res) => {
    let { id } = req.params;
    let query = `DELETE FROM products WHERE product_id = '${id}'`;

    connection.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Error in database");
        }
        console.log("Product deleted successfully");
        res.redirect("/manage-products");
    });
});



// Render new order form
app.get("/new-order", (req, res) => {
    const query = "SELECT * FROM products";
    connection.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.send("Error in database");
        }
        res.render("newOrder.ejs", { products: results });
    });
});

app.post("/", (req, res) => {
    const { customerName, customerEmail, customerPhone, product_id, quantity, total } = req.body;

    // Step 1: Insert into customers table
    const customerInsertQuery = `INSERT INTO customers (customer_name, email, phone_no) VALUES (?, ?, ?)`;
    const customerValues = [customerName, customerEmail, customerPhone];

    connection.query(customerInsertQuery, customerValues, (err, customerResult) => {
        if (err) {
            console.error("Error inserting into customers table:", err);
            return res.status(500).send("Error inserting into customers table");
        }

        const customerId = customerResult.insertId;

        // Step 2: Insert into orders table
        const orderInsertQuery = `INSERT INTO orders (customer_id, total, datetime) VALUES (?, ?, NOW())`;
        const orderValues = [customerId, total];

        connection.query(orderInsertQuery, orderValues, (err, orderResult) => {
            if (err) {
                console.error("Error inserting into orders table:", err);
                return res.status(500).send("Error inserting into orders table");
            }

            const orderId = orderResult.insertId;

            // Step 3: Insert into order_details table
            const orderDetailsInsertQuery = `INSERT INTO order_details (order_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)`;
            const orderDetailsValues = [orderId, product_id, quantity, total];

            connection.query(orderDetailsInsertQuery, orderDetailsValues, (err, orderDetailsResult) => {
                if (err) {
                    console.error("Error inserting into order_details table:", err);
                    return res.status(500).send("Error inserting into order_details table");
                }

                res.redirect("/");
            });
        });
    });
});


app.listen(port, () => {
    console.log(`Port: ${port} is online`);
});
