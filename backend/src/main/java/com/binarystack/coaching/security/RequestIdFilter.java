package com.binarystack.coaching.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class RequestIdFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestIdFilter.class);

    private static final String REQUEST_ID_HEADER_1 = "X-Request-ID";
    private static final String REQUEST_ID_HEADER_2 = "X-Correlation-ID";
    private static final String REQUEST_ID_HEADER_3 = "Request-ID";
    private static final String REQUEST_ID_HEADER_4 = "Correlation-ID";

    private static final String MDC_KEY = "requestId";
    private static final String MDC_CORRELATION_KEY = "correlationId";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String requestId = getRequestIdFromHeader(request);
        if (!StringUtils.hasText(requestId)) {
            requestId = UUID.randomUUID().toString();
        }

        try {
            MDC.put(MDC_KEY, requestId);
            MDC.put(MDC_CORRELATION_KEY, requestId);

            response.setHeader(REQUEST_ID_HEADER_1, requestId);
            response.setHeader(REQUEST_ID_HEADER_2, requestId);

            log.info("Incoming request: {} {} from IP: {}", request.getMethod(), request.getRequestURI(), request.getRemoteAddr());

            filterChain.doFilter(request, response);

            log.info("Outgoing response: {} for {} {}", response.getStatus(), request.getMethod(), request.getRequestURI());
        } finally {
            MDC.remove(MDC_KEY);
            MDC.remove(MDC_CORRELATION_KEY);
        }
    }

    private String getRequestIdFromHeader(HttpServletRequest request) {
        String id = request.getHeader(REQUEST_ID_HEADER_1);
        if (StringUtils.hasText(id)) return id.trim();

        id = request.getHeader(REQUEST_ID_HEADER_2);
        if (StringUtils.hasText(id)) return id.trim();

        id = request.getHeader(REQUEST_ID_HEADER_3);
        if (StringUtils.hasText(id)) return id.trim();

        id = request.getHeader(REQUEST_ID_HEADER_4);
        return StringUtils.hasText(id) ? id.trim() : null;
    }
}
