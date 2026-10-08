package com.library.system.repository;

import com.library.system.model.IssueReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueReturnRepository extends JpaRepository<IssueReturn, Long> {
    List<IssueReturn> findByUserId(Long userId);
    List<IssueReturn> findByUserIdOrderByIssueDateDesc(Long userId);
    List<IssueReturn> findAllByOrderByIssueDateDesc();
    long countByStatus(String status);
    long countByUserIdAndStatus(Long userId, String status);
    long countByUserId(Long userId);
}
