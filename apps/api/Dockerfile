FROM maven:3.9.11-eclipse-temurin-17 AS build

WORKDIR /build

COPY apps/api/.mvn .mvn
COPY apps/api/mvnw .
COPY apps/api/pom.xml .

RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline

COPY apps/api/src src

RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY --from=build /build/target/*.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
