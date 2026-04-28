import { Module } from "@nestjs/common";
import { InferenceController } from "./inference.controller";

@Module({
  controllers: [InferenceController],
})
export class InferenceModule {}
