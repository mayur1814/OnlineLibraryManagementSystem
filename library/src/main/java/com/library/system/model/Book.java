package com.library.system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Books")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private int quantity; // currently available copies

    @Column(nullable = false)
    private String status; // AVAILABLE or UNAVAILABLE

    @Column(name = "isbn", length = 50)
    private String isbn;

    @Column(name = "total_copies")
    private Integer totalCopies;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "description", length = 2000)
    private String description;

    public Book(Long id, String title, String author, String category, int quantity, String status) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.category = category;
        this.quantity = quantity;
        this.totalCopies = quantity;
        this.status = status;
    }

    public Book(Long id, String title, String author, String category, int quantity, Integer totalCopies,
                String status, String isbn, String imageUrl, String description) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.category = category;
        this.quantity = quantity;
        this.totalCopies = totalCopies != null ? totalCopies : quantity;
        this.status = status;
        this.isbn = isbn;
        this.imageUrl = imageUrl;
        this.description = description;
    }

    public int getTotalCopiesValue() {
        return (totalCopies != null && totalCopies > 0) ? totalCopies : Math.max(quantity, 1);
    }
}
