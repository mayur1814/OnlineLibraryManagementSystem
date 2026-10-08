package com.library.system.service;

import com.library.system.dto.DashboardStatsDto;
import com.library.system.dto.IssueDetailDto;
import com.library.system.model.Book;
import com.library.system.model.IssueReturn;
import com.library.system.model.User;
import com.library.system.repository.BookRepository;
import com.library.system.repository.IssueReturnRepository;
import com.library.system.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class IssueReturnService {
    private final IssueReturnRepository issueReturnRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    public IssueReturnService(IssueReturnRepository issueReturnRepository,
                              BookRepository bookRepository,
                              UserRepository userRepository) {
        this.issueReturnRepository = issueReturnRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public IssueReturn issueBook(Long userId, Long bookId) {
        if (userId == null || bookId == null) {
            throw new IllegalArgumentException("User ID and Book ID are required.");
        }

        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with ID: " + bookId));

        if (book.getQuantity() <= 0) {
            throw new IllegalStateException("Book '" + book.getTitle() + "' is currently unavailable (0 copies in stock).");
        }

        // Decrement quantity and update book status
        book.setQuantity(book.getQuantity() - 1);
        book.setStatus(book.getQuantity() > 0 ? "AVAILABLE" : "UNAVAILABLE");
        bookRepository.save(book);

        // Record issue transaction
        IssueReturn transaction = new IssueReturn();
        transaction.setUserId(userId);
        transaction.setBookId(bookId);
        transaction.setIssueDate(LocalDate.now().toString());
        transaction.setReturnDate(null);
        transaction.setStatus("ISSUED");

        return issueReturnRepository.save(transaction);
    }

    @Transactional
    public IssueReturn returnBook(Long issueId, Long sessionUserId, boolean isAdmin) {
        if (issueId == null) {
            throw new IllegalArgumentException("Transaction ID is required to return book.");
        }

        IssueReturn transaction = issueReturnRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue record not found with ID: " + issueId));

        if (!isAdmin && !transaction.getUserId().equals(sessionUserId)) {
            throw new SecurityException("You are not authorized to return a book issued by another student.");
        }

        if ("RETURNED".equalsIgnoreCase(transaction.getStatus())) {
            throw new IllegalStateException("This book has already been returned on " + transaction.getReturnDate());
        }

        Book book = bookRepository.findById(transaction.getBookId())
                .orElseThrow(() -> new IllegalStateException("Book record associated with this transaction was not found."));

        // Increase quantity and update availability
        book.setQuantity(book.getQuantity() + 1);
        book.setStatus("AVAILABLE");
        bookRepository.save(book);

        // Update transaction
        transaction.setStatus("RETURNED");
        transaction.setReturnDate(LocalDate.now().toString());

        return issueReturnRepository.save(transaction);
    }

    public List<IssueDetailDto> getStudentIssues(Long userId) {
        List<IssueReturn> transactions = issueReturnRepository.findByUserIdOrderByIssueDateDesc(userId);
        Map<Long, Book> bookMap = bookRepository.findAllById(
                transactions.stream().map(IssueReturn::getBookId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Book::getId, Function.identity()));

        User user = userRepository.findById(userId).orElse(null);

        return transactions.stream().map(tx -> {
            Book b = bookMap.get(tx.getBookId());
            return IssueDetailDto.builder()
                    .id(tx.getId())
                    .userId(tx.getUserId())
                    .userName(user != null ? user.getName() : "Unknown")
                    .userEmail(user != null ? user.getEmail() : "")
                    .userMobile(user != null ? user.getMobile() : "")
                    .bookId(tx.getBookId())
                    .bookTitle(b != null ? b.getTitle() : "Book ID #" + tx.getBookId())
                    .bookAuthor(b != null ? b.getAuthor() : "N/A")
                    .bookCategory(b != null ? b.getCategory() : "N/A")
                    .issueDate(tx.getIssueDate())
                    .returnDate(tx.getReturnDate())
                    .status(tx.getStatus())
                    .build();
        }).collect(Collectors.toList());
    }

    public List<IssueDetailDto> getAllTransactions() {
        List<IssueReturn> transactions = issueReturnRepository.findAllByOrderByIssueDateDesc();
        Map<Long, Book> bookMap = bookRepository.findAllById(
                transactions.stream().map(IssueReturn::getBookId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Book::getId, Function.identity()));

        Map<Long, User> userMap = userRepository.findAllById(
                transactions.stream().map(IssueReturn::getUserId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(User::getId, Function.identity()));

        return transactions.stream().map(tx -> {
            Book b = bookMap.get(tx.getBookId());
            User u = userMap.get(tx.getUserId());
            return IssueDetailDto.builder()
                    .id(tx.getId())
                    .userId(tx.getUserId())
                    .userName(u != null ? u.getName() : "Student #" + tx.getUserId())
                    .userEmail(u != null ? u.getEmail() : "N/A")
                    .userMobile(u != null ? u.getMobile() : "N/A")
                    .bookId(tx.getBookId())
                    .bookTitle(b != null ? b.getTitle() : "Book #" + tx.getBookId())
                    .bookAuthor(b != null ? b.getAuthor() : "N/A")
                    .bookCategory(b != null ? b.getCategory() : "N/A")
                    .issueDate(tx.getIssueDate())
                    .returnDate(tx.getReturnDate())
                    .status(tx.getStatus())
                    .build();
        }).collect(Collectors.toList());
    }

    public DashboardStatsDto getDashboardStats() {
        long totalBooks = bookRepository.count();
        long totalCopies = bookRepository.sumAllQuantities();
        long availableBooks = bookRepository.countByStatus("AVAILABLE");
        long issued = issueReturnRepository.countByStatus("ISSUED");
        long returned = issueReturnRepository.countByStatus("RETURNED");
        long students = userRepository.findByRole("STUDENT").size();

        return DashboardStatsDto.builder()
                .totalBooks(totalBooks)
                .totalPhysicalCopies(totalCopies)
                .availableBooks(availableBooks)
                .issuedBooksCount(issued)
                .returnedBooksCount(returned)
                .totalStudents(students)
                .build();
    }
}
