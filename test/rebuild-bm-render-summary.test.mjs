import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  stat,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const TOOL = path.join(REPO_ROOT, "scripts", "rebuild-bm-render-summary.mjs");

function pad(n) {
  return String(n).padStart(3, "0");
}

async function buildFixture(baseDir) {
  const renderDir = path.join(baseDir, "audit_renders");
  const docxDir = path.join(
    baseDir,
    "storage",
    "generated",
    "cases",
    "VKS-2026-0001",
    "docx",
  );
  await mkdir(renderDir, { recursive: true });
  await mkdir(docxDir, { recursive: true });

  const resultPaths = [];
  for (let i = 1; i <= 213; i++) {
    const code = `BM-${pad(i)}`;
    const fileName = `${code}_fixture_VKS-2026-0001.docx`;
    const docxPath = path.join(docxDir, fileName);
    await writeFile(docxPath, "fake-docx-bytes");
    const relPath = path.relative(baseDir, docxPath).split(path.sep).join("/");
    const resultEntry = {
      code,
      name: `Fixture ${code}`,
      stage: "TIEP_NHAN",
      group: "G01",
      templateId: String(i),
      documentId: String(1000 + i),
      placeholderCount: 0,
      placeholderSamples: [],
      status: "OK",
      renderedFile: {
        fileName,
        fileSize: String((await stat(docxPath)).size),
        filePath: relPath,
        format: "DOCX",
      },
      docxPlaceholders: { found: false, count: 0, samples: [] },
    };
    const resultPath = path.join(renderDir, `${code}-result.json`);
    await writeFile(resultPath, JSON.stringify(resultEntry));
    resultPaths.push({ code, resultPath, docxPath, fileName, baseDir });
  }
  return { renderDir, docxDir, resultPaths, baseDir };
}

async function runTool(args, cwd) {
  return execFileAsync(process.execPath, [TOOL, ...args], { cwd });
}

function toolArgsFor(fixture) {
  return [
    "--render-dir",
    fixture.renderDir,
    "--project-root",
    fixture.baseDir,
  ];
}describe("rebuild-bm-render-summary", () => {
  let workDir;
  let fixture;
  let legacySummary;

  before(async () => {
    workDir = await mkdtemp(path.join(os.tmpdir(), "rebuild-bm-"));
    fixture = await buildFixture(workDir);

    // Pre-seed a legacy summary.json with a smaller okCount to verify
    // the rebuild overwrites it with 213.
    legacySummary = {
      startedAt: "2026-06-17T12:47:48.723Z",
      endedAt: "2026-06-17T12:49:52.648Z",
      apiHost: "localhost:3001",
      totalTemplates: 113,
      results: [],
      errors: [],
      okCount: 113,
      failedCount: 0,
      withPlaceholders: 0,
    };
    await writeFile(
      path.join(fixture.renderDir, "summary.json"),
      JSON.stringify(legacySummary),
    );
    await writeFile(
      path.join(fixture.renderDir, "SUMMARY.md"),
      "# legacy placeholder",
    );
  });

  after(async () => {
    if (workDir && existsSync(workDir)) {
      await rm(workDir, { recursive: true, force: true });
    }
  });

  it("builds a 213/213 summary from on-disk artifacts", async () => {
    const { stdout, stderr } = await runTool(
      ["--check", ...toolArgsFor(fixture)],
      workDir,
    );
    assert.match(stdout, /would produce 213\/213/);
    assert.equal(stderr, "");
  });

  it("rebuild writes canonical 213-entry summary.json", async () => {
    await runTool(toolArgsFor(fixture), workDir);

    const summaryRaw = await readFile(
      path.join(fixture.renderDir, "summary.json"),
      "utf8",
    );
    const summary = JSON.parse(summaryRaw);

    assert.equal(summary.totalTemplates, 213);
    assert.equal(summary.okCount, 213);
    assert.equal(summary.failedCount, 0);
    assert.equal(summary.withPlaceholders, 0);
    assert.equal(summary.results.length, 213);
    assert.equal(summary.errors.length, 0);
    assert.equal(summary.apiHost, "localhost:3001");
    assert.equal(summary.startedAt, legacySummary.startedAt, "kept legacy startedAt");
    assert.notEqual(summary.endedAt, legacySummary.endedAt, "endedAt updated");

    const codes = summary.results.map((r) => r.code);
    assert.equal(codes[0], "BM-001");
    assert.equal(codes[212], "BM-213");
  });

  it("rebuild writes SUMMARY.md and matches 213 rows", async () => {
    const md = await readFile(
      path.join(fixture.renderDir, "SUMMARY.md"),
      "utf8",
    );
    assert.match(md, /## Tổng quan/);
    assert.match(md, /\*\*213\*\*/);
    assert.match(md, /Render OK \| \*\*213\*\*/);
    // 213 rows in the detail table.
    const detailRowMatches = md.match(/^\| \d+ \| BM-\d{3} \|/gmu);
    assert.ok(detailRowMatches, "expected detail rows in markdown");
    assert.equal(detailRowMatches.length, 213);
  });

  it("rebuild preserves legacy summary under .backup", async () => {
    const backupDir = path.join(fixture.renderDir, ".backup");
    const statInfo = await stat(backupDir);
    assert.ok(statInfo.isDirectory(), ".backup directory should exist");
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(backupDir);
    assert.ok(
      entries.some((e) => e.startsWith("summary.json")),
      "expected summary.json backup",
    );
    assert.ok(
      entries.some((e) => e.startsWith("SUMMARY.md")),
      "expected SUMMARY.md backup",
    );
  });

  it("rebuild records .rebuild-info.json with 213 verified entries", async () => {
    const info = JSON.parse(
      await readFile(
        path.join(fixture.renderDir, ".rebuild-info.json"),
        "utf8",
      ),
    );
    assert.equal(info.includedFromArtifacts, 213);
    assert.equal(info.excludedCount, 0);
    assert.equal(info.docxVerification.length, 213);
    assert.ok(
      info.docxVerification.every((v) => v.ok),
      "all 213 docx verifications should be ok",
    );
    assert.equal(info.previousSummary.okCount, 113);
  });

  it("detects missing result file with --check (exit code 2)", async () => {
    const scratch = await mkdtemp(path.join(os.tmpdir(), "rebuild-bm-missing-"));
    const f = await buildFixture(scratch);
    const { unlink } = await import("node:fs/promises");
    await unlink(path.join(f.renderDir, "BM-050-result.json"));

    let exitCode = 0;
    try {
      await runTool(["--check", ...toolArgsFor(f)], scratch);
    } catch (err) {
      exitCode = err.code ?? 1;
    }
    assert.equal(exitCode, 2);
    await rm(scratch, { recursive: true, force: true });
  });

  it("excludes entries whose DOCX file is missing on disk", async () => {
    const scratch = await mkdtemp(path.join(os.tmpdir(), "rebuild-bm-docx-"));
    const f = await buildFixture(scratch);
    const { unlink } = await import("node:fs/promises");
    await unlink(f.resultPaths[49].docxPath); // BM-050

    await runTool(toolArgsFor(f), scratch);
    const summary = JSON.parse(
      await readFile(
        path.join(f.renderDir, "summary.json"),
        "utf8",
      ),
    );
    assert.equal(summary.okCount, 212);
    assert.equal(summary.results.length, 212);
    assert.ok(
      summary.errors.some((e) => e.code === "BM-050"),
      "BM-050 should be reported in errors",
    );
    await rm(scratch, { recursive: true, force: true });
  });
});
