import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOkResponse({
    schema: {
      example: {
        ok: true,
        service: "visionflow-api",
      },
    },
  })
  getHealth() {
    return {
      ok: true,
      service: "visionflow-api",
      time: new Date().toISOString(),
    };
  }
}
