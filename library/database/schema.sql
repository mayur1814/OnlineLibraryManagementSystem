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
    total_copies INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    isbn VARCHAR(50) DEFAULT NULL,
    image_url VARCHAR(1000) DEFAULT NULL,
    description TEXT DEFAULT NULL
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

INSERT INTO Books (id, title, author, category, quantity, total_copies, status, isbn, image_url, description) VALUES
(1, 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Software Engineering', 5, 5, 'AVAILABLE', '978-0132350884', '/images/covers/book-1.svg', 'Even bad code can function. But if code isn''t clean, it can bring a development organization to its knees. A timeless handbook for writing elegant, readable, and maintainable software.'),
(2, 'Introduction to Algorithms (CLRS)', 'Thomas H. Cormen', 'Computer Science', 3, 4, 'AVAILABLE', '978-0262033848', '/images/covers/book-2.svg', 'The leading textbook on computer algorithms, covering a broad range of algorithms in depth with mathematical rigor and accessible pseudocode.'),
(3, 'Java: The Complete Reference (12th Edition)', 'Herbert Schildt', 'Programming', 6, 6, 'AVAILABLE', '978-1260440232', '/images/covers/book-3.svg', 'A comprehensive guide to Java programming covering the Java language syntax, core libraries, concurrency utilities, and modern Java SE features.'),
(4, 'Spring Boot in Action', 'Craig Walls', 'Web Development', 4, 5, 'AVAILABLE', '978-1617292545', '/images/covers/book-4.svg', 'Hands-on guide to building production-ready enterprise applications with Spring Boot, covering auto-configuration, Spring Data, and security.'),
(5, 'Designing Data-Intensive Applications', 'Martin Kleppmann', 'Database Systems', 4, 4, 'AVAILABLE', '978-1449373320', '/images/covers/book-5.svg', 'An indispensable guide to the principles and architecture behind modern data storage, processing systems, distributed transactions, and replication.'),
(6, 'Artificial Intelligence: A Modern Approach', 'Stuart Russell & Peter Norvig', 'AI & Machine Learning', 2, 3, 'AVAILABLE', '978-0136042594', '/images/covers/book-6.svg', 'The authoritative textbook on artificial intelligence, spanning search, logical reasoning, probabilistic models, machine learning, and deep learning.'),
(7, 'Head First Design Patterns', 'Eric Freeman & Elisabeth Robson', 'Software Engineering', 5, 5, 'AVAILABLE', '978-0596007126', '/images/covers/book-7.svg', 'A visually rich and humorous guide to object-oriented software design patterns, making complex architecture intuitive and memorable.'),
(8, 'Database System Concepts', 'Abraham Silberschatz', 'Database Systems', 3, 4, 'AVAILABLE', '978-0073523323', '/images/covers/book-8.svg', 'Foundational concepts of relational databases, SQL, query processing, indexing, ACID transactions, and modern NoSQL systems.'),
(9, 'Operating System Concepts', 'Abraham Silberschatz & Peter Galvin', 'Computer Science', 4, 4, 'AVAILABLE', '978-1118063330', '/images/covers/book-9.svg', 'Classic ''Dinosaur Book'' covering processes, threads, CPU scheduling, memory management, file systems, and operating system security.'),
(10, 'Full Stack Development with Spring Boot & React', 'Juha Hinkula', 'Web Development', 3, 3, 'AVAILABLE', '978-1801816786', '/images/covers/book-10.svg', 'Step-by-step practical guide to architecting full-stack web applications using Spring Boot REST APIs and React frontend.'),
(11, 'Discrete Mathematics and Its Applications', 'Kenneth H. Rosen', 'Mathematics', 4, 4, 'AVAILABLE', '978-1259676512', '/images/covers/book-11.svg', 'Essential mathematical foundation for computer science students: sets, logic, proofs, combinatorics, graph theory, and Boolean algebra.'),
(12, 'The Pragmatic Programmer', 'David Thomas & Andrew Hunt', 'Software Engineering', 0, 2, 'UNAVAILABLE', '978-0201616224', '/images/covers/book-12.svg', 'Classic collection of practical advice and best practices for craftsmanship, career development, and building robust, resilient software.');

INSERT INTO Issue_Return (id, user_id, book_id, issue_date, return_date, status) VALUES
(1, 2, 1, '2026-10-01', NULL, 'ISSUED'),
(2, 2, 4, '2026-09-15', '2026-09-25', 'RETURNED'),
(3, 3, 2, '2026-10-03', NULL, 'ISSUED');
