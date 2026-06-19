// Minimal OLE Compound File Binary (CFB) + Word .doc text extractor.
// Pure Node, không cần native module. Đủ để trích text từ WordDocument stream
// theo cấu trúc Piece Table (FibBase/FibRgW97/FibRgLw97/CLX/Piece).
// Hỗ trợ Unicode (UTF-16LE) cho Word 97-2003.
//
// Tham khảo: MS-CFB (Compound File Binary) + MS-DOC (Word Binary File).
// Scope: chỉ phục vụ audit DOCX-first, không cover formatting/objects.

const SECTOR_SIZE_DEFAULT = 512;
const MINI_SECTOR_SIZE = 64;
const MINI_STREAM_CUTOFF = 4096;

const DIFSECT = 0xFFFFFFFC;
const ENDOFCHAIN = 0xFFFFFFFE;
const FREESECT = 0xFFFFFFFF;
const FATSECT = 0xFFFFFFFD;

class OleCompoundFile {
  constructor(buf) {
    if (buf.length < 512) throw new Error("CFB: file too small");
    this.buf = buf;
    if (buf.readUInt32LE(0) !== 0xE011CFD0) {
      throw new Error("CFB: bad signature");
    }
    this.sectorSize = 1 << buf.readUInt16LE(30);
    this.miniSectorSize = 1 << buf.readUInt16LE(32);
    this.dirSectorCount = buf.readUInt32LE(40);
    this.fatSectorCount = buf.readUInt32LE(44);
    this.firstDirSector = buf.readUInt32LE(48);
    this.transactionSignature = buf.readUInt32LE(52);
    this.miniStreamCutoff = buf.readUInt32LE(56);
    this.firstMiniFatSector = buf.readUInt32LE(60);
    this.miniFatSectorCount = buf.readUInt32LE(64);
    this.firstDifatSector = buf.readUInt32LE(68);
    this.difatSectorCount = buf.readUInt32LE(72);

    this.fat = this.#buildFat();
    this.miniFat = this.#buildMiniFat();
    this.dirEntries = this.#readDirectory();
  }

