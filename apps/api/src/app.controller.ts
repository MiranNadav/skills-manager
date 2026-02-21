import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: "Service info" })
  @ApiResponse({ status: 200, description: "Service information" })
  getRoot() {
    return { service: "skills-manager-api", version: "0.1.0", status: "healthy" };
  }

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  @ApiResponse({ status: 200, description: "Health status" })
  getHealth() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
