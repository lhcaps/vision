// Helper for deriving a stable, unique sourceId per DOCX/DOC file.
//
// Mỗi file vật lý (kể cả khi trùng templateCode như BM-139) phải có
// sourceId riêng để output downstream (extract.json, contract.draft.json)
// không ghi đè lẫn nhau.
//
// Format:
//   - Form:   `<BM-XXX>__<sha12>` (vd `BM-139__23306e6022bd`)
//   - Ref:    `REF__<slug>__<sha12>` (vd `REF__thong-tu-03__9795f14f931c`)
//
// slugifyForId: chuyển tên file tiếng Việt thành slug an toàn cho filesystem.

const slugifyForId = (raw) => {
  if (!raw) return "unknown";
  const stripped = String(raw)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\.(docx?|tmp)$/iu, "");
  return (
    stripped
      .replace(/[^a-zA-Z0-9]+/gu, "-")
      .replace(/^-+|-+$/gu, "")
      .toLowerCase()
      .slice(0, 60) || "unknown"
  );
};

const deriveSourceId = ({ templateCode, fileName, sha256, duplicateIndex } = {}) => {
  const sha12 = sha256 ? sha256.slice(0, 12) : "no-sha";
  if (templateCode) {
    // SHA-256 12-char prefix đã đủ unique cho 216 file. Không cần thêm
    // duplicateIndex suffix trừ khi SHA thiếu (sha12 = "no-sha").
    if (sha12 === "no-sha") {
      const idx = duplicateIndex ?? 1;
      return idx > 1 ? `${templateCode}__${sha12}__v${idx}` : `${templateCode}__${sha12}`;
    }
    return `${templateCode}__${sha12}`;
  }
  const slug = slugifyForId(fileName);
  return `REF__${slug}__${sha12}`;
};

export { deriveSourceId, slugifyForId };
