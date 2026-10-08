# INTERNSHIP PROJECT REPORT
## ONLINE LIBRARY MANAGEMENT SYSTEM

**Domain:** Java Full Stack Web Development  
**Target Platform:** Web Application (RESTful Architecture)  
**Developer:** Mayur Malve  

---

### 1. Executive Summary
The Online Library Management System is a full-stack web application designed to digitize the traditional library workflow for academic institutions. Developed with Java Spring Boot on the backend and modern vanilla HTML5/CSS3/JavaScript on the frontend, the system facilitates paperless book tracking, automated inventory count adjustments, secure role-based access, and transparent auditing for both students and administrators.

---

### 2. System Architecture & Design
The system follows a 3-Tier Layered Architecture:
1. **Presentation Layer (Frontend):** Modern, responsive HTML5/CSS3/JavaScript interface communicating with the backend exclusively via asynchronous HTTP REST calls (`fetch` API).
2. **Business Logic & Service Layer (Backend):** Built with Java 17 and Spring Boot. Separated into:
   - `controller/`: Request routing and HTTP response wrapping.
   - `service/`: Transaction management, stock validation, and business rule enforcement.
   - `repository/`: Spring Data JPA abstractions for optimized database access.
   - `dto/` & `model/`: Domain entities with validation constraints.
3. **Data Persistence Layer (MySQL Database):** Relational tables (`Users`, `Books`, `Issue_Return`) with foreign key constraints and automated schema migration.

---

### 3. Core Modules & Implementation Details

#### 3.1 Student Portal
- **Registration & Validation:** Enforces strict regex validation for email formatting and mobile numbers, alongside BCrypt password encryption.
- **Catalog Browsing:** Allows filtering through all cataloged books with live category and stock availability tags.
- **Issuing Mechanism:** Prevents issuing out-of-stock books (`quantity = 0`). Automatically decrements available copies upon issuance.
- **Self-Service Returns:** Students can view their borrowing history and return issued books with an automated return date timestamp and inventory restoration.

#### 3.2 Administrator Control Center
- **Inventory CRUD:** Full lifecycle management of books (Create, Read, Update, Delete) with interactive modal windows.
- **Student Monitoring:** Complete visibility of all registered students and their respective active borrowing load.
- **Transaction Audit Log:** Complete historical record of all issue and return transactions with timestamps.
- **KPI Metrics Dashboard:** Real-time summary tiles showing total books, copies, active loans, and student enrollment.

---

### 4. Database Schema
- **`Users`**: `id` (PK), `name`, `email` (Unique), `mobile`, `password` (BCrypt), `role` (`STUDENT`/`ADMIN`).
- **`Books`**: `id` (PK), `title`, `author`, `category`, `quantity`, `status` (`AVAILABLE`/`UNAVAILABLE`).
- **`Issue_Return`**: `id` (PK), `user_id` (FK), `book_id` (FK), `issue_date`, `return_date`, `status` (`ISSUED`/`RETURNED`).

---

### 5. Conclusion
The Online Library Management System fulfills all technical and functional internship requirements. It delivers robust data consistency, high responsiveness, and an intuitive user interface suitable for immediate deployment in an educational environment.
