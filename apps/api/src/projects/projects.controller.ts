import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ProjectSnapshotSchema } from "@visionflow/contracts";
import { demoSnapshot } from "./demo-snapshot";

@ApiTags("projects")
@Controller("projects")
export class ProjectsController {
  @Get("demo")
  @ApiOkResponse({
    description: "Seeded project snapshot for the Phase 1 workbench.",
  })
  getDemoProject() {
    return ProjectSnapshotSchema.parse(demoSnapshot);
  }
}
