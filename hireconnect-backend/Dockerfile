# ------------------------------------
# Stage 1: Build the Spring Boot JAR
# ------------------------------------
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy only pom.xml first (better caching)
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline

# Copy source code
COPY src ./src

# Build jar (skip tests for faster build)
RUN mvn clean package -DskipTests


# ------------------------------------
# Stage 2: Run the app (small + secure)
# ------------------------------------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user (security best practice)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy only the built jar
COPY --from=build /app/target/*.jar app.jar

# Expose backend port
EXPOSE 8080

# JVM production options (important)
ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-jar", "app.jar"]