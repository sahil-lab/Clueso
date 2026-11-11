FROM eclipse-temurin:21-jre-alpine@sha256:ac05c3c42b7c2f1a52c9bd52f01041fa1958231b15ebeae7420429cbc5baf474
RUN addgroup -S clueso && adduser -S clueso -G clueso
WORKDIR /app
COPY --chown=clueso:clueso target/clueso-api.jar app.jar
USER clueso
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=65.0", "-XX:ActiveProcessorCount=2", "-jar", "app.jar"]
