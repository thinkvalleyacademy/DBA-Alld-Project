FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /build

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /build/target/*.jar app.jar

# Create non-root user for security
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser

# Create log directory inside app directory (no root needed)
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8081

# JVM optimizations for faster startup and better performance
ENTRYPOINT ["java","-XX:+UseContainerSupport","-XX:MaxRAMPercentage=75.0","-XX:+UseG1GC","-XX:MaxGCPauseMillis=200","-XX:+ParallelRefProcEnabled","-Djava.security.egd=file:/dev/./urandom","-jar","app.jar"]
