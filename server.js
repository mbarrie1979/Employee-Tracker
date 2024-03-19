const mysql = require('mysql2');
const inquirer = require('inquirer');
const db = require('./db/connection');
require('console.table');

// Start the application after connecting to the database
db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Exit the application if a connection cannot be established
    }
    console.log("Connected to the company_db database.");
    mainMenu(); // Proceed to show the main menu or start the application logic
});


// Main menu function
function mainMenu() {
    inquirer.prompt({
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: [
            'View all departments',
            'View all roles',
            'View all employees',
            'Add a department',
            'Add a role',
            'Add an employee',
            'Update an employee role',
            // Include other options like 'Delete department', 'View employees by manager', etc.
            'Exit'
        ]
    }).then(answers => {
        switch (answers.choice) {
            case 'View all departments':
                viewAllDepartments();
                break;
            case 'View all roles':
                viewAllRoles();
                break;
            case 'View all employees':
                viewAllEmployees();
                break;
            case 'Add a department':
                addDepartment();
                break;
            case 'Add a role':
                addRole();
                break;
            case 'Add an employee':
                addEmployee();
                break;
            case 'Update an employee role':
                updateEmployeeRole();
                break;
            case 'Exit':
                db.end();
                console.log('Exiting the application.');
                process.exit();
                break;
            // You can add more cases for additional functionality here
            default:
                console.log(`Invalid action: ${answers.choice}`);
                break;
        }
    });
}

// View functions
function viewAllDepartments() {
    db.query('SELECT * FROM department').then(([rows]) => {
        console.table(rows);
        mainMenu();
    });
}

function viewAllRoles() {
    const sql = `SELECT 
    role.id, 
    role.title, 
    department.name AS department, 
    role.salary 
    FROM 
    role 
    LEFT JOIN department ON role.department_id = department.id`;
    db.query(sql).then(([rows]) => {
        console.table(rows);
        mainMenu();
    });
}

function viewAllEmployees() {
    const sql = `
        SELECT 
            employee.id, 
            employee.first_name, 
            employee.last_name, 
            role.title, 
            department.name AS department, 
            role.salary 
        FROM 
            employee 
            LEFT JOIN role ON employee.role_id = role.id 
            LEFT JOIN department ON role.department_id = department.id
    `;

    db.query(sql).then(([rows]) => {
        console.table(rows);
        mainMenu();
    }).catch(console.log);
}


// Add functions
function addDepartment() {
    inquirer.prompt({
        type: 'input',
        name: 'deptName',
        message: 'What is the name of the department?'
    }).then(answer => {
        db.query('INSERT INTO department (name) VALUES (?)', answer.deptName).then(() => {
            console.log(`Added ${answer.deptName} to the database`);
            mainMenu();
        });
    });
}

function addRole() {
    // Fetch departments first to select from
    db.query('SELECT * FROM department').then(([departments]) => {
        const departmentChoices = departments.map(({ id, name }) => ({
            name: name,
            value: id
        }));
        inquirer.prompt([
            {
                type: 'input',
                name: 'roleTitle',
                message: 'What is the title of the role?'
            },
            {
                type: 'input',
                name: 'roleSalary',
                message: 'What is the salary of the role?'
            },
            {
                type: 'list',
                name: 'departmentId',
                message: 'Which department does the role belong to?',
                choices: departmentChoices
            }
        ]).then(answers => {
            const sql = 'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)';
            const params = [answers.roleTitle, answers.roleSalary, answers.departmentId];

            db.query(sql, params).then(() => {
                console.log(`Added ${answers.roleTitle} role to the database`);
                mainMenu();
            });
        });
    });
}

function addEmployee() {
    // First, get the list of roles
    db.query('SELECT id, title FROM role', (err, roles) => {
        if (err) {
            console.error('Error fetching roles:', err);
            return mainMenu();
        }

        const roleChoices = roles.map(({ id, title }) => ({
            name: title,
            value: id
        }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'roleId',
                message: "What is the employee's role?",
                choices: roleChoices
            }
        ]).then(answer => {
            const roleId = answer.roleId;

            // Next, get the list of potential managers
            db.query('SELECT id, first_name, last_name FROM employee WHERE manager_id IS NULL', (err, managers) => {
                if (err) {
                    console.error('Error fetching managers:', err);
                    return mainMenu();
                }

                const managerChoices = managers.map(({ id, first_name, last_name }) => ({
                    name: `${first_name} ${last_name}`,
                    value: id
                }));

                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'firstName',
                        message: "What is the employee's first name?"
                    },
                    {
                        type: 'input',
                        name: 'lastName',
                        message: "What is the employee's last name?"
                    },
                    {
                        type: 'list',
                        name: 'managerId',
                        message: "Who is the employee's manager?",
                        choices: managerChoices.length > 0 ? managerChoices : [{ name: 'No Manager', value: null }]
                    }
                ]).then(answers => {
                    db.query('INSERT INTO employee SET ?', {
                        first_name: answers.firstName,
                        last_name: answers.lastName,
                        role_id: roleId,
                        manager_id: answers.managerId || null
                    }, (err, result) => {
                        if (err) {
                            console.error('Error adding an employee:', err);
                            return mainMenu();
                        }
                        console.log(`Added ${answers.firstName} ${answers.lastName} to the database`);
                        mainMenu();
                    });
                });
            });
        });
    });
}



function updateEmployeeRole() {
    db.query('SELECT id, first_name, last_name FROM employee', async (err, employees) => {
        if (err) throw err;

        const employeeChoices = employees.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }));

        const { employeeId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: "Which employee's role do you want to update?",
                choices: employeeChoices
            }
        ]);

        db.query('SELECT id, title FROM role', async (err, roles) => {
            if (err) throw err;

            const roleChoices = roles.map(({ id, title }) => ({
                name: title,
                value: id
            }));

            const { roleId } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'roleId',
                    message: "What is the employee's new role?",
                    choices: roleChoices
                }
            ]);

            db.query('UPDATE employee SET role_id = ? WHERE id = ?',
                [roleId, employeeId],
                (err, result) => {
                    if (err) throw err;
                    console.log('Updated employee role in the database');
                    mainMenu();
                });
        });
    });
}
// More functions for other operations...

// Start the application
mainMenu();
