# Online Library Management System

A web-based **Online Library Management System** developed using **Java Full Stack** technologies (Spring Boot, MySQL, REST APIs, HTML5, Vanilla CSS3, and JavaScript).

Developed as an **Internship Project** for Java Full Stack Web Development.

---

## 🚀 Key Features

### 👤 Student Module
- **Registration & Authentication**: Student registration with real-time email, mobile, and password validation.
- **Book Discovery**: Real-time search across titles, authors, and categories with live availability indicator.
- **Book Issuing**: One-click book issuing with stock verification and automatic inventory deduction.
- **Book Returning**: View active loans and return books with a single click; automatically restores inventory.
- **Student Dashboard**: Live overview of active loans and catalog statistics.

### 🛡️ Admin Module
- **Secure Admin Authentication**: Dedicated administrator access.
- **Book Inventory Management (CRUD)**:
  - Add new books with category, author, and quantity.
  - Update existing book records via modal dialog.
  - Delete books from the catalog.
- **Registered Student Records**: View all registered students with contact info and active borrowing counts.
- **Issue & Return Tracking**: View complete audit trail of all transactions across all students.
- **Dashboard Metrics**: Real-time KPI counters (Total Titles, Total Physical Copies, Currently Issued, Registered Students).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS3 (Glassmorphism, Responsive), Vanilla JavaScript (ES6+ REST client) |
| **Backend** | Java 17+, Spring Boot 4.x, Spring Data JPA, Hibernate, Spring Security Crypto (BCrypt) |
| **Database** | MySQL 8.0+ |
| **API Architecture** | RESTful JSON APIs |
| **Build Tool** | Apache Maven |

---

## 📂 Project Architecture

```
OnlineLibraryManagementSystem/
├── database/
│   └── schema.sql              # MySQL DDL & Seed Script
├── library/                    # Spring Boot Application
│   ├── src/main/java/com/library/system/
│   │   ├── LibraryApplication.java
│   │   ├── config/             # PasswordConfig, WebConfig, DataInitializer
│   │   ├── controller/         # LibraryController (REST endpoints)
│   │   ├── dto/                # IssueDetailDto, UserResponseDto, DashboardStatsDto
│   │   ├── model/              # User, Book, IssueReturn entities
│   │   ├── repository/         # UserRepository, BookRepository, IssueReturnRepository
│   │   └── service/            # UserService, BookService, IssueReturnService
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── static/             # Responsive Web Frontend
│   │       ├── index.html      # Landing Page & Public Catalog
│   │       ├── login.html      # Authentication Portal
│   │       ├── register.html   # Student Registration
│   │       ├── student-dashboard.html
│   │       ├── admin-dashboard.html
│   │       ├── css/style.css
│   │       └── js/script.js
│   └── pom.xml
├── README.md                   # Setup and Run Guide
├── REPORT.md                   # Project Report
└── PRESENTATION.md             # Review Presentation Notes
```

---

## 🔑 Default Credentials

| Role | Email | Password | Purpose |
|---|---|---|---|
| **Administrator** | `admin@library.com` | `admin123` | Full administrative control |
| **Demo Student** | `student@library.com` | `student123` | Student portal testing |
| **Registered Student** | `mayurmalve14@gmail.com` | `student123` | Pre-registered student account |

*Note: Quick demo buttons are provided on `login.html` for single-click credential auto-fill.*

---

## ⚙️ Setup & Run Instructions

### 1. Prerequisites
- **Java Development Kit (JDK 17+)**
- **MySQL Server (8.0+)** running on port `3306`
- Web browser (Chrome, Edge, Firefox)

### 2. Configure MySQL Database
1. Make sure MySQL service is running.
2. The database `library_db` will be created automatically on startup by Spring Boot, or you can manually run the script:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
3. Update database credentials in `library/src/main/resources/application.properties` if your MySQL password differs:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/library_db?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC&createDatabaseIfNotExist=true
   spring.datasource.username=root
   spring.datasource.password=1234567
   ```

### 3. Run the Spring Boot Backend
Navigate to the `library` directory and run:
```bash
# Windows
mvnw.cmd spring-boot:run

# Linux / Mac
./mvnw spring-boot:run
```

### 4. Access the Application
Open your web browser and navigate to:
```
http://localhost:8081/index.html
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/register` | Register a new student | Public |
| `POST` | `/login` | Authenticate user & start session | Public |
| `POST` | `/logout` | Invalidate current session | Authenticated |
| `GET` | `/auth/me` | Get current session details | Authenticated |
| `GET` | `/books` | List books (supports `?search=query`) | Public |
| `GET` | `/books/{id}` | Get book by ID | Public |
| `POST` | `/books` | Add a new book | Admin Only |
| `PUT` | `/books/{id}` | Update book details | Admin Only |
| `DELETE` | `/books/{id}` | Delete book from catalog | Admin Only |
| `POST` | `/issue` | Issue a book to student | Student / Admin |
| `POST` | `/return` | Return an issued book | Student / Admin |
| `GET` | `/issue/user/{userId}` | Get student's loan history | Student (self) / Admin |
| `GET` | `/users` | Get all registered students | Admin Only |
| `GET` | `/issues` | Get all transactions across library | Admin Only |
| `GET` | `/stats` | Summary metrics for dashboard | Public |
