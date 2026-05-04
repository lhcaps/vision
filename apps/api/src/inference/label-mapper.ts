export interface LabelClassRecord {
  id: string;
  name: string;
  color: string;
}

export interface PredictionWithMetadata {
  labelClassId: string | null;
  metadataJson?: Record<string, unknown> | null;
}

const WHITESPACE_RE = /\s+/g;

function normalizeClassName(name: string): string {
  return name.toLowerCase().trim().replace(WHITESPACE_RE, ' ');
}

export function resolvePredictionClass(
  prediction: PredictionWithMetadata,
  projectLabelClasses: LabelClassRecord[]
): { classKey: string; label: string } {
  if (prediction.labelClassId) {
    const lc = projectLabelClasses.find((l) => l.id === prediction.labelClassId);
    if (lc) {
      return { classKey: lc.name, label: lc.name };
    }
  }

  const metadata = prediction.metadataJson;
  const cocoLabel =
    typeof metadata?.cocoLabel === 'string'
      ? metadata.cocoLabel
      : typeof metadata?.cocoLabel === 'number'
        ? String(metadata.cocoLabel)
        : null;

  if (cocoLabel) {
    const normalized = normalizeClassName(cocoLabel);
    const matched = projectLabelClasses.find((l) => normalizeClassName(l.name) === normalized);
    if (matched) {
      return { classKey: matched.name, label: matched.name };
    }
    return { classKey: `unmapped:${normalized}`, label: cocoLabel };
  }

  return { classKey: 'unmapped:unknown', label: 'unknown' };
}

export function buildLabelClassMap(
  labelClasses: LabelClassRecord[]
): Map<string, LabelClassRecord> {
  const map = new Map<string, LabelClassRecord>();
  for (const lc of labelClasses) {
    map.set(lc.id, lc);
    map.set(normalizeClassName(lc.name), lc);
  }
  return map;
}
