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
            'View employees by manager',
            'View employees by department',
            'Add a department',
            'Add an employee',
            'Add a role',
            'Delete department',
            'Delete employee',
            'Delete role',
            'Update an employee role',
            'Update employee manager',
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
            case 'View employees by manager':
                viewEmployeesByManager();
                break;
            case 'View employees by department':
                viewEmployeesByDepartment();
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
            case 'Delete department':
                deleteDepartment();
                break;
            case 'Delete employee':
                deleteEmployee();
                break;
            case 'Delete role':
                deleteRole();
                break;
            case 'Update an employee role':
                updateEmployeeRole();
                break;
            case 'Update employee manager':
                updateEmployeeManager();
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
async function viewAllDepartments() {
    try {
        const [rows] = await db.query('SELECT * FROM department');
        console.table(rows);
    } catch (error) {
        console.error('Error fetching departments:', error.message);
    }
    mainMenu();
}


async function viewAllRoles() {
    try {
        const sql = `SELECT 
            role.id, 
            role.title, 
            department.name AS department, 
            role.salary 
            FROM 
            role 
            LEFT JOIN department ON role.department_id = department.id`;

        const [rows] = await db.query(sql);
        console.table(rows);
    } catch (error) {
        console.error('Error fetching roles:', error.message);
    }
    mainMenu();
}


