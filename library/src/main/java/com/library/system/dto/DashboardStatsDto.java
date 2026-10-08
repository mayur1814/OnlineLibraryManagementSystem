package com.library.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalBooks;
    private long totalPhysicalCopies;
    private long availableBooks;
    private long issuedBooksCount;
    private long returnedBooksCount;
    private long totalStudents;
}
