package com.library.system.repository;

import com.library.system.model.IssueReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IssueReturnRepository extends JpaRepository<IssueReturn, Long> {
    List<IssueReturn> findByUserId(Long userId);
}