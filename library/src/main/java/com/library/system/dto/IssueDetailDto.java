package com.library.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueDetailDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userMobile;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookCategory;
    private String bookImageUrl;
    private String bookIsbn;
    private String issueDate;
    private String dueDate;
    private String returnDate;
    private String status;
}
