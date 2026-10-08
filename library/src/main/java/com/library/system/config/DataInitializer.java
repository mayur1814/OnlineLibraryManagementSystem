package com.library.system.config;

import com.library.system.model.Book;
import com.library.system.model.User;
import com.library.system.repository.BookRepository;
import com.library.system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

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

        // Ensure catalog is populated if empty
        if (bookRepository.count() == 0) {
            List<Book> initialBooks = List.of(
                new Book(null, "Clean Code: A Handbook of Agile Software Craftsmanship", "Robert C. Martin", "Software Engineering", 5, "AVAILABLE"),
                new Book(null, "Introduction to Algorithms (CLRS)", "Thomas H. Cormen", "Computer Science", 3, "AVAILABLE"),
                new Book(null, "Java: The Complete Reference (12th Edition)", "Herbert Schildt", "Programming", 6, "AVAILABLE"),
                new Book(null, "Spring Boot in Action", "Craig Walls", "Web Development", 4, "AVAILABLE"),
                new Book(null, "Designing Data-Intensive Applications", "Martin Kleppmann", "Database Systems", 4, "AVAILABLE"),
                new Book(null, "Artificial Intelligence: A Modern Approach", "Stuart Russell & Peter Norvig", "AI & Machine Learning", 2, "AVAILABLE"),
                new Book(null, "Head First Design Patterns", "Eric Freeman & Elisabeth Robson", "Software Engineering", 5, "AVAILABLE"),
                new Book(null, "Database System Concepts", "Abraham Silberschatz", "Database Systems", 3, "AVAILABLE"),
                new Book(null, "Operating System Concepts", "Abraham Silberschatz & Peter Galvin", "Computer Science", 4, "AVAILABLE"),
                new Book(null, "Full Stack Development with Spring Boot & React", "Juha Hinkula", "Web Development", 3, "AVAILABLE"),
                new Book(null, "Discrete Mathematics and Its Applications", "Kenneth H. Rosen", "Mathematics", 4, "AVAILABLE"),
                new Book(null, "The Pragmatic Programmer", "David Thomas & Andrew Hunt", "Software Engineering", 0, "UNAVAILABLE")
            );
            bookRepository.saveAll(initialBooks);
            System.out.println("[DataInitializer] Seeded " + initialBooks.size() + " library books into MySQL catalog.");
        }
    }
}
