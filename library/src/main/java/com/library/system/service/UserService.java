package com.library.system.service;

import com.library.system.dto.UserResponseDto;
import com.library.system.model.User;
import com.library.system.repository.IssueReturnRepository;
import com.library.system.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class UserService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository userRepository;
    private final IssueReturnRepository issueReturnRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       IssueReturnRepository issueReturnRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.issueReturnRepository = issueReturnRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User registerStudent(User user) {
        validateUserDetails(user);

        if (userRepository.existsByEmail(user.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("An account with email " + user.getEmail() + " already exists.");
        }

        user.setName(user.getName().trim());
        user.setEmail(user.getEmail().trim().toLowerCase());
        user.setMobile(user.getMobile().trim());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("STUDENT");

        return userRepository.save(user);
    }

    @Transactional
    public User authenticateUser(String email, String rawPassword) {
        if (email == null || email.isBlank() || rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Email and password cannot be empty.");
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        String storedHash = user.getPassword();
        boolean matches = (storedHash != null && storedHash.startsWith("$2"))
                ? passwordEncoder.matches(rawPassword, storedHash)
                : rawPassword.equals(storedHash);

        if (!matches) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        // Migrate legacy unhashed password if needed
        if (storedHash != null && !storedHash.startsWith("$2")) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
        }

        return user;
    }

    public List<UserResponseDto> getAllStudents() {
        return userRepository.findByRole("STUDENT").stream().map(student -> {
            long active = issueReturnRepository.countByUserIdAndStatus(student.getId(), "ISSUED");
            long total = issueReturnRepository.countByUserId(student.getId());
            return UserResponseDto.builder()
                    .id(student.getId())
                    .name(student.getName())
                    .email(student.getEmail())
                    .mobile(student.getMobile())
                    .role(student.getRole())
                    .activeIssuesCount(active)
                    .totalIssuesCount(total)
                    .build();
        }).collect(Collectors.toList());
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public long getTotalStudentsCount() {
        return userRepository.findByRole("STUDENT").size();
    }

    private void validateUserDetails(User user) {
        if (user.getName() == null || user.getName().trim().isBlank()) {
            throw new IllegalArgumentException("Full Name is required.");
        }
        if (user.getEmail() == null || user.getEmail().trim().isBlank()) {
            throw new IllegalArgumentException("Email address is required.");
        }
        if (!EMAIL_PATTERN.matcher(user.getEmail().trim()).matches()) {
            throw new IllegalArgumentException("Please enter a valid email address (e.g., student@example.com).");
        }
        if (user.getMobile() == null || user.getMobile().trim().isBlank()) {
            throw new IllegalArgumentException("Mobile number is required.");
        }
        if (user.getPassword() == null || user.getPassword().length() < 4) {
            throw new IllegalArgumentException("Password must be at least 4 characters.");
        }
    }
}