async function viewAllEmployees() {
    try {
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
                LEFT JOIN department ON role.department_id = department.id`;

        const [rows] = await db.query(sql);
        console.table(rows);
    } catch (error) {
        console.log('Error fetching employees:', error.message);
    }
    mainMenu();
}


async function addDepartment() {
    try {
        const answer = await inquirer.prompt({
            type: 'input',
            name: 'deptName',
            message: 'What is the name of the department?'
        });

        await db.query('INSERT INTO department (name) VALUES (?)', answer.deptName);

        console.log(`Added ${answer.deptName} to the database`);
    } catch (error) {
        console.error('Error adding the department:', error.message);
    }
    mainMenu();
}


async function addRole() {
    try {
        // Fetch departments first to select from
        const [departments] = await db.query('SELECT * FROM department');

        const departmentChoices = departments.map(({ id, name }) => ({
            name,
            value: id
        }));

        const answers = await inquirer.prompt([
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
        ]);

        const sql = 'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)';
        await db.query(sql, [answers.roleTitle, answers.roleSalary, answers.departmentId]);

        console.log(`Added ${answers.roleTitle} role to the database`);
    } catch (error) {
        console.error('Error adding the role:', error.message);
    }
    mainMenu();
}


async function addEmployee() {
    try {
        // First, get the list of roles
        const [roles] = await db.query('SELECT id, title FROM role');

        const roleChoices = roles.map(({ id, title }) => ({
            name: title,
            value: id
        }));

        const { roleId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'roleId',
                message: "What is the employee's role?",
                choices: roleChoices
            }
        ]);

        // Next, get the list of potential managers
        const [managers] = await db.query('SELECT id, first_name, last_name FROM employee WHERE manager_id IS NULL');

        const managerChoices = managers.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }));

        const answers = await inquirer.prompt([
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
        ]);

        // Insert the new employee into the database
        await db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', [
            answers.firstName,
            answers.lastName,
            roleId,
            answers.managerId || null
        ]);

        console.log(`Added ${answers.firstName} ${answers.lastName} to the database`);
    } catch (error) {
        console.error('Error adding an employee:', error.message);
    }
    // Regardless of the outcome, return to the main menu
    mainMenu();
}


async function deleteDepartment() {
    try {
        // Fetch departments and wait for the query to resolve
        const [departments] = await db.query('SELECT id, name FROM department');

        const departmentChoices = departments.map(({ id, name }) => ({
            name,
            value: id
        }));

        const { departmentId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Which department would you like to delete?',
                choices: departmentChoices
            }
        ]);

        // Execute the delete operation and wait for completion
        await db.query('DELETE FROM department WHERE id = ?', departmentId);

        console.log('Department deleted from the database');
    } catch (error) {
        console.error('Error during department deletion:', error.message);
    }
    // Regardless of the outcome, return to the main menu
    mainMenu();
}
async function deleteEmployee() {
    try {
        // Fetch employees and wait for the query to resolve
        const [employees] = await db.query('SELECT id, first_name, last_name FROM employee');

        const employeeChoices = employees.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }));

        const { employeeId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Which employee would you like to delete?',
                choices: employeeChoices
            }
        ]);

        // Find the selected employee's full name for the confirmation message
        const employee = employees.find(emp => emp.id === employeeId);
        const fullName = `${employee.first_name} ${employee.last_name}`;

        // Confirmation prompt
        const { confirmDelete } = await inquirer.prompt([
            {
                type: 'confirm', // This makes it a Y/N prompt
                name: 'confirmDelete',
                message: `Are you sure you want to delete ${fullName}?`,
                default: false // Default to No to avoid accidental deletion
            }
        ]);

        // Proceed with deletion if confirmed
        if (confirmDelete) {
            // Execute the delete operation and wait for completion
            await db.query('DELETE FROM employee WHERE id = ?', employeeId);
            console.log('Employee deleted from the database.');
        } else {
            console.log('Employee deletion cancelled.');
        }
    } catch (error) {
        console.error('Error during employee deletion:', error.message);
    }
    // Regardless of the outcome, return to the main menu
    mainMenu();
}

async function deleteRole() {
    try {
        // Fetch roles and wait for the query to resolve
        const [roles] = await db.query('SELECT id, title FROM role');

        const roleChoices = roles.map(({ id, title }) => ({
            name: title,
            value: id
        }));

        const { roleId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'roleId',
                message: 'Which role would you like to delete?',
                choices: roleChoices
            }
        ]);

        // Find the selected role's title for the confirmation message
        const role = roles.find(r => r.id === roleId);
        const roleTitle = role.title;

        // Confirmation prompt
        const { confirmDelete } = await inquirer.prompt([
            {
                type: 'confirm', // This makes it a Y/N prompt
                name: 'confirmDelete',
                message: `Are you sure you want to delete the role "${roleTitle}"?`,
                default: false // Default to No to avoid accidental deletion
            }
        ]);

        // Proceed with deletion if confirmed
        if (confirmDelete) {
            // Execute the delete operation and wait for completion
            await db.query('DELETE FROM role WHERE id = ?', roleId);
            console.log(`Role "${roleTitle}" deleted from the database.`);
        } else {
            console.log('Role deletion cancelled.');
        }
    } catch (error) {
        console.error('Error during role deletion:', error.message);
    }
    // Regardless of the outcome, return to the main menu
    mainMenu();
}




async function updateEmployeeRole() {
    try {
        // Fetch employees and wait for the query to resolve
        const [employees] = await db.query('SELECT id, first_name, last_name FROM employee');

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

        // Fetch roles and wait for the query to resolve
        const [roles] = await db.query('SELECT id, title FROM role');

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

        // Update the employee's role in the database
        await db.query('UPDATE employee SET role_id = ? WHERE id = ?', [roleId, employeeId]);
        console.log('Updated employee role in the database');
    } catch (error) {
        console.error('Error updating employee role:', error.message);
    }
    mainMenu();
}

async function updateEmployeeManager() {
    try {
        const [employees] = await db.query('SELECT id, first_name, last_name FROM employee');

        const employeeChoices = employees.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }));

        const { employeeId } = await inquirer.prompt({
            type: 'list',
            name: 'employeeId',
            message: "Select the employee whose manager you want to update:",
            choices: employeeChoices
        });

        const managerChoices = employees.filter(({ id }) => id !== employeeId)
            .map(({ id, first_name, last_name }) => ({
                name: `${first_name} ${last_name}`,
                value: id
            }));

        // Add an option for no manager
        managerChoices.unshift({ name: 'None', value: null });

        const { managerId } = await inquirer.prompt({
            type: 'list',
            name: 'managerId',
            message: "Select the employee's new manager:",
            choices: managerChoices
        });

        await db.query('UPDATE employee SET manager_id = ? WHERE id = ?', [managerId, employeeId]);

        console.log('Employee manager updated successfully.');
    } catch (error) {
        console.error('Failed to update employee manager:', error.message);
    }
    mainMenu();
}

async function viewEmployeesByManager() {
    try {
        const [managers] = await db.query(`
            SELECT id, first_name, last_name 
            FROM employee 
            WHERE id IN (SELECT DISTINCT manager_id FROM employee WHERE manager_id IS NOT NULL)`);

        const managerChoices = managers.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }));

        const { managerId } = await inquirer.prompt({
            type: 'list',
            name: 'managerId',
            message: "Select a manager to view their employees:",
            choices: managerChoices
        });

        const [employees] = await db.query(`
            SELECT id, first_name, last_name 
            FROM employee 
            WHERE manager_id = ?`,
            managerId);

        console.table(employees);
    } catch (error) {
        console.error('Failed to fetch employees by manager:', error.message);
    }
    mainMenu();
}

async function viewEmployeesByDepartment() {
    try {
        const [departments] = await db.query('SELECT id, name FROM department');

        const departmentChoices = departments.map(({ id, name }) => ({
            name,
            value: id
        }));

        const { departmentId } = await inquirer.prompt({
            type: 'list',
            name: 'departmentId',
            message: "Select a department to view its employees:",
            choices: departmentChoices
        });

        const [employees] = await db.query(`
            SELECT employee.id, employee.first_name, employee.last_name, role.title
            FROM employee
            JOIN role ON employee.role_id = role.id
            WHERE role.department_id = ?`,
            departmentId);

        console.table(employees);
    } catch (error) {
        console.error('Failed to fetch employees by department:', error.message);
    }
    mainMenu();
}



// Start the application
mainMenu();
