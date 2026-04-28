import { Controller, Get, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { MediaUploadResponseSchema } from "@visionflow/contracts";
import { MediaService } from "./media.service";

@ApiTags("media")
@Controller("projects/:projectId/media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOkResponse({
    description: "List media assets for a project.",
  })
  list(@Param("projectId") projectId: string) {
    return this.mediaService.list(projectId);
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: {
        fileSize: 250 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Upload media, dedupe by checksum, store original, and queue processing.",
  })
  async upload(
    @Param("projectId") projectId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return MediaUploadResponseSchema.parse(await this.mediaService.upload(projectId, file));
  }
}
