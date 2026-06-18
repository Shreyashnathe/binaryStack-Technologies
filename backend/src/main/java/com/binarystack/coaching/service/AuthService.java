package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.auth.AuthResponse;
import com.binarystack.coaching.dto.auth.LoginRequest;
import com.binarystack.coaching.dto.auth.RegisterRequest;
import com.binarystack.coaching.dto.auth.UpdateProfileRequest;
import com.binarystack.coaching.dto.auth.UserProfileResponse;
import com.binarystack.coaching.entity.User;
import com.binarystack.coaching.enums.Role;
import com.binarystack.coaching.exception.BadRequestException;
import com.binarystack.coaching.exception.ResourceNotFoundException;
import com.binarystack.coaching.repository.UserRepository;
import com.binarystack.coaching.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        // Block admin registration via API
        if ("owner123@gmail.com".equalsIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("Admin cannot be registered via API");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email already in use: " + normalizedEmail);
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.STUDENT);
        user.setPhoneNumber(request.getPhoneNumber().trim());
        user.setCity(request.getCity().trim());
        user.setEducationLevel(request.getEducationLevel().trim());
        user.setTargetRole(request.getTargetRole().trim());
        user.setBio(request.getBio());
        user.setDateOfBirth(request.getDateOfBirth());

        userRepository.save(user);
        log.info("New student registered: {}", user.getEmail());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return buildAuthResponse(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword()));

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        log.info("User logged in: {} ({})", user.getEmail(), user.getRole());

        return buildAuthResponse(token, user);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentProfile(String email) {
        User user = findByEmailOrThrow(email);
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateCurrentProfile(String email, UpdateProfileRequest request) {
        User user = findByEmailOrThrow(email);

        user.setName(request.getName().trim());
        user.setPhoneNumber(request.getPhoneNumber().trim());
        user.setCity(request.getCity().trim());
        user.setEducationLevel(request.getEducationLevel() == null ? null : request.getEducationLevel().trim());
        user.setTargetRole(request.getTargetRole() == null ? null : request.getTargetRole().trim());
        user.setBio(request.getBio());
        user.setDateOfBirth(request.getDateOfBirth());

        User updated = userRepository.save(user);
        log.info("Profile updated for user: {}", updated.getEmail());
        return toProfileResponse(updated);
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = findByEmailOrThrow(email);
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Incorrect current password");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", user.getEmail());
    }

    private User findByEmailOrThrow(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        AuthResponse response = new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole().name());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setCity(user.getCity());
        response.setEducationLevel(user.getEducationLevel());
        response.setTargetRole(user.getTargetRole());
        response.setBio(user.getBio());
        response.setDateOfBirth(user.getDateOfBirth());
        return response;
    }

    private UserProfileResponse toProfileResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhoneNumber(),
                user.getCity(),
                user.getEducationLevel(),
                user.getTargetRole(),
                user.getBio(),
                user.getDateOfBirth(),
                user.getCreatedAt()
        );
    }
}
