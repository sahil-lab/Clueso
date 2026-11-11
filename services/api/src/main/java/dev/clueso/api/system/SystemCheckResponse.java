package dev.clueso.api.system;

public record SystemCheckResponse(String service, String status, String label, int schemaVersion) {}
