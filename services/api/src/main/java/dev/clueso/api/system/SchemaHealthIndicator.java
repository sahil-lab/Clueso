package dev.clueso.api.system;

import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.stereotype.Component;

@Component("schema")
public class SchemaHealthIndicator extends AbstractHealthIndicator {
  private final PlatformMetadataRepository metadata;

  public SchemaHealthIndicator(PlatformMetadataRepository metadata) {
    this.metadata = metadata;
  }

  @Override
  protected void doHealthCheck(Health.Builder builder) {
    metadata.schemaVersion();
    builder.up();
  }
}
