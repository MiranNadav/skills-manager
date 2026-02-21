import { Module } from "@nestjs/common";
import { CliController } from "./cli.controller.js";
import { CliService } from "./cli.service.js";

@Module({
  controllers: [CliController],
  providers: [CliService],
})
export class CliModule {}
