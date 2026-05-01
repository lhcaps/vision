import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogger, AuditEvent } from '../audit/audit-logger';

@Injectable()
export class PrismaAuditLogger implements AuditLogger {
  constructor(private readonly prisma: PrismaService) {}

  async log(event: AuditEvent): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        projectId: event.projectId,
        actorId: event.actorId ?? null,
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId,
        metadataJson: event.metadataJson as object,
      },
    });
  }
}
