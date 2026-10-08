package com.library.system.repository;

import com.library.system.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrCategoryContainingIgnoreCase(
            String title, String author, String category);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(b.quantity), 0) FROM Book b")
    long sumAllQuantities();
}
