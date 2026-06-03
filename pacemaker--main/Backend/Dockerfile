FROM eclipse-temurin:21 AS builder

WORKDIR /app

COPY mvnw ./
COPY .mvn .mvn
COPY pom.xml ./
COPY src src

RUN chmod +x mvnw
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]