package com.library.system.service;

import com.library.system.model.Book;
import com.library.system.repository.BookRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BookService {
    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<Book> getBookById(Long id) {
        return bookRepository.findById(id);
    }

    public List<Book> searchBooks(String keyword) {
        if (keyword == null || keyword.trim().isBlank()) {
            return bookRepository.findAll();
        }
        String term = keyword.trim();
        return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrCategoryContainingIgnoreCase(
                term, term, term);
    }

    @Transactional
    public Book addBook(Book book) {
        validateBookDetails(book);
        book.setId(null);
        book.setTitle(book.getTitle().trim());
        book.setAuthor(book.getAuthor().trim());
        book.setCategory(book.getCategory().trim());
        book.setStatus(book.getQuantity() > 0 ? "AVAILABLE" : "UNAVAILABLE");
        return bookRepository.save(book);
    }

    @Transactional
    public Book updateBook(Long id, Book details) {
        validateBookDetails(details);
        Book existing = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + id));

        existing.setTitle(details.getTitle().trim());
        existing.setAuthor(details.getAuthor().trim());
        existing.setCategory(details.getCategory().trim());
        existing.setQuantity(details.getQuantity());
        existing.setStatus(details.getQuantity() > 0 ? "AVAILABLE" : "UNAVAILABLE");

        return bookRepository.save(existing);
    }

    @Transactional
    public void deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new IllegalArgumentException("Book not found with ID: " + id);
        }
        bookRepository.deleteById(id);
    }

    public long getTotalBooksCount() {
        return bookRepository.count();
    }

    public long getTotalPhysicalCopies() {
        return bookRepository.sumAllQuantities();
    }

    public long getAvailableBooksCount() {
        return bookRepository.countByStatus("AVAILABLE");
    }

    private void validateBookDetails(Book book) {
        if (book.getTitle() == null || book.getTitle().trim().isBlank()) {
            throw new IllegalArgumentException("Book title cannot be empty.");
        }
        if (book.getAuthor() == null || book.getAuthor().trim().isBlank()) {
            throw new IllegalArgumentException("Author cannot be empty.");
        }
        if (book.getCategory() == null || book.getCategory().trim().isBlank()) {
            throw new IllegalArgumentException("Category cannot be empty.");
        }
        if (book.getQuantity() < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative.");
        }
    }
}
