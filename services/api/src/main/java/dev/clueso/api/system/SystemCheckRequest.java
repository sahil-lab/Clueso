package dev.clueso.api.system;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SystemCheckRequest(
    @NotBlank(message = "A synthetic label is required.")
        @Size(max = 64, message = "Use at most 64 characters.")
        @Pattern(
            regexp = "[A-Za-z0-9._ -]+",
            message = "Use only letters, digits, spaces, periods, underscores, and hyphens.")
        String label) {}
