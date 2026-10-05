package com.library.system.controller;

import com.library.system.model.Book;
import com.library.system.model.IssueReturn;
import com.library.system.model.User;
import com.library.system.repository.BookRepository;
import com.library.system.repository.IssueReturnRepository;
import com.library.system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
public class LibraryController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private IssueReturnRepository issueReturnRepository;

    // 1. Register Student
    @PostMapping("/register")
    public String registerUser(@RequestBody User user) {
        Optional<User> existing = userRepository.findByEmail(user.getEmail());
        if (existing.isPresent()) {
            return "Error: Email already exists!";
        }
        user.setRole("STUDENT"); // Default role
        userRepository.save(user);
        return "Registration successful!";
    }

    // 2. Login
    @PostMapping("/login")
    public String loginUser(@RequestBody User loginData) {
        Optional<User> userOpt = userRepository.findByEmail(loginData.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(loginData.getPassword())) {
                return "Login successful! Role: " + user.getRole();
            }
        }
        return "Invalid email or password!";
    }

    // 3. Get All Books
    @GetMapping("/books")
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    // 4. Get Book by ID
    @GetMapping("/books/{id}")
    public Book getBookById(@PathVariable Long id) {
        return bookRepository.findById(id).orElse(null);
    }

    // 5. Add a Book (Admin)
    @PostMapping("/books")
    public Book addBook(@RequestBody Book book) {
        return bookRepository.save(book);
    }

    // 6. Update a Book (Admin)
    @PutMapping("/books/{id}")
    public Book updateBook(@PathVariable Long id, @RequestBody Book bookDetails) {
        Book book = bookRepository.findById(id).orElse(null);
        if (book != null) {
            book.setTitle(bookDetails.getTitle());
            book.setAuthor(bookDetails.getAuthor());
            book.setCategory(bookDetails.getCategory());
            book.setQuantity(bookDetails.getQuantity());
            book.setStatus(bookDetails.getStatus());
            return bookRepository.save(book);
        }
        return null;
    }

    // 7. Delete a Book (Admin)
    @DeleteMapping("/books/{id}")
    public String deleteBook(@PathVariable Long id) {
        bookRepository.deleteById(id);
        return "Book deleted successfully!";
    }

    // 8. Issue a Book
    @PostMapping("/issue")
    public String issueBook(@RequestBody IssueReturn issueRequest) {
        Book book = bookRepository.findById(issueRequest.getBookId()).orElse(null);
        if (book != null && book.getQuantity() > 0) {
            book.setQuantity(book.getQuantity() - 1);
            if(book.getQuantity() == 0) {
                book.setStatus("UNAVAILABLE");
            }
            bookRepository.save(book);

            issueRequest.setStatus("ISSUED");
            issueReturnRepository.save(issueRequest);
            return "Book issued successfully!";
        }
        return "Book is unavailable!";
    }

    // 9. Return a Book
    @PostMapping("/return")
    public String returnBook(@RequestBody IssueReturn returnRequest) {
        IssueReturn transaction = issueReturnRepository.findById(returnRequest.getId()).orElse(null);
        if (transaction != null) {
            transaction.setStatus("RETURNED");
            issueReturnRepository.save(transaction);

            Book book = bookRepository.findById(transaction.getBookId()).orElse(null);
            if (book != null) {
                book.setQuantity(book.getQuantity() + 1);
                book.setStatus("AVAILABLE");
                bookRepository.save(book);
            }
            return "Book returned successfully!";
        }
        return "Transaction not found!";
    }
}