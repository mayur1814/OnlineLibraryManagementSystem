-- ========================================================
-- ONLINE LIBRARY MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Target Database: MySQL 8.0+
-- Database Name: library_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- Drop existing tables to recreate clean structure if needed
DROP TABLE IF EXISTS Issue_Return;
DROP TABLE IF EXISTS issue_return;
DROP TABLE IF EXISTS Books;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS users;

-- 1. Users Table (Stores students and administrators)
CREATE TABLE Users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mobile VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT'
);

-- 2. Books Table (Stores library book inventory)
CREATE TABLE Books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE'
);

-- 3. Issue_Return Table (Stores transactions for issued and returned books)
CREATE TABLE Issue_Return (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    issue_date VARCHAR(50) NOT NULL,
    return_date VARCHAR(50) DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_book FOREIGN KEY (book_id) REFERENCES Books(id) ON DELETE CASCADE
);

-- ========================================================
-- SEED INITIAL DATA
-- Default Passwords (BCrypt encrypted):
-- admin@library.com     / admin123
-- mayurmalve14@gmail.com / student123
-- student@library.com   / student123
-- ========================================================

INSERT INTO Users (id, name, email, mobile, password, role) VALUES
(1, 'System Administrator', 'admin@library.com', '9876543210', 'admin123', 'ADMIN'),
(2, 'Mayur Malve', 'mayurmalve14@gmail.com', '7517768655', 'student123', 'STUDENT'),
(3, 'Aarav Sharma', 'student@library.com', '9822012345', 'student123', 'STUDENT');

INSERT INTO Books (id, title, author, category, quantity, status) VALUES
(1, 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Software Engineering', 5, 'AVAILABLE'),
(2, 'Introduction to Algorithms (CLRS)', 'Thomas H. Cormen', 'Computer Science', 3, 'AVAILABLE'),
(3, 'Java: The Complete Reference (12th Edition)', 'Herbert Schildt', 'Programming', 6, 'AVAILABLE'),
(4, 'Spring Boot in Action', 'Craig Walls', 'Web Development', 4, 'AVAILABLE'),
(5, 'Designing Data-Intensive Applications', 'Martin Kleppmann', 'Database Systems', 4, 'AVAILABLE'),
(6, 'Artificial Intelligence: A Modern Approach', 'Stuart Russell & Peter Norvig', 'AI & Machine Learning', 2, 'AVAILABLE'),
(7, 'Head First Design Patterns', 'Eric Freeman & Elisabeth Robson', 'Software Engineering', 5, 'AVAILABLE'),
(8, 'Database System Concepts', 'Abraham Silberschatz', 'Database Systems', 3, 'AVAILABLE'),
(9, 'Operating System Concepts', 'Abraham Silberschatz & Peter Galvin', 'Computer Science', 4, 'AVAILABLE'),
(10, 'Full Stack Development with Spring Boot & React', 'Juha Hinkula', 'Web Development', 3, 'AVAILABLE'),
(11, 'Discrete Mathematics and Its Applications', 'Kenneth H. Rosen', 'Mathematics', 4, 'AVAILABLE'),
(12, 'The Pragmatic Programmer', 'David Thomas & Andrew Hunt', 'Software Engineering', 0, 'UNAVAILABLE');

INSERT INTO Issue_Return (id, user_id, book_id, issue_date, return_date, status) VALUES
(1, 2, 1, '2026-10-01', NULL, 'ISSUED'),
(2, 2, 4, '2026-09-15', '2026-09-25', 'RETURNED'),
(3, 3, 2, '2026-10-03', NULL, 'ISSUED');
