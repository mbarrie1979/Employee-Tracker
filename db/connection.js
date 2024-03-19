const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'company_db', // Make sure to change 'yourDatabaseName' to your actual database name
}).promise(); // Use promise() to enable async/await for queries

module.exports = connection;
