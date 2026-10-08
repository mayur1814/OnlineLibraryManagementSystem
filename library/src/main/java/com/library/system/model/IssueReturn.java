package com.library.system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Issue_Return")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IssueReturn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(name = "issue_date", nullable = false)
    private String issueDate;

    @Column(name = "return_date")
    private String returnDate;

    @Column(nullable = false)
    private String status; // ISSUED or RETURNED
}
