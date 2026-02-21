import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { Logger } from "@internal/core/logger";
import { AppModule } from "./app.module.js";
import { config } from "./config.js";
import { NestJSLoggerAdapter } from "./common/logger/nestjs-logger.adapter.js";

async function bootstrap(): Promise<void> {
  const logger = new Logger({
    serviceName: "skills-manager-api",
    level: config.LOG_LEVEL,
  });

  const app = await NestFactory.create(AppModule, {
    logger: new NestJSLoggerAdapter(logger),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix(config.API_PREFIX);

  app.enableCors({
    origin: config.CORS_ORIGINS,
    credentials: true,
  });

  if (config.ENABLE_SWAGGER) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Skills Manager API")
      .setDescription("Browse, edit, and AI-analyze your Claude agent skills")
      .setVersion("0.1.0")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document, {
      jsonDocumentUrl: "docs-json",
    });
    logger.info("Swagger enabled", { ui: `/${config.API_PREFIX}/docs` });
  }

  await app.listen(config.PORT);
  logger.info("Application started", {
    port: config.PORT,
    environment: config.NODE_ENV,
    skillsPath: config.SKILLS_PATH,
    aiProvider: config.AI_PROVIDER,
  });
}

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start application:", error);
  process.exit(1);
});
