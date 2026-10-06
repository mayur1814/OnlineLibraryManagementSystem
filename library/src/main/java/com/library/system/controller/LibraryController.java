package com.library.system.controller;

import com.library.system.model.Book;
import com.library.system.model.IssueReturn;
import com.library.system.model.User;
import com.library.system.repository.BookRepository;
import com.library.system.repository.IssueReturnRepository;
import com.library.system.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Map;
import java.util.Optional;

@RestController
public class LibraryController {
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final IssueReturnRepository issueReturnRepository;
    private final PasswordEncoder passwordEncoder;

    public LibraryController(
            UserRepository userRepository,
            BookRepository bookRepository,
            IssueReturnRepository issueReturnRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.issueReturnRepository = issueReturnRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (user.getName() == null || user.getName().isBlank()
                || user.getEmail() == null || user.getEmail().isBlank()
                || user.getPassword() == null || user.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body("Name, email, and password are required.");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("An account with this email already exists.");
        }

        user.setRole("STUDENT");
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Registration successful."));
    }

    @PostMapping("/login")
    @Transactional
    public ResponseEntity<?> loginUser(
            @RequestBody User loginData, HttpServletRequest request, HttpSession session) {
        if (loginData.getEmail() == null || loginData.getPassword() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password.");
        }
        Optional<User> userOpt = userRepository.findByEmail(loginData.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password.");
        }

        User user = userOpt.get();
        String storedPassword = user.getPassword();
        boolean encodedPassword = storedPassword != null && storedPassword.startsWith("$2");
        boolean passwordMatches = encodedPassword
                ? passwordEncoder.matches(loginData.getPassword(), storedPassword)
                : loginData.getPassword().equals(storedPassword);
        if (!passwordMatches) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password.");
        }
        if (!encodedPassword) {
            user.setPassword(passwordEncoder.encode(loginData.getPassword()));
            userRepository.save(user);
        }

        String role = user.getRole() == null ? "STUDENT" : user.getRole();
        request.changeSessionId();
        session.setAttribute("userId", user.getId());
        session.setAttribute("role", role);
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", role));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/books")
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    @GetMapping("/books/{id}")
    public ResponseEntity<?> getBookById(@PathVariable Long id) {
        return bookRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/books")
    public ResponseEntity<?> addBook(@RequestBody Book book, HttpSession session) {
        if (!isAdmin(session)) {
            return unauthorized();
        }
        if (!hasValidBookDetails(book)) {
            return ResponseEntity.badRequest().body("Title, author, category, and a non-negative quantity are required.");
        }
        book.setId(null);
        book.setStatus(book.getQuantity() > 0 ? "AVAILABLE" : "UNAVAILABLE");
        return ResponseEntity.status(HttpStatus.CREATED).body(bookRepository.save(book));
    }

    @PutMapping("/books/{id}")
    public ResponseEntity<?> updateBook(@PathVariable Long id, @RequestBody Book details, HttpSession session) {
        if (!isAdmin(session)) {
            return unauthorized();
        }
        if (!hasValidBookDetails(details)) {
            return ResponseEntity.badRequest().body("Title, author, category, and a non-negative quantity are required.");
        }
        Optional<Book> existing = bookRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Book book = existing.get();
        book.setTitle(details.getTitle());
        book.setAuthor(details.getAuthor());
        book.setCategory(details.getCategory());
        book.setQuantity(details.getQuantity());
        book.setStatus(details.getQuantity() > 0 ? "AVAILABLE" : "UNAVAILABLE");
        return ResponseEntity.ok(bookRepository.save(book));
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) {
            return unauthorized();
        }
        if (!bookRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        bookRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/issue")
    @Transactional
    public ResponseEntity<?> issueBook(@RequestBody IssueReturn issueRequest, HttpSession session) {
        if (issueRequest.getBookId() == null) {
            return ResponseEntity.badRequest().body("A book ID is required.");
        }
        Long sessionUserId = currentUserId(session);
        if (sessionUserId == null || !sessionUserId.equals(issueRequest.getUserId())) {
            return unauthorized();
        }

        Optional<Book> bookOpt = bookRepository.findById(issueRequest.getBookId());
        if (bookOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Book book = bookOpt.get();
        if (book.getQuantity() <= 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("This book is currently unavailable.");
        }

        book.setQuantity(book.getQuantity() - 1);
        book.setStatus(book.getQuantity() > 0 ? "AVAILABLE" : "UNAVAILABLE");
        bookRepository.save(book);

        issueRequest.setId(null);
        issueRequest.setIssueDate(LocalDate.now().toString());
        issueRequest.setReturnDate(null);
        issueRequest.setStatus("ISSUED");
        return ResponseEntity.status(HttpStatus.CREATED).body(issueReturnRepository.save(issueRequest));
    }

    @GetMapping("/issue/user/{userId}")
    public ResponseEntity<?> getUserIssues(@PathVariable Long userId, HttpSession session) {
        if (!userId.equals(currentUserId(session))) {
            return unauthorized();
        }
        return ResponseEntity.ok(issueReturnRepository.findByUserId(userId));
    }

    @PostMapping("/return")
    @Transactional
    public ResponseEntity<?> returnBook(@RequestBody IssueReturn returnRequest, HttpSession session) {
        Optional<IssueReturn> transactionOpt = issueReturnRepository.findById(returnRequest.getId());
        if (transactionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        IssueReturn transaction = transactionOpt.get();
        Long sessionUserId = currentUserId(session);
        if (sessionUserId == null || !Objects.equals(transaction.getUserId(), sessionUserId)) {
            return unauthorized();
        }
        if (!"ISSUED".equals(transaction.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("This book has already been returned.");
        }

        Optional<Book> bookOpt = bookRepository.findById(transaction.getBookId());
        if (bookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("The book record for this issue is missing.");
        }

        Book book = bookOpt.get();
        book.setQuantity(book.getQuantity() + 1);
        book.setStatus("AVAILABLE");
        transaction.setStatus("RETURNED");
        transaction.setReturnDate(LocalDate.now().toString());
        bookRepository.save(book);
        issueReturnRepository.save(transaction);
        return ResponseEntity.ok(Map.of("message", "Book returned successfully."));
    }

    private boolean hasValidBookDetails(Book book) {
        return book.getTitle() != null && !book.getTitle().isBlank()
                && book.getAuthor() != null && !book.getAuthor().isBlank()
                && book.getCategory() != null && !book.getCategory().isBlank()
                && book.getQuantity() >= 0;
    }

    private Long currentUserId(HttpSession session) {
        Object userId = session.getAttribute("userId");
        return userId instanceof Long id ? id : null;
    }

    private boolean isAdmin(HttpSession session) {
        return "ADMIN".equals(session.getAttribute("role"));
    }

    private ResponseEntity<String> unauthorized() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to perform this action.");
    }
}
