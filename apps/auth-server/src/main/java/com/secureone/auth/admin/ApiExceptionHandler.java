package com.secureone.auth.admin;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice(basePackages = {"com.secureone.auth.admin", "com.secureone.auth.account"})
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail badRequest(IllegalArgumentException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    ProblemDetail serviceUnavailable(IllegalStateException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    ProblemDetail notFound(ResourceNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    ProblemDetail conflict(ConflictException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail dataConflict(DataIntegrityViolationException ex) {
        String detail = ex.getMostSpecificCause().getMessage();
        if (detail != null && detail.toLowerCase().contains("unique")) {
            return ProblemDetail.forStatusAndDetail(
                    HttpStatus.CONFLICT, "A record with the same unique key already exists.");
        }
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Database constraint violation.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ProblemDetail unreadable(HttpMessageNotReadableException ex) {
        String msg = ex.getMostSpecificCause().getMessage();
        if (msg != null && msg.contains("UUID")) {
            return ProblemDetail.forStatusAndDetail(
                    HttpStatus.BAD_REQUEST, "One or more IDs are not valid UUIDs.");
        }
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "Invalid request body: " + ex.getMostSpecificCause().getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ProblemDetail typeMismatch(MethodArgumentTypeMismatchException ex) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Invalid value for parameter '%s'.".formatted(ex.getName()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setDetail("Validation failed");
        problem.setProperty(
                "errors",
                ex.getBindingResult().getFieldErrors().stream()
                        .map(fe -> Map.of("field", fe.getField(), "message", fe.getDefaultMessage()))
                        .toList());
        return problem;
    }
}
