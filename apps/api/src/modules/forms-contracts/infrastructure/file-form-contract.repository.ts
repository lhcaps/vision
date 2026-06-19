import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { InfrastructureError } from '../../../common/application-error';
import { WorkspacePathsService } from '../../../infrastructure/paths/workspace-paths.service';
import {
  FormContractRepository,
  type ContractRepositoryStatus,
  type InvalidContractFile,
} from '../application/form-contract.repository';
import {
  normalizeFormContract,
  type LoadedFormContract,
  type RawFormContract,
} from '../domain/form-contract';

const docxSlotSchema = z
  .object({
    slotId: z.string().min(1),
    required: z.boolean(),
    reviewRequired: z.boolean(),
    context: z.string().optional(),
    label: z.string().optional(),
    location: z
      .object({
        partName: z.string(),
        blockId: z.string().nullable(),
        tableCellId: z.string().nullable(),
      })
      .optional(),
  })
  .passthrough();

const canonicalFieldSchema = z
  .object({
    path: z.string().min(1),
    type: z.string().min(1),
    source: z.string().optional(),
    uiComponent: z.string().optional(),
    section: z.string().optional(),
    required: z.boolean().optional(),
    transform: z.string().optional(),
  })
  .passthrough();

const renderBindingSchema = z
  .object({
    slotId: z.string().min(1),
    from: z.string().min(1),
    transform: z.string(),
    fallback: z.string(),
  })
  .passthrough();

const rawContractSchema = z
  .object({
    sourceId: z.string().min(1),
    templateCode: z.string().regex(/^BM-\d{3}$/),
    templateTitle: z.string(),
    documentKind: z.enum(['form', 'reference']),
    status: z.enum(['locked', 'draft']),
    docxSlots: z.array(docxSlotSchema).default([]),
    canonicalFields: z.array(canonicalFieldSchema).default([]),
    renderBindings: z.array(renderBindingSchema).default([]),
    lockedAt: z.string().optional(),
  })
  .passthrough();

type LoadResult =
  | { ok: true; contract: RawFormContract }
  | { ok: false; error: string };

type CacheEntry = {
  mtimeMs: number;
  size: number;
  result: LoadResult;
};

type RepositorySnapshot = {
  contracts: LoadedFormContract[];
  invalidFiles: InvalidContractFile[];
};

@Injectable()
export class FileFormContractRepository extends FormContractRepository {
  private readonly logger = new Logger(FileFormContractRepository.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly reportedInvalid = new Map<string, string>();

  constructor(private readonly paths: WorkspacePathsService) {
    super();
  }

  async findByIdentifier(
    identifier: string,
  ): Promise<LoadedFormContract | null> {
    const contracts = await this.list();
    return (
      contracts.find((contract) => contract.sourceId === identifier) ??
      contracts.find((contract) => contract.templateCode === identifier) ??
      null
    );
  }

  async list(): Promise<LoadedFormContract[]> {
    if (!existsSync(this.paths.contractsRoot)) {
      throw new InfrastructureError(
        'CONTRACTS_ROOT_MISSING',
        `Contracts root does not exist: "${this.paths.contractsRoot}".`,
      );
    }

    return this.loadSnapshot().contracts;
  }

  async inspect(): Promise<ContractRepositoryStatus> {
    if (!existsSync(this.paths.contractsRoot)) {
      return {
        ready: false,
        contractsRoot: this.paths.contractsRoot,
        lockedCount: 0,
        draftCount: 0,
        invalidFiles: [],
      };
    }

    const snapshot = this.loadSnapshot();
    return {
      ready: true,
      contractsRoot: this.paths.contractsRoot,
      lockedCount: snapshot.contracts.filter(
        (contract) => contract.status === 'locked',
      ).length,
      draftCount: snapshot.contracts.filter(
        (contract) => contract.status === 'draft',
      ).length,
      invalidFiles: snapshot.invalidFiles,
    };
  }

  private loadSnapshot(): RepositorySnapshot {
    const filePaths = this.discoverContractPaths();
    const invalidFiles: InvalidContractFile[] = [];
    const locked = new Map<string, LoadedFormContract>();
    const drafts = new Map<string, LoadedFormContract>();

    for (const filePath of filePaths) {
      const result = this.loadFile(filePath);
      if (!result.ok) {
        invalidFiles.push({ path: filePath, message: result.error });
        if (this.reportedInvalid.get(filePath) !== result.error) {
          this.logger.warn(`${filePath}: ${result.error}`);
          this.reportedInvalid.set(filePath, result.error);
        }
        continue;
      }

      this.reportedInvalid.delete(filePath);
      if (result.contract.documentKind === 'reference') continue;
      const normalized = normalizeFormContract(result.contract);
      const target = normalized.status === 'locked' ? locked : drafts;
      target.set(normalized.templateCode, normalized);
    }

    for (const templateCode of locked.keys()) {
      drafts.delete(templateCode);
    }

    return {
      contracts: [...locked.values(), ...drafts.values()].sort((left, right) =>
        left.templateCode.localeCompare(right.templateCode),
      ),
      invalidFiles,
    };
  }

  private discoverContractPaths(): string[] {
    const filePaths: string[] = [];
    const scan = (directory: string): void => {
      if (!existsSync(directory)) return;

      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const fullPath = join(directory, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'locked') scan(fullPath);
          continue;
        }

        if (/\.contract\.(draft|locked)\.json$/.test(entry.name)) {
          filePaths.push(fullPath);
        }
      }
    };

    scan(this.paths.contractsRoot);
    return filePaths.sort();
  }

  private loadFile(filePath: string): LoadResult {
    const stat = statSync(filePath);
    const cached = this.cache.get(filePath);
    if (
      cached &&
      cached.mtimeMs === stat.mtimeMs &&
      cached.size === stat.size
    ) {
      return cached.result;
    }

    const result = this.parseFile(filePath);
    this.cache.set(filePath, {
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      result,
    });
    return result;
  }

  private parseFile(filePath: string): LoadResult {
    let json: unknown;
    try {
      json = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
      return {
        ok: false,
        error: `Contract file is not valid JSON: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }

    const parsed = rawContractSchema.safeParse(json);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Contract schema is invalid: ${parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')}`,
      };
    }

    return {
      ok: true,
      contract: parsed.data,
    };
  }
}
