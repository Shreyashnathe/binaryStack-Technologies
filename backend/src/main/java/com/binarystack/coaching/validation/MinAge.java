package com.binarystack.coaching.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MinAgeValidator.class)
@Documented
public @interface MinAge {
    String message() default "Age must be at least 15 years old";
    int value() default 15;
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
