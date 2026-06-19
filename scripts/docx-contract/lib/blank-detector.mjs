// Shared blank detection helpers for the DOCX-first audit pipeline.
// Both extract-docx-structure.mjs and draft-contracts.mjs must use these
// so detection logic stays in sync.
//
// BLANK_PATTERN: Unicode-safe pattern covering Vietnam-legal form blanks:
//   - "..."         (3+ dots, ASCII)
//   - "……"         (multiple ellipsis U+2026)
//   - "…"          (single ellipsis)
//   - "___"         (3+ underscores)
//   - "…, ngày … tháng … năm …" (date line, captured as vn-date-line)
export const BLANK_PATTERN = String.raw`(?:\.{3,}|…+|…+|_{3,})`;

/**
 * Detect blanks within a single paragraph block.
 * Returns candidates with offset info so downstream can locate
 * the exact character range in the block text.
 *
 * @param {string} text - raw block text
 * @param {string} blockId - block identifier
 * @returns {Array<{kind, raw, blockId, tableCellId, startOffset, endOffset, context}>}
 */
export function detectBlanksInBlock(text, blockId, tableCellId = null) {
  const candidates = [];
  const patterns = [
    { regex: /\.{3,}/gu, kind: "ellipsis-dots" },
    { regex: /…+/gu, kind: "ellipsis-unicode" },
    { regex: /_{3,}/gu, kind: "underscore" },
    {
      regex: new RegExp(
        `ngày\\s*${BLANK_PATTERN}\\s*tháng\\s*${BLANK_PATTERN}\\s*năm\\s*${BLANK_PATTERN}`,
        "giu",
      ),
      kind: "vn-date-line",
    },
    { regex: /(?:\(\s*\d+\s*\))\.{2,}/gu, kind: "numbered-blank" },
  ];

  // First check for vn-date-line as a single candidate spanning the whole line.
  // We need to do vn-date-line separately because it matches a substring
  // that might overlap with individual dot/ellipsis matches.
  const dateLineRe = new RegExp(
    `ngày\\s*${BLANK_PATTERN}\\s*tháng\\s*${BLANK_PATTERN}\\s*năm\\s*${BLANK_PATTERN}`,
    "giu",
  );
  let m;
  while ((m = dateLineRe.exec(text)) !== null) {
    candidates.push({
      kind: "vn-date-line",
      raw: m[0],
      blockId,
      tableCellId,
      startOffset: m.index,
      endOffset: m.index + m[0].length,
      context: text.slice(0, 200),
    });
  }

  // Now detect individual blanks (dots/ellipsis/underscore) that are NOT
  // already covered by the vn-date-line match above.
  for (const { regex, kind } of patterns) {
    if (kind === "vn-date-line") continue;
    regex.lastIndex = 0;
    while ((m = regex.exec(text)) !== null) {
      // Skip if this match is fully contained within a vn-date-line match.
      const withinDateLine = candidates.some(
        (c) =>
          c.kind === "vn-date-line" &&
          m.index >= c.startOffset &&
          m.index + m[0].length <= c.endOffset,
      );
      if (withinDateLine) continue;

      candidates.push({
        kind,
        raw: m[0],
        blockId,
        tableCellId,
        startOffset: m.index,
        endOffset: m.index + m[0].length,
        context: text.slice(0, 200),
      });
    }
  }

  return candidates;
}

/**
 * Detect blanks across all text blocks and table cells.
 * This is the top-level API used by extract-docx-structure.mjs.
 *
 * @param {Array<{blockId, text, ...}>} textBlocks
 * @param {Array<{tableId, rows: [{rowIndex, cells: [{cellId, text, ...}]}]}>} tables
 * @returns {Array}
 */
export function detectBlanksInBlocks(textBlocks, tables = []) {
  const results = [];

  // Paragraph blanks
  for (const blk of textBlocks) {
    results.push(...detectBlanksInBlock(blk.text, blk.blockId, null));
  }

  // Table cell blanks
  for (const tbl of tables) {
    for (const row of tbl.rows) {
      for (const cell of row.cells) {
        if (cell.text) {
          results.push(...detectBlanksInBlock(cell.text, tbl.tableId, cell.cellId));
        }
      }
    }
  }

  return results;
}
