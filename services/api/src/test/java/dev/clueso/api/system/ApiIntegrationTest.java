package dev.clueso.api.system;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiIntegrationTest {
  @Autowired private TestRestTemplate http;
  @Autowired private JdbcTemplate jdbc;

  @Test
  void migratesRealPostgresAndCompletesTheReadOnlyRoundTrip() {
    var response =
        http.postForEntity(
            "/api/v1/system/check", new SystemCheckRequest("integration-smoke"), JsonNode.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().size()).isEqualTo(4);
    assertThat(response.getBody().path("label").asText()).isEqualTo("integration-smoke");
    assertThat(response.getBody().path("schemaVersion").asInt()).isEqualTo(1);
    assertThat(response.getBody().path("service").asText()).isEqualTo("clueso-api");
    assertThat(response.getBody().path("status").asText()).isEqualTo("ready");
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM platform_metadata", Integer.class))
        .isEqualTo(1);
    assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '1' AND success",
                Integer.class))
        .isEqualTo(1);
  }

  @Test
  void exposesLivenessAndDatabaseBackedReadinessWithoutInternalDetails() {
    for (String probe : new String[] {"liveness", "readiness"}) {
      var response = http.getForEntity("/actuator/health/" + probe, JsonNode.class);
      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(response.getBody()).isNotNull();
      assertThat(response.getBody().path("status").asText()).isEqualTo("UP");
      assertThat(response.getBody().has("components")).isFalse();
    }
  }

  @Test
  void validatesTheContractOnTheRealHttpServer() {
    var headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    var response =
        http.postForEntity(
            "/api/v1/system/check",
            new HttpEntity<>("{\"label\":\"synthetic\",\"extra\":true}", headers),
            JsonNode.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    assertThat(response.getHeaders().getContentType())
        .isEqualTo(MediaType.APPLICATION_PROBLEM_JSON);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().path("title").asText()).isEqualTo("Invalid JSON request");
  }
}
