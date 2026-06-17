package com.binarystack.coaching.dto;

import jakarta.validation.constraints.NotBlank;

public class AiRequest {

    @NotBlank(message = "Query cannot be blank")
    private String query;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }
}
