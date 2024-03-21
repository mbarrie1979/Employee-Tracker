-- seeds.sql
USE company_db;

-- Insert sample departments
INSERT INTO department (name) VALUES
('Engineering'),
('Human Resources'),
('Marketing'),
('Sales'),
('Finance');

-- Insert sample roles
INSERT INTO role (title, salary, department_id) VALUES
('Software Engineer', 70000.00, 1),
('HR Manager', 65000.00, 2),
('Marketing Coordinator', 60000.00, 3),
('Sales Representative', 55000.00, 4),
('Accountant', 50000.00, 5);

-- Insert sample employees
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES
('John', 'Doe', 1, NULL),
('Jane', 'Doe', 2, NULL),
('Jim', 'Beam', 3, 1),
('Jack', 'Daniels', 4, 1),
('Josie', 'Wales', 1, 2),
('Jill', 'Valentine', 5, 2),
('Chris', 'Redfield', 2, 3),
('Leon', 'Kennedy', 3, 3),
('Claire', 'Redfield', 4, 4),
('Ada', 'Wong', 5, 4);
