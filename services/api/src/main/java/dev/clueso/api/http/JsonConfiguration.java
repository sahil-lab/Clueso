package dev.clueso.api.http;

import com.fasterxml.jackson.core.StreamReadConstraints;
import com.fasterxml.jackson.databind.cfg.CoercionAction;
import com.fasterxml.jackson.databind.cfg.CoercionInputShape;
import com.fasterxml.jackson.databind.type.LogicalType;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JsonConfiguration {
  @Bean
  Jackson2ObjectMapperBuilderCustomizer boundedJson() {
    return builder ->
        builder.postConfigurer(
            mapper -> {
              mapper
                  .getFactory()
                  .setStreamReadConstraints(
                      StreamReadConstraints.builder()
                          .maxDocumentLength(4096)
                          .maxNestingDepth(8)
                          .maxStringLength(1024)
                          .maxNumberLength(32)
                          .build());
              mapper
                  .coercionConfigFor(LogicalType.Textual)
                  .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
                  .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
                  .setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail);
            });
  }
}
