package dev.clueso.api.system;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.clueso.api.http.JsonConfiguration;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SystemController.class)
@Import(JsonConfiguration.class)
class SystemControllerTest {
  @Autowired private MockMvc mvc;
  @MockitoBean private PlatformMetadataRepository metadata;

  @Test
  void returnsTheValidatedLabelAndDatabaseSchema() throws Exception {
    when(metadata.schemaVersion()).thenReturn(1);
    mvc.perform(
            post("/api/v1/system/check")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"label\":\"synthetic-smoke\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.*", hasSize(4)))
        .andExpect(jsonPath("$.label").value("synthetic-smoke"))
        .andExpect(jsonPath("$.service").value("clueso-api"))
        .andExpect(jsonPath("$.status").value("ready"))
        .andExpect(jsonPath("$.schemaVersion").value(1));
  }

  static Stream<String> invalidRequests() {
    return Stream.of(
        "{}",
        "{\"label\":null}",
        "{\"label\":\"\"}",
        "{\"label\":\"   \"}",
        "{\"label\":\"" + "a".repeat(65) + "\"}",
        "{\"label\":\"" + "a".repeat(2048) + "\"}",
        "{\"label\":\"<script>private-input</script>\"}",
        "{\"label\":42}",
        "{\"label\":true}",
        "{\"label\":\"synthetic\",\"unexpected\":\"private-input\"}",
        "{\"label\":",
        "{\"label\":\"synthetic\"} {}");
  }

  @ParameterizedTest
  @MethodSource("invalidRequests")
  void rejectsInvalidInputBeforeDatabaseAccess(String body) throws Exception {
    mvc.perform(post("/api/v1/system/check").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(content().string(not(containsString("private-input"))))
        .andExpect(jsonPath("$.stackTrace").doesNotExist());
    verifyNoInteractions(metadata);
  }

  @Test
  void acceptsTheMaximumLengthBoundary() throws Exception {
    when(metadata.schemaVersion()).thenReturn(1);
    mvc.perform(
            post("/api/v1/system/check")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"label\":\"" + "a".repeat(64) + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.label").value("a".repeat(64)));
  }

  @Test
  void reportsDatabaseFailureWithoutLeakingInternalDetails() throws Exception {
    when(metadata.schemaVersion())
        .thenThrow(new DataAccessResourceFailureException("private-database-connection"));
    mvc.perform(
            post("/api/v1/system/check")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"label\":\"synthetic-smoke\"}"))
        .andExpect(status().isServiceUnavailable())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.title").value("Service unavailable"))
        .andExpect(content().string(not(containsString("private-database-connection"))));
  }
}
