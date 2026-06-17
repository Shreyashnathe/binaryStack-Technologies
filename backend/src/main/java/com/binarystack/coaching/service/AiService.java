package com.binarystack.coaching.service;

import com.binarystack.coaching.dto.AiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    public AiService(
            @Value("${openrouter.api-key}") String apiKey,
            @Value("${openrouter.base-url:https://openrouter.ai/api/v1}") String baseUrl,
            @Value("${openrouter.model:openai/gpt-5.2}") String model,
            @Value("${openrouter.max-completion-tokens:512}") long maxCompletionTokens,
            @Value("${openrouter.fallback-models:}") String fallbackModelsCsv,
            @Value("${openrouter.http-referer:http://localhost:8080}") String httpReferer,
            @Value("${openrouter.app-title:BinaryStack-Coaching}") String appTitle
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
    }

    /**
     * Send a question to OpenRouter and return the AI-generated answer.
     */
    public AiResponse ask(String query) {
        log.info("AI query received: {}", query);
        String prompt = "You are a concise programming tutor. Answer briefly. " + query;

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
