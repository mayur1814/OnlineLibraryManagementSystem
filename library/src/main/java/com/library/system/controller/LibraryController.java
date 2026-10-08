package com.library.system.controller;

import com.library.system.dto.DashboardStatsDto;
import com.library.system.dto.IssueDetailDto;
import com.library.system.dto.UserResponseDto;
import com.library.system.model.Book;
import com.library.system.model.IssueReturn;
import com.library.system.model.User;
import com.library.system.service.BookService;
import com.library.system.service.IssueReturnService;
import com.library.system.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class LibraryController {
    private final UserService userService;
    private final BookService bookService;
    private final IssueReturnService issueReturnService;

    public LibraryController(UserService userService,
                             BookService bookService,
                             IssueReturnService issueReturnService) {
        this.userService = userService;
        this.bookService = bookService;
        this.issueReturnService = issueReturnService;
    }

    // -------------------------------------------------------------
    // Authentication Endpoints
    // -------------------------------------------------------------
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User registered = userService.registerStudent(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Registration successful. You can now log in.",
                    "userId", registered.getId()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData,
                                       HttpServletRequest request,
                                       HttpSession session) {
        try {
            String email = loginData.get("email");
            String password = loginData.get("password");

            User user = userService.authenticateUser(email, password);

            // Establish secure session
            request.changeSessionId();
            session.setAttribute("userId", user.getId());
            session.setAttribute("role", user.getRole());
            session.setAttribute("userName", user.getName());
            session.setAttribute("email", user.getEmail());

            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "message", "Login successful."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/auth/me")
    public ResponseEntity<?> getCurrentAuthUser(HttpSession session) {
        Long userId = getSessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("authenticated", false));
        }
        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "id", userId,
                "name", session.getAttribute("userName"),
                "email", session.getAttribute("email"),
                "role", session.getAttribute("role")
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }

    // -------------------------------------------------------------
    // Books Endpoints (Section 12 specification)
    // -------------------------------------------------------------
    @GetMapping("/books")
    public List<Book> getAllBooks(@RequestParam(value = "search", required = false) String search) {
        if (search != null && !search.isBlank()) {
            return bookService.searchBooks(search);
        }
        return bookService.getAllBooks();
    }

    @GetMapping("/books/{id}")
    public ResponseEntity<?> getBookById(@PathVariable Long id) {
        return bookService.getBookById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Book not found with ID: " + id)));
    }

    @PostMapping("/books")
    public ResponseEntity<?> addBook(@RequestBody Book book, HttpSession session) {
        if (!isAdmin(session)) {
            return forbiddenResponse();
        }
        try {
            Book created = bookService.addBook(book);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/books/{id}")
    public ResponseEntity<?> updateBook(@PathVariable Long id, @RequestBody Book book, HttpSession session) {
        if (!isAdmin(session)) {
            return forbiddenResponse();
        }
        try {
            Book updated = bookService.updateBook(id, book);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) {
            return forbiddenResponse();
        }
        try {
            bookService.deleteBook(id);
            return ResponseEntity.ok(Map.of("message", "Book deleted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    // -------------------------------------------------------------
    // Issue & Return Endpoints (Section 12 specification)
    // -------------------------------------------------------------
    @PostMapping("/issue")
    public ResponseEntity<?> issueBook(@RequestBody Map<String, Object> payload, HttpSession session) {
        Long sessionUserId = getSessionUserId(session);
        Long requestedUserId = payload.get("userId") != null ? Long.valueOf(payload.get("userId").toString()) : sessionUserId;
        Long bookId = payload.get("bookId") != null ? Long.valueOf(payload.get("bookId").toString()) : null;

        if (requestedUserId == null || bookId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User ID and Book ID are required."));
        }

        // Only allow student to issue for themselves unless admin
        if (!isAdmin(session) && (sessionUserId == null || !sessionUserId.equals(requestedUserId))) {
            return forbiddenResponse();
        }

        try {
            IssueReturn record = issueReturnService.issueBook(requestedUserId, bookId);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Book issued successfully.",
                    "transaction", record
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/return")
    public ResponseEntity<?> returnBook(@RequestBody Map<String, Object> payload, HttpSession session) {
        Long issueId = payload.get("id") != null ? Long.valueOf(payload.get("id").toString()) : null;
        if (issueId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Transaction ID is required."));
        }

        Long sessionUserId = getSessionUserId(session);
        boolean admin = isAdmin(session);

        try {
            IssueReturn returned = issueReturnService.returnBook(issueId, sessionUserId, admin);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Book returned successfully.",
                    "transaction", returned
            ));
        } catch (SecurityException e) {
            return forbiddenResponse();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/issue/user/{userId}")
    public ResponseEntity<?> getUserIssues(@PathVariable Long userId, HttpSession session) {
        Long sessionUserId = getSessionUserId(session);
        if (!isAdmin(session) && (sessionUserId == null || !sessionUserId.equals(userId))) {
            return forbiddenResponse();
        }
        List<IssueDetailDto> list = issueReturnService.getStudentIssues(userId);
        return ResponseEntity.ok(list);
    }

    // -------------------------------------------------------------
    // Admin Management Endpoints
    // -------------------------------------------------------------
    @GetMapping("/users")
    public ResponseEntity<?> getAllStudents(HttpSession session) {
        if (!isAdmin(session)) {
            return forbiddenResponse();
        }
        List<UserResponseDto> students = userService.getAllStudents();
        return ResponseEntity.ok(students);
    }

    @GetMapping("/issues")
    public ResponseEntity<?> getAllIssues(HttpSession session) {
        if (!isAdmin(session)) {
            return forbiddenResponse();
        }
        List<IssueDetailDto> transactions = issueReturnService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(issueReturnService.getDashboardStats());
    }

    // -------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------
    private Long getSessionUserId(HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id instanceof Long l) return l;
        if (id instanceof Integer i) return i.longValue();
        return null;
    }

    private boolean isAdmin(HttpSession session) {
        return "ADMIN".equalsIgnoreCase((String) session.getAttribute("role"));
    }

    private ResponseEntity<?> forbiddenResponse() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "success", false,
                "message", "Access denied. Administrator privileges required."
        ));
    }
}