  #sectorOffset(sector) {
    return (sector + 1) * this.sectorSize;
  }

  #buildFat() {
    const out = [];
    if (this.fatSectorCount === 0) return out;
    const difatInline = [];
    for (let i = 0; i < 109; i += 1) {
      difatInline.push(this.buf.readUInt32LE(76 + i * 4));
    }
    const sectors = [...difatInline];
    let cur = this.firstDifatSector;
    let remaining = this.difatSectorCount;
    while (cur !== ENDOFCHAIN && cur !== FREESECT && remaining > 0) {
      const off = this.#sectorOffset(cur);
      for (let i = 0; i < 127; i += 1) {
        sectors.push(this.buf.readUInt32LE(off + i * 4));
      }
      cur = this.buf.readUInt32LE(off + 127 * 4);
      remaining -= 1;
    }
    for (const s of sectors) {
      if (s === FREESECT || s === ENDOFCHAIN) continue;
      const off = this.#sectorOffset(s);
      for (let i = 0; i < this.sectorSize / 4; i += 1) {
        out.push(this.buf.readUInt32LE(off + i * 4));
      }
    }
    return out;
  }

  #buildMiniFat() {
    const out = [];
    let cur = this.firstMiniFatSector;
    let remaining = this.miniFatSectorCount;
    while (cur !== ENDOFCHAIN && cur !== FREESECT && remaining > 0) {
      const off = this.#sectorOffset(cur);
      for (let i = 0; i < this.sectorSize / 4; i += 1) {
        out.push(this.buf.readUInt32LE(off + i * 4));
      }
      cur = this.fat[cur] ?? ENDOFCHAIN;
      remaining -= 1;
    }
    return out;
  }

  #readDirectory() {
    const entries = [];
    let cur = this.firstDirSector;
    while (cur !== ENDOFCHAIN && cur !== FREESECT) {
      const off = this.#sectorOffset(cur);
      for (let i = 0; i < this.sectorSize / 128; i += 1) {
        const entryOff = off + i * 128;
        const nameLen = this.buf.readUInt16LE(entryOff + 64);
        if (nameLen === 0) continue;
        const nameBuf = this.buf.slice(entryOff, entryOff + nameLen);
        let name = "";
        for (let j = 0; j < nameLen - 2; j += 1) {
          const ch = nameBuf.readUInt16LE(j * 2);
          if (ch === 0) break;
          name += String.fromCharCode(ch);
        }
        const type = this.buf.readUInt8(entryOff + 66);
        const color = this.buf.readUInt8(entryOff + 67);
        const left = this.buf.readUInt32LE(entryOff + 68);
        const right = this.buf.readUInt32LE(entryOff + 72);
        const child = this.buf.readUInt32LE(entryOff + 76);
        const startSector = this.buf.readUInt32LE(entryOff + 116);
        const size = this.buf.readUInt32LE(entryOff + 120);
        entries.push({
          name,
          type,
          color,
          left,
          right,
          child,
          startSector,
          size,
        });
      }
      cur = this.fat[cur] ?? ENDOFCHAIN;
    }
    return entries;
  }

  #readStreamRegular(startSector, size) {
    const out = Buffer.alloc(size);
    let written = 0;
    let cur = startSector;
    while (cur !== ENDOFCHAIN && cur !== FREESECT && written < size) {
      const off = this.#sectorOffset(cur);
      const chunk = Math.min(this.sectorSize, size - written);
      this.buf.copy(out, written, off, off + chunk);
      written += chunk;
      cur = this.fat[cur] ?? ENDOFCHAIN;
    }
    return out.subarray(0, written);
  }

  #readStreamMini(startSector, size) {
    // Build mini stream first.
    const root = this.dirEntries.find((e) => e.name === "Root Entry" || e.name === "root");
    if (!root) throw new Error("CFB: no Root Entry");
    const miniSize = root.size;
    const miniStream = this.#readStreamRegular(root.startSector, miniSize);
    const out = Buffer.alloc(size);
    let written = 0;
    let cur = startSector;
    while (cur !== ENDOFCHAIN && cur !== FREESECT && written < size) {
      const off = cur * this.miniSectorSize;
      const chunk = Math.min(this.miniSectorSize, size - written);
      miniStream.copy(out, written, off, off + chunk);
      written += chunk;
      cur = this.miniFat[cur] ?? ENDOFCHAIN;
    }
    return out.subarray(0, written);
  }

  readStream(entryName) {
    const entry = this.dirEntries.find((e) => e.name === entryName);
    if (!entry) throw new Error(`CFB: stream ${entryName} not found`);
    if (entry.size === 0) return Buffer.alloc(0);
    if (entry.size < this.miniStreamCutoff) {
      return this.#readStreamMini(entry.startSector, entry.size);
    }
    return this.#readStreamRegular(entry.startSector, entry.size);
  }

  hasStream(entryName) {
    return this.dirEntries.some((e) => e.name === entryName);
  }
}

// Word FIB (File Information Block) + Piece Table → text.
// Fallback: nếu không parse được Clx (file Word 6/95, malformed, hoặc
// FcClx không trỏ đúng), ta quét toàn bộ WordDocument tìm đoạn UTF-16LE
// tiếng Việt dài ≥ 4 ký tự. Đây là best-effort cho audit DOCX-first, không
// phải parser hoàn chỉnh MS-DOC.

import { Buffer } from "node:buffer";

const readClxOffset = (buf) => {
  // FibRgFcLcb97 bắt đầu tại 0x00A2. fcClx ở index 2, lcbClx ở index 2+1.
  // Mỗi entry là 8 byte (fc 4B + lcb 4B) → fcClx @ 0x00A2+16, lcbClx @ 0x00A2+20.
  const fcClx = buf.readUInt32LE(0x00A2 + 16);
  const lcbClx = buf.readUInt32LE(0x00A2 + 20);
  return { fcClx, lcbClx };
};

