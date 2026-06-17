package com.binarystack.coaching.controller;

import com.binarystack.coaching.dto.AiRequest;
import com.binarystack.coaching.dto.AiResponse;
import com.binarystack.coaching.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@Tag(name = "AI Assistant", description = "AI-powered question answering using OpenRouter")
@SecurityRequirement(name = "bearerAuth")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/ask")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @Operation(summary = "Ask an AI-powered educational question")
    public ResponseEntity<AiResponse> ask(@Valid @RequestBody AiRequest request) {
        AiResponse response = aiService.ask(request.getQuery());
        return ResponseEntity.ok(response);
    }
}
