const connection = require('./connection');

async function getDepartments() {
    const [rows] = await connection.query('SELECT * FROM department');
    return rows;
}

async function addDepartment(departmentName) {
    const [result] = await connection.query('INSERT INTO department (name) VALUES (?)', [departmentName]);
    return result;
}

// Add other similar functions for roles and employees

module.exports = {
    getDepartments,
    addDepartment,
    // Export other functions here...
};
