package com.library.system.config;

import com.library.system.model.Book;
import com.library.system.model.User;
import com.library.system.repository.BookRepository;
import com.library.system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           BookRepository bookRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Ensure default admin user exists
        if (userRepository.findByEmail("admin@library.com").isEmpty()) {
            User admin = new User();
            admin.setName("Library Administrator");
            admin.setEmail("admin@library.com");
            admin.setMobile("9876543210");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            userRepository.save(admin);
            System.out.println("[DataInitializer] Created default admin: admin@library.com / admin123");
        }

        // Ensure default student demo user exists
        if (userRepository.findByEmail("student@library.com").isEmpty()) {
            User student = new User();
            student.setName("Aarav Sharma");
            student.setEmail("student@library.com");
            student.setMobile("9822012345");
            student.setPassword(passwordEncoder.encode("student123"));
            student.setRole("STUDENT");
            userRepository.save(student);
            System.out.println("[DataInitializer] Created demo student: student@library.com / student123");
        }

        List<Book> initialBooks = getSeedBooks();

        // Ensure catalog is populated if empty
        if (bookRepository.count() == 0) {
            bookRepository.saveAll(initialBooks);
            System.out.println("[DataInitializer] Seeded " + initialBooks.size() + " library books with cover images into catalog.");
        } else {
            // Update existing books with cover images, ISBN, and descriptions if missing
            List<Book> existing = bookRepository.findAll();
            Map<String, Book> seedMap = initialBooks.stream()
                    .collect(java.util.stream.Collectors.toMap(Book::getTitle, b -> b, (b1, b2) -> b1));

            boolean updatedAny = false;
            for (Book b : existing) {
                Book seed = seedMap.get(b.getTitle());
                boolean changed = false;

                if (b.getImageUrl() == null || b.getImageUrl().isBlank()) {
                    b.setImageUrl(seed != null ? seed.getImageUrl() : "/images/covers/default-cover.svg");
                    changed = true;
                }
                if (b.getIsbn() == null || b.getIsbn().isBlank()) {
                    b.setIsbn(seed != null ? seed.getIsbn() : "978-0" + (100000000L + (b.getId() != null ? b.getId() : 1)));
                    changed = true;
                }
                if (b.getDescription() == null || b.getDescription().isBlank()) {
                    b.setDescription(seed != null ? seed.getDescription() : "Standard academic reference edition.");
                    changed = true;
                }
                if (b.getTotalCopies() == null || b.getTotalCopies() <= 0) {
                    b.setTotalCopies(seed != null ? seed.getTotalCopies() : Math.max(b.getQuantity(), 5));
                    changed = true;
                }

                if (changed) {
                    bookRepository.save(b);
                    updatedAny = true;
                }
            }
            if (updatedAny) {
                System.out.println("[DataInitializer] Updated existing catalog records with cover images, ISBNs, and details.");
            }
        }
    }

    private List<Book> getSeedBooks() {
        return List.of(
            new Book(null, "Clean Code: A Handbook of Agile Software Craftsmanship", "Robert C. Martin",
                "Software Engineering", 5, 5, "AVAILABLE", "978-0132350884", "/images/covers/book-1.svg",
                "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. A timeless handbook for writing elegant, readable, and maintainable software."),

            new Book(null, "Introduction to Algorithms (CLRS)", "Thomas H. Cormen",
                "Computer Science", 3, 4, "AVAILABLE", "978-0262033848", "/images/covers/book-2.svg",
                "The leading textbook on computer algorithms, covering a broad range of algorithms in depth with mathematical rigor and accessible pseudocode."),

            new Book(null, "Java: The Complete Reference (12th Edition)", "Herbert Schildt",
                "Programming", 6, 6, "AVAILABLE", "978-1260440232", "/images/covers/book-3.svg",
                "A comprehensive guide to Java programming covering the Java language syntax, core libraries, concurrency utilities, and modern Java SE features."),

            new Book(null, "Spring Boot in Action", "Craig Walls",
                "Web Development", 4, 5, "AVAILABLE", "978-1617292545", "/images/covers/book-4.svg",
                "Hands-on guide to building production-ready enterprise applications with Spring Boot, covering auto-configuration, Spring Data, and security."),

            new Book(null, "Designing Data-Intensive Applications", "Martin Kleppmann",
                "Database Systems", 4, 4, "AVAILABLE", "978-1449373320", "/images/covers/book-5.svg",
                "An indispensable guide to the principles and architecture behind modern data storage, processing systems, distributed transactions, and replication."),

            new Book(null, "Artificial Intelligence: A Modern Approach", "Stuart Russell & Peter Norvig",
                "AI & Machine Learning", 2, 3, "AVAILABLE", "978-0136042594", "/images/covers/book-6.svg",
                "The authoritative textbook on artificial intelligence, spanning search, logical reasoning, probabilistic models, machine learning, and deep learning."),

            new Book(null, "Head First Design Patterns", "Eric Freeman & Elisabeth Robson",
                "Software Engineering", 5, 5, "AVAILABLE", "978-0596007126", "/images/covers/book-7.svg",
                "A visually rich and humorous guide to object-oriented software design patterns, making complex architecture intuitive and memorable."),

            new Book(null, "Database System Concepts", "Abraham Silberschatz",
                "Database Systems", 3, 4, "AVAILABLE", "978-0073523323", "/images/covers/book-8.svg",
                "Foundational concepts of relational databases, SQL, query processing, indexing, ACID transactions, and modern NoSQL systems."),

            new Book(null, "Operating System Concepts", "Abraham Silberschatz & Peter Galvin",
                "Computer Science", 4, 4, "AVAILABLE", "978-1118063330", "/images/covers/book-9.svg",
                "Classic 'Dinosaur Book' covering processes, threads, CPU scheduling, memory management, file systems, and operating system security."),

            new Book(null, "Full Stack Development with Spring Boot & React", "Juha Hinkula",
                "Web Development", 3, 3, "AVAILABLE", "978-1801816786", "/images/covers/book-10.svg",
                "Step-by-step practical guide to architecting full-stack web applications using Spring Boot REST APIs and React frontend."),

            new Book(null, "Discrete Mathematics and Its Applications", "Kenneth H. Rosen",
                "Mathematics", 4, 4, "AVAILABLE", "978-1259676512", "/images/covers/book-11.svg",
                "Essential mathematical foundation for computer science students: sets, logic, proofs, combinatorics, graph theory, and Boolean algebra."),

            new Book(null, "The Pragmatic Programmer", "David Thomas & Andrew Hunt",
                "Software Engineering", 0, 2, "UNAVAILABLE", "978-0201616224", "/images/covers/book-12.svg",
                "Classic collection of practical advice and best practices for craftsmanship, career development, and building robust, resilient software.")
        );
    }
}
