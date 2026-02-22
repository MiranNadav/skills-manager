import { Global, Module } from "@nestjs/common";
import { Logger } from "./core/logger.js";
import { config, APP_CONFIG } from "./config.js";
import { APP_LOGGER } from "./common/interceptors/logging.interceptor.js";

/**
 * Global module providing APP_CONFIG and APP_LOGGER tokens to all
 * feature modules without needing explicit imports.
 */
@Global()
@Module({
  providers: [
    { provide: APP_CONFIG, useValue: config },
    {
      provide: APP_LOGGER,
      useFactory: () =>
        new Logger({
          serviceName: "skills-manager-api",
          level: config.LOG_LEVEL,
        }),
    },
  ],
  exports: [APP_CONFIG, APP_LOGGER],
})
export class CoreModule {}