const readClx = (clxBuf) => {
  // Clx = (Prc, ...) + PlcPcd (piece table). Skip 0..n-1 cho đến khi gặp tag 0x02.
  let i = 0;
  let plcfpcd = null;
  while (i < clxBuf.length) {
    const clxt = clxBuf.readUInt8(i);
    if (clxt === 0x01) {
      // Prc: 2 bytes cb + cb bytes data.
      const cb = clxBuf.readUInt16LE(i + 1);
      i += 1 + 2 + cb;
    } else if (clxt === 0x02) {
      // PlcPcd: 4 bytes lcb (PlcPcd.lcb), rồi (lcb/4) Pcd entries, sau đó 4 byte lcb cho Cps.
      const lcb = clxBuf.readUInt32LE(i + 1);
      const cpsCount = lcb / 4 - 1; // Cps có (N+1) entries
      const pcdCount = cpsCount;
      const cpsStart = i + 1 + 4;
      const pcdStart = cpsStart + (cpsCount + 1) * 4;
      const cps = [];
      for (let k = 0; k < cpsCount + 1; k += 1) {
        cps.push(clxBuf.readUInt32LE(cpsStart + k * 4));
      }
      const pcds = [];
      for (let k = 0; k < pcdCount; k += 1) {
        const pcdOff = pcdStart + k * 8;
        const cpStart = cps[k];
        const cpEnd = cps[k + 1];
        const fcCompressed = clxBuf.readUInt32LE(pcdOff);
        // Pcd.fc.fCompressed: bit 30 = 1 → compressed (1 byte/char), else unicode (2 bytes/char)
        const compressed = (fcCompressed & 0x40000000) !== 0;
        const fc = fcCompressed & 0x3FFFFFFF;
        pcds.push({ cpStart, cpEnd, fc, compressed });
        void cpEnd;
      }
      plcfpcd = pcds;
      break;
    } else {
      throw new Error(`Unknown Clxt tag ${clxt} at ${i}`);
    }
  }
  return plcfpcd;
};

const isLikelyVietnameseChar = (code) => {
  if (code < 0x20) return false;
  if (code < 0x80) return true; // ASCII
  if (code >= 0x00C0 && code <= 0x024F) return true; // Latin Extended
  if (code >= 0x1E00 && code <= 0x1EFF) return true; // Latin Extended Additional
  if (code >= 0x0300 && code <= 0x036F) return true; // Combining diacritics
  return false;
};

const scanUtf16Text = (buf) => {
  // Quét tìm chuỗi UTF-16LE có nghĩa: ≥ 4 ký tự liên tiếp là printable +
  // diacritics. Trả về text nối lại với newline giữa các đoạn.
  const out = [];
  let current = "";
  for (let i = 0; i + 1 < buf.length; i += 2) {
    const code = buf.readUInt16LE(i);
    if (isLikelyVietnameseChar(code)) {
      current += String.fromCharCode(code);
    } else if (code === 0x0D || code === 0x0A) {
      if (current.length >= 4) {
        out.push(current);
      }
      current = "";
    } else {
      if (current.length >= 4) {
        out.push(current);
      }
      current = "";
    }
  }
  if (current.length >= 4) out.push(current);
  return out.join("\n");
};

export const extractDocText = (buf) => {
  const cfb = new OleCompoundFile(buf);
  if (!cfb.hasStream("WordDocument")) {
    throw new Error("DOC: missing WordDocument stream");
  }
  const wd = cfb.readStream("WordDocument");
  let text = null;
  let method = "clx-fallback";
  let warnings = [];

  // Approach 1: parse Clx từ FibRgFcLcb97.
  try {
    const { fcClx, lcbClx } = readClxOffset(wd);
    if (lcbClx > 0) {
      const clxBuf = wd.slice(fcClx, fcClx + lcbClx);
      const pcds = readClx(clxBuf);
      if (pcds) {
        text = buildTextFromPieces(wd, pcds);
        method = "clx-piece-table";
        return { text, sectorSize: cfb.sectorSize, streams: cfb.dirEntries.filter((e) => e.type === 2).map((e) => e.name), method, warnings };
      }
    }
    warnings.push("Clx parse fail (fcClx/lcbClx không hợp lệ)");
  } catch (err) {
    warnings.push("Clx parse error: " + err.message);
  }

  // Approach 2: scan UTF-16LE best-effort.
  text = scanUtf16Text(wd);
  return {
    text,
    sectorSize: cfb.sectorSize,
    streams: cfb.dirEntries.filter((e) => e.type === 2).map((e) => e.name),
    method,
    warnings,
  };
};

export const inspectOle = (buf) => {
  const cfb = new OleCompoundFile(buf);
  return {
    sectorSize: cfb.sectorSize,
    streams: cfb.dirEntries
      .filter((e) => e.type === 2)
      .map((e) => ({ name: e.name, size: e.size })),
  };
};
