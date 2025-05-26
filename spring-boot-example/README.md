# Spring Boot Example Backend

This folder contains a minimal Spring Boot application that serves as a starting point for migrating n8n functionality to Java.

The application exposes a single `/api/health` endpoint that returns `ok` to verify the server is running.

## Running the example

1. Ensure you have Java 17+ and Maven installed.
2. Navigate to this directory:
   ```bash
   cd spring-boot-example
   ```
3. Build and run the application:
   ```bash
   mvn spring-boot:run
   ```
4. Access the endpoint at `http://localhost:8080/api/health`.

This example does **not** replicate the full n8n backend. It is intended as a starting point for a potential migration to Spring Boot.
