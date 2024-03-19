const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'yourDatabaseName',
}).promise(); // Use promise() to enable async/await for queries

module.exports = connection;
