# ONLINE LIBRARY MANAGEMENT SYSTEM
## Final Internship Project Review Presentation Deck

---

### Slide 1: Title Slide
- **Project Title:** Online Library Management System
- **Domain:** Java Full Stack Web Development
- **Presenter:** Mayur Malve
- **Technologies:** Java, Spring Boot, MySQL, REST API, HTML5, CSS3, JavaScript

---

### Slide 2: Problem Statement & Objectives
- **Challenges in Traditional Libraries:** Manual registers, lost books, human error in recording dates, cumbersome inventory updates.
- **Project Objectives:**
  - Build a seamless web-based platform for students and librarians.
  - Implement real-time book tracking with automatic inventory adjustment.
  - Ensure role-based security separating student operations from administrative tasks.

---

### Slide 3: System Architecture
- **3-Tier Architecture:**
  - **Frontend:** Responsive Web App (HTML5, Vanilla CSS3 with Glassmorphism, ES6 JavaScript).
  - **Backend:** Spring Boot REST APIs with Service-Repository pattern.
  - **Database:** MySQL 8.0 relational schema with JPA Hibernate ORM.

---

### Slide 4: Database Design
- **Key Tables:**
  - `Users`: Stores students and admins with BCrypt hashed passwords.
  - `Books`: Manages book titles, authors, categories, quantities, and availability flags.
  - `Issue_Return`: Links users to borrowed books with issue dates, return dates, and transaction status.

---

### Slide 5: Student Experience
- Responsive public catalog with search and category filtering.
- One-click book issuance with immediate stock updates.
- Dedicated student dashboard showing active loans and quick return action.

---

### Slide 6: Administrator Control Center
- Dynamic KPI metrics (Total Books, Total Copies, Active Loans, Students).
- Full Book CRUD (Add, Edit Modal, Delete, Search).
- Student directory with active loan indicators.
- Comprehensive issue and return transaction logs.

---

### Slide 7: REST API Design
- Adheres to standard REST conventions:
  - `GET /books`, `POST /books`, `PUT /books/{id}`, `DELETE /books/{id}`
  - `POST /register`, `POST /login`, `POST /logout`
  - `POST /issue`, `POST /return`
  - `GET /users`, `GET /issues`, `GET /stats`

---

### Slide 8: Security & Validation
- BCrypt one-way password hashing.
- Server-side email format regex validation and duplicate account prevention.
- Transactional integrity ensuring concurrent issue/return safety.
- HTTP Session and role-based route guard checks.

---

### Slide 9: Live Demonstration Highlights
- Registering a new student account.
- Searching and issuing a programming book.
- Admin managing inventory and viewing student activity.
- Returning the book and verifying stock replenishment.

---

### Slide 10: Conclusion & Future Scope
- **Conclusion:** A complete, production-grade library system developed to high software engineering standards.
- **Future Enhancements:** Late return fine calculator, barcode/QR code book scanner, automated email due-date reminders.
