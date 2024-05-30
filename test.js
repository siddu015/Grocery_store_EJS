const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1', // Force use of IPv4
    user: 'root',
    database: 'Grocery_Store',
    password: 'pass5678'
});


let query = `SELECT * FROM products WHERE name = 'brush`;

connection.query(query, (err, res) => {
    if (err) {
        console.log(err);
        return res.send("Error in database");
    }
    console.log(res)
    // res.render("users.ejs", { users: result });
});
