"""Read Vietnamese .doc file (OLE compound document) and extract text.

Usage: py -X utf8 read_doc.py <path-to-.doc>
"""
import sys
import olefile


def extract_text(path: str) -> str:
    ole = olefile.OleFileIO(path)
    if not ole.exists("WordDocument"):
        ole.close()
        raise SystemExit(f"No WordDocument stream in {path}")
    word_stream = ole.openstream("WordDocument").read()
    text = word_stream.decode("utf-16le", errors="ignore")
    printable = "".join(c for c in text if c.isprintable() or c in "\n\t")
    lines = [ln.strip() for ln in printable.splitlines() if ln.strip()]
    ole.close()
    return "\n".join(lines)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Usage: read_doc.py <path>")
    print(extract_text(sys.argv[1]))
