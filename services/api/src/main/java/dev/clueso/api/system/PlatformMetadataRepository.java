package dev.clueso.api.system;

import org.springframework.dao.DataRetrievalFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PlatformMetadataRepository {
  private final JdbcTemplate jdbc;

  public PlatformMetadataRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public int schemaVersion() {
    Integer version =
        jdbc.queryForObject(
            "SELECT schema_version FROM platform_metadata WHERE singleton = TRUE", Integer.class);
    if (version == null || version != 1) {
      throw new DataRetrievalFailureException("Required platform metadata is unavailable.");
    }
    return version;
  }
}
