// apps/api/src/main.ts
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { join } from "node:path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  // Hochgeladene Grundrisspläne unter /uploads/... ausliefern (Volume-Pfad)
  app.useStaticAssets(process.env.UPLOAD_DIR ?? "/data/uploads", { prefix: "/uploads/" });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
