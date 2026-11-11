package dev.clueso.api.system;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemController {
  private static final Logger LOG = LoggerFactory.getLogger(SystemController.class);
  private final PlatformMetadataRepository metadata;

  public SystemController(PlatformMetadataRepository metadata) {
    this.metadata = metadata;
  }

  @PostMapping(
      path = "/check",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public SystemCheckResponse check(@Valid @RequestBody SystemCheckRequest request) {
    int schemaVersion = metadata.schemaVersion();
    LOG.info("system_check_completed schema_version={}", schemaVersion);
    return new SystemCheckResponse("clueso-api", "ready", request.label(), schemaVersion);
  }
}
