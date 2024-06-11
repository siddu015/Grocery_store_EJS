const express = require("express");
const app = express();
const port = 9600;
const path = require("path");
const methodOverride = require('method-override');
const mysql = require('mysql2');
const moment = require('moment');


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

        res.render("index.ejs", { orders: result, totalCost, moment });
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
app.get('/new-order', (req, res) => {
    const query = 'SELECT * FROM products';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error retrieving products: ' + err.stack);
            return res.status(500).send('Error retrieving products');
        }
        res.render('newOrder', { products: results });
    });
});

app.post('/', (req, res) => {
    const { customerName, customerEmail, customerPhone, product_id, quantity, totalCost } = req.body;

    // Step 1: Insert into customers table
    const customerInsertQuery = 'INSERT INTO customers (customer_name, email, phone_no) VALUES (?, ?, ?)';
    const customerValues = [customerName, customerEmail, customerPhone];

    connection.query(customerInsertQuery, customerValues, (err, customerResult) => {
        if (err) {
            console.error('Error inserting into customers table:', err);
            return res.status(500).send('Error inserting into customers table');
        }

        const customerId = customerResult.insertId;

        // Step 2: Insert into orders table
        const orderInsertQuery = 'INSERT INTO orders (customer_id, total, datetime) VALUES (?, ?, NOW())';
        const orderValues = [customerId, totalCost];

        connection.query(orderInsertQuery, orderValues, (err, orderResult) => {
            if (err) {
                console.error('Error inserting into orders table:', err);
                return res.status(500).send('Error inserting into orders table');
            }

            const orderId = orderResult.insertId;

            // Step 3: Insert into order_details table for each product
            const insertPromises = [];

            for (let i = 1; i < product_id.length; i++) {
                const productId = product_id[i];
                const qty = quantity[i];
                const productPriceQuery = 'SELECT price_per_unit FROM products WHERE product_id = ?';

                // Use Promise to ensure all queries are completed before sending response
                const promise = new Promise((resolve, reject) => {
                    // Execute product price query
                    connection.query(productPriceQuery, productId, (err, priceResult) => {
                        if (err) {
                            console.error('Error fetching product price:', err);
                            reject(err);
                        }

                        if (priceResult.length === 0) {
                            console.error('Product not found');
                            reject('Product not found');
                        }

                        const productPrice = priceResult[0].price_per_unit;
                        const totalProductCost = productPrice * qty;

                        const orderDetailsInsertQuery = 'INSERT INTO order_details (order_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)';
                        const orderDetailsValues = [orderId, productId, qty, totalProductCost];

                        // Execute order details insertion query
                        connection.query(orderDetailsInsertQuery, orderDetailsValues, (err, orderDetailsResult) => {
                            if (err) {
                                console.error('Error inserting into order_details:', err);
                                reject(err);
                            }
                            resolve();
                        });
                    });
                });

                insertPromises.push(promise);
            }

            // Wait for all promises to resolve before sending response
            Promise.all(insertPromises)
                .then(() => {
                    // After all insertions, redirect to home page or wherever needed
                    res.redirect('/');
                })
                .catch((err) => {
                    console.error('Error inserting data:', err);
                    res.status(500).send('Error inserting data');
                });
        });
    });
});


// Customer Details
app.get("/customer/:id", (req, res) => {
    const customerId = req.params.id;
    const customerQuery = `SELECT * FROM customers WHERE customer_id = ?`;
    const ordersQuery = `SELECT * FROM orders WHERE customer_id = ?`;

    connection.query(customerQuery, [customerId], (err, customerResult) => {
        if (err) {
            console.log(err);
            return res.send("Error fetching customer details");
        }

        if (customerResult.length === 0) {
            return res.send("Customer not found");
        }

        connection.query(ordersQuery, [customerId], (err, ordersResult) => {
            if (err) {
                console.log(err);
                return res.send("Error fetching customer orders");
            }

            res.render("customer-details.ejs", { customer: customerResult[0], orders: ordersResult, moment });
        });
    });
});


app.listen(port, () => {
    console.log(`Port: ${port} is online`);
});
