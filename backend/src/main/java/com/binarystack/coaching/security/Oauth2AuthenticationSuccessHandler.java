package com.binarystack.coaching.security;

import com.binarystack.coaching.entity.User;
import com.binarystack.coaching.enums.Role;
import com.binarystack.coaching.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Locale;
import java.util.UUID;

@Component
public class Oauth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(Oauth2AuthenticationSuccessHandler.class);

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    public Oauth2AuthenticationSuccessHandler(UserRepository userRepository,
                                              JwtUtil jwtUtil,
                                              CustomUserDetailsService userDetailsService,
                                              PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        if (response.isCommitted()) {
            log.debug("Response has already been committed. Unable to redirect.");
            return;
        }

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null) {
            log.error("Email not found from OAuth2 provider attributes.");
            getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/login?error=email_not_provided");
            return;
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        // Find or register user
        User user = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (user == null) {
            log.info("OAuth2 user does not exist. Creating new student account: {}", normalizedEmail);
            user = new User();
            user.setName(name != null ? name.trim() : "Google Learner");
            user.setEmail(normalizedEmail);
            // Set password to random hash to satisfy database constraints
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setRole(Role.STUDENT);
            user.setPhoneNumber("");
            user.setCity("");
            user.setEducationLevel("");
            user.setTargetRole("");
            user.setBio("Registered via Google OAuth2.");
            user.setPasswordSet(false);
            userRepository.save(user);
        } else {
            log.info("OAuth2 user already exists. Logging in: {}", normalizedEmail);
        }

        // Generate token
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        String targetUrl = "http://localhost:5173/oauth2/redirect?token=" + token;
        log.info("OAuth2 authentication successful. Redirecting to frontend redirect handler.");
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
