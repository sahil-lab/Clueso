package dev.clueso.api.http;

import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ApiExceptionHandler {
  private static final Logger LOG = LoggerFactory.getLogger(ApiExceptionHandler.class);

  public record ValidationIssue(String field, String message) {}

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ProblemDetail invalidFields(MethodArgumentNotValidException exception) {
    List<ValidationIssue> issues =
        exception.getBindingResult().getFieldErrors().stream()
            .map(error -> new ValidationIssue(error.getField(), error.getDefaultMessage()))
            .distinct()
            .sorted(Comparator.comparing(ValidationIssue::message))
            .toList();
    LOG.warn("request_validation_failed issue_count={}", issues.size());
    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "The request did not satisfy the diagnostic contract.");
    problem.setTitle("Invalid request");
    problem.setProperty("errors", issues);
    return problem;
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ProblemDetail invalidJson() {
    LOG.warn("request_json_rejected");
    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "Provide a JSON object containing only a string label.");
    problem.setTitle("Invalid JSON request");
    return problem;
  }

  @ExceptionHandler(DataAccessException.class)
  public ProblemDetail databaseUnavailable(DataAccessException exception) {
    LOG.error("database_read_failed exception_type={}", exception.getClass().getSimpleName());
    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(
            HttpStatus.SERVICE_UNAVAILABLE, "The database is not ready. Try again shortly.");
    problem.setTitle("Service unavailable");
    return problem;
  }
}
