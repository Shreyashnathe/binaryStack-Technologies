package com.binarystack.coaching.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "BinaryStack Coaching Portal API",
        version = "1.0.0",
        description = "REST API for the BinaryStack Technologies coaching platform",
        contact = @Contact(name = "BinaryStack Technologies", email = "owner123@gmail.com")
    )
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder()
                .requestInterceptor((request, body, execution) -> {
                    request.getHeaders().add("HTTP-Referer", "https://binary-stack-technologies.vercel.app");
                    request.getHeaders().add("X-OpenRouter-Title", "SpringAI-App");
                    return execution.execute(request, body);
                });
    }
}
