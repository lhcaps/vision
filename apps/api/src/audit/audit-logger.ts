export interface AuditEvent {
  projectId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadataJson: Record<string, unknown>;
  actorId?: string;
}

export interface AuditLogger {
  log(event: AuditEvent): Promise<void>;
}
