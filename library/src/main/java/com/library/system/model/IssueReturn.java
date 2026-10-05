package com.library.system.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Issue_Return")
@Data
public class IssueReturn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private Long bookId;
    private String issueDate;
    private String returnDate;
    private String status; // ISSUED or RETURNED
}