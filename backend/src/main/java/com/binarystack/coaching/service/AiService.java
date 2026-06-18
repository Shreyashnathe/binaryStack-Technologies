package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.AiResponse;
import com.binarystack.coaching.entity.User;
import com.binarystack.coaching.entity.Enrollment;
import com.binarystack.coaching.repository.UserRepository;
import com.binarystack.coaching.repository.EnrollmentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final long maxCompletionTokens;
    private final List<String> fallbackModels;
    private final String httpReferer;
    private final String appTitle;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    public AiService(
            @Value("${openrouter.api-key}") String apiKey,
            @Value("${openrouter.base-url:https://openrouter.ai/api/v1}") String baseUrl,
            @Value("${openrouter.model:openai/gpt-5.2}") String model,
            @Value("${openrouter.max-completion-tokens:512}") long maxCompletionTokens,
            @Value("${openrouter.fallback-models:}") String fallbackModelsCsv,
            @Value("${openrouter.http-referer:http://localhost:8080}") String httpReferer,
            @Value("${openrouter.app-title:BinaryStack-Coaching}") String appTitle,
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("openrouter.api-key is not configured. Set OPENROUTER_API_KEY in system environment variables.");
        }

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.apiKey = apiKey;
        this.model = model;
        this.maxCompletionTokens = maxCompletionTokens;
        this.fallbackModels = Arrays.stream(fallbackModelsCsv.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .filter(value -> !value.equalsIgnoreCase(model))
                .toList();
        this.httpReferer = httpReferer;
        this.appTitle = appTitle;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    /**
     * Send a question to OpenRouter and return the AI-generated answer.
     */
    public AiResponse ask(String query) {
        log.info("AI query received: {}", query);
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (auth != null && auth.isAuthenticated()) ? auth.getName() : null;
        
        User user = null;
        if (email != null && !email.equals("anonymousUser") && !email.isBlank()) {
            user = userRepository.findByEmail(email).orElse(null);
        }
        
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are a concise programming tutor. Answer briefly.\n");
        
        if (user != null && user.getRole() == com.binarystack.coaching.enums.Role.STUDENT) {
            promptBuilder.append("Student Profile Context:\n")
                    .append("- Name: ").append(user.getName()).append("\n");
            if (user.getCity() != null && !user.getCity().isBlank()) {
                promptBuilder.append("- City: ").append(user.getCity()).append("\n");
            }
            if (user.getEducationLevel() != null && !user.getEducationLevel().isBlank()) {
                promptBuilder.append("- Education Level: ").append(user.getEducationLevel()).append("\n");
            }
            if (user.getTargetRole() != null && !user.getTargetRole().isBlank()) {
                promptBuilder.append("- Target Role: ").append(user.getTargetRole()).append("\n");
            }
            if (user.getBio() != null && !user.getBio().isBlank()) {
                promptBuilder.append("- Bio: ").append(user.getBio()).append("\n");
            }
            
            List<Enrollment> enrollments = enrollmentRepository.findByStudent(user);
            if (enrollments != null && !enrollments.isEmpty()) {
                promptBuilder.append("- Enrolled Courses: ");
                for (int i = 0; i < enrollments.size(); i++) {
                    promptBuilder.append(enrollments.get(i).getCourse().getTitle());
                    if (i < enrollments.size() - 1) {
                        promptBuilder.append(", ");
                    }
                }
                promptBuilder.append("\n");
            }
            promptBuilder.append("Please address the student directly by name and tailor your response to their background (education level, target role, and active courses) where relevant.\n");
        }
        
        promptBuilder.append("\nUser Q: ").append(query);
        String prompt = promptBuilder.toString();

        List<String> modelsToTry = new ArrayList<>();
        modelsToTry.add(model);
        modelsToTry.addAll(fallbackModels);

        RestClientResponseException lastNotFound = null;

        for (String modelName : modelsToTry) {
            try {
                String answer = requestAnswer(modelName, prompt);
                if (!modelName.equals(model)) {
                    log.info("Fallback OpenRouter model selected: {}", modelName);
                }
                log.info("AI response generated for query: {}",
                        query.substring(0, Math.min(50, query.length())));
                return new AiResponse(answer);
            } catch (RestClientResponseException ex) {
                int status = ex.getStatusCode().value();
                if (status == 404) {
                    lastNotFound = ex;
                    log.warn("OpenRouter model '{}' unavailable (404). Trying next model if available.", modelName);
                    continue;
                }

                if (status == 401) {
                    log.error("OpenRouter API error: HTTP 401");
                    return new AiResponse("OpenRouter authentication failed (HTTP 401). Verify OPENROUTER_API_KEY.");
                }

                if (status == 402) {
                    log.error("OpenRouter API error: HTTP 402");
                    return new AiResponse(
                            "Insufficient OpenRouter credits (HTTP 402). " +
                            "Add credits at https://openrouter.ai/settings/credits");
                }

                log.error("OpenRouter API error: HTTP {}", status);
                return new AiResponse("OpenRouter request failed (HTTP " + status + ").");
            } catch (Exception ex) {
                log.error("Unexpected AI error", ex);
                return new AiResponse("AI service temporarily unavailable. Please try again.");
            }
        }

        if (lastNotFound != null) {
            return new AiResponse(
                    "OpenRouter model not found (HTTP 404). " +
                    "Update openrouter.model or openrouter.fallback-models in backend application.properties.");
        }

        return new AiResponse("No response from model.");
    }

    private String requestAnswer(String modelName, String prompt) {
        JsonNode response = restClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("HTTP-Referer", httpReferer)
                .header("X-OpenRouter-Title", appTitle)
                .body(Map.of(
                        "model", modelName,
                        "messages", List.of(Map.of("role", "user", "content", prompt)),
                        "max_tokens", maxCompletionTokens
                ))
                .retrieve()
                .body(JsonNode.class);

        if (response == null) {
            return "No response from model.";
        }

        JsonNode content = response.path("choices").path(0).path("message").path("content");
        if (content.isMissingNode() || content.isNull()) {
            return "No response from model.";
        }

        if (content.isTextual()) {
            return content.asText();
        }

        if (content.isArray()) {
            StringBuilder answerBuilder = new StringBuilder();
            for (JsonNode chunk : content) {
                JsonNode textNode = chunk.path("text");
                if (textNode.isTextual()) {
                    answerBuilder.append(textNode.asText());
                }
            }
            String answer = answerBuilder.toString().trim();
            if (!answer.isEmpty()) {
                return answer;
            }
        }

        return content.toString();
    }
}
