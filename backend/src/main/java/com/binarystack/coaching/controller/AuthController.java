package com.binarystack.coaching.controller;

import com.binarystack.coaching.dto.auth.AuthResponse;
import com.binarystack.coaching.dto.auth.LoginRequest;
import com.binarystack.coaching.dto.auth.RegisterRequest;
import com.binarystack.coaching.dto.auth.UpdateProfileRequest;
import com.binarystack.coaching.dto.auth.UserProfileResponse;
import com.binarystack.coaching.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Register and login endpoints")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new student")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current logged-in user profile")
    public ResponseEntity<UserProfileResponse> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentProfile(authentication.getName()));
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update current logged-in user profile")
    public ResponseEntity<UserProfileResponse> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request,
                                                               Authentication authentication) {
        return ResponseEntity.ok(authService.updateCurrentProfile(authentication.getName(), request));
    }

    @PostMapping("/change-password")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Change current logged-in user password")
    public ResponseEntity<com.binarystack.coaching.dto.ApiResponse<Void>> changePassword(
            @Valid @RequestBody com.binarystack.coaching.dto.auth.ChangePasswordRequest request,
            Authentication authentication) {
        authService.changePassword(authentication.getName(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(new com.binarystack.coaching.dto.ApiResponse<>(true, "Password changed successfully", null));
    }
}
