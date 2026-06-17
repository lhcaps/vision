// A tiny, dependency-free YAML reader/writer. Supports the subset we use:
//   - scalars (string, number, bool, null)
//   - block scalars (>, |, >-, |-)
//   - nested mappings (2-space indent)
//   - lists (- item)
//   - comments (# at start of line, or after value with space-#)
//   - quoted strings (single or double)
//   - inline lists [a, b, c] and inline maps { a: b }
// Not a full YAML 1.2 implementation. Good enough for manifest + registry.

export function parse(src) {
  if (!src) return null;
  if (src.charCodeAt(0) === 0xfeff) src = src.slice(1);
  const lines = src.split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, container: root, type: 'map' }];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    if (!raw.trim() || raw.trim().startsWith('#')) {
      i++;
      continue;
    }
    const indent = raw.match(/^ */)[0].length;
    const content = raw.slice(indent);

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];

    if (content.startsWith('- ') || content === '-') {
      if (parent.type !== 'list') {
        throw new Error(`unexpected list item at line ${i + 1}: ${raw}`);
      }
      const itemText = content === '-' ? '' : content.slice(2);
      const kv = itemText.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
      let item;
      if (kv) {
        const k = kv[1];
        const v = kv[2];
        const obj = {};
        if (v === '' || v === undefined) {
          item = obj;
        } else {
          obj[k] = parseScalar(v);
          item = obj;
        }
      } else {
        item = parseScalarOrNested(itemText);
      }
      parent.container.push(item);
      if (typeof item === 'object' && !Array.isArray(item)) {
        stack.push({ indent, container: item, type: 'map' });
      } else if (Array.isArray(item)) {
        stack.push({ indent, container: item, type: 'list' });
      }
      i++;
      continue;
    }

    const m = content.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if (!m) {
      throw new Error(`cannot parse line ${i + 1}: ${raw}`);
    }
    const key = m[1];
    const rest = stripTrailingComment(m[2]);

    const blockMatch = rest.match(/^([>|])([-+]?)\s*$/);
    if (blockMatch) {
      const indicator = blockMatch[1];
      const chomp = blockMatch[2];
      const blockIndent = indent + 2;
      const blockLines = [];
      let j = i + 1;
      while (j < lines.length) {
        const ln = lines[j];
        if (!ln.trim()) {
          blockLines.push('');
          j++;
          continue;
        }
        const ind = ln.match(/^ */)[0].length;
        if (ind < blockIndent) break;
        blockLines.push(ln.slice(blockIndent));
        j++;
      }
      while (blockLines.length && blockLines[blockLines.length - 1] === '') {
        blockLines.pop();
      }
      let joined;
      if (indicator === '>') {
        let out = '';
        let prevEmpty = false;
        for (const bl of blockLines) {
          if (bl === '') {
            prevEmpty = true;
            continue;
          }
          if (out) out += prevEmpty ? '\n' : ' ';
          out += bl;
          prevEmpty = false;
        }
        joined = out;
      } else {
        joined = blockLines.join('\n');
      }
      parent.container[key] = joined;
      i = j;
      continue;
    }

    if (rest === '' || rest === undefined) {
      let j = i + 1;
      while (j < lines.length && (!lines[j].trim() || lines[j].trim().startsWith('#'))) j++;
      const child = {};
      const childList = [];
      if (j < lines.length) {
        const childIndent = lines[j].match(/^ */)[0].length;
        if (childIndent > indent) {
          if (lines[j].trim().startsWith('- ')) {
            parent.container[key] = childList;
            stack.push({ indent, container: childList, type: 'list' });
          } else {
            parent.container[key] = child;
            stack.push({ indent, container: child, type: 'map' });
          }
        } else {
          parent.container[key] = null;
        }
      } else {
        parent.container[key] = null;
      }
    } else if (rest.startsWith('[') && rest.endsWith(']')) {
      parent.container[key] = parseInlineList(rest);
    } else {
      parent.container[key] = parseScalar(rest);
    }
    i++;
  }
  return root;
}

function stripTrailingComment(s) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < s.length - 1; i++) {
    const c = s[i];
    if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === ' ' && s[i + 1] === '#' && !inSingle && !inDouble) {
      return s.slice(0, i);
    }
  }
  return s;
}

function parseScalarOrNested(text) {
  if (text.startsWith('{') && text.endsWith('}')) return parseInlineMap(text);
  if (text.startsWith('[') && text.endsWith(']')) return parseInlineList(text);
  return parseScalar(text);
}

function parseScalar(text) {
  const t = text.trim();
  if (t === '' || t === '~' || t === 'null') return null;
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  if (/^-?\d+\.\d+$/.test(t)) return parseFloat(t);
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseInlineList(text) {
  const inner = text.slice(1, -1).trim();
  if (!inner) return [];
  return splitTopLevel(inner, ',').map((s) => {
    const t = s.trim();
    if (t.startsWith('{') && t.endsWith('}')) return parseInlineMap(t);
    if (t.startsWith('[') && t.endsWith(']')) return parseInlineList(t);
    return parseScalar(t);
  });
}

function parseInlineMap(text) {
  const inner = text.slice(1, -1).trim();
  if (!inner) return {};
  const out = {};
  for (const pair of splitTopLevel(inner, ',')) {
    const idx = pair.indexOf(':');
    if (idx === -1) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    out[k] = parseScalarOrNested(v);
  }
  return out;
}

function splitTopLevel(s, sep) {
  const out = [];
  let depth = 0;
  let quote = null;
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      buf += c;
      if (c === quote && s[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      buf += c;
      continue;
    }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    if (c === sep && depth === 0) {
      out.push(buf);
      buf = '';
      continue;
    }
    buf += c;
  }
  if (buf) out.push(buf);
  return out;
}

export function stringify(value, indent = 0) {
  const pad = '  '.repeat(indent);
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (
      value.includes('\n') ||
      /[:#&*?|<>=!%@`]/.test(value) ||
      value !== value.trim() ||
      value === ''
    ) {
      return JSON.stringify(value);
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value
      .map((v) => formatListItem(v, indent))
      .join('\n');
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    return keys.map((k) => formatKey(k, value[k], indent)).join('\n');
  }
  return String(value);
}

function formatListItem(v, indent) {
  const pad = '  '.repeat(indent);
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const keys = Object.keys(v);
    return keys
      .map((k, i) => {
        const prefix = i === 0 ? '- ' : '  ';
        return `${pad}${prefix}${k}: ${formatInline(v[k], indent + 2)}`;
      })
      .join('\n');
  }
  if (v && typeof v === 'object' && Array.isArray(v)) {
    return `${pad}- ${stringify(v, indent + 1)}`;
  }
  return `${pad}- ${stringify(v, indent + 1)}`;
}

function formatInline(v, indent) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    if (valueNeedsQuoting(v)) return JSON.stringify(v);
    return v;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    if (v.every((x) => x === null || typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean')) {
      return '[' + v.map((x) => formatInline(x, 0)).join(', ') + ']';
    }
    return v.map((x) => formatListItem(x, indent)).join('\n');
  }
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    if (keys.length === 0) return '{}';
    return keys.map((k) => formatKey(k, v[k], indent)).join('\n');
  }
  return String(v);
}

function valueNeedsQuoting(v) {
  return v.includes('\n') || /[:#&*?|<>=!%@`]/.test(v) || v !== v.trim() || v === '';
}

function formatKey(k, v, indent) {
  const pad = '  '.repeat(indent);
  if (v && Array.isArray(v)) {
    if (v.length === 0) return `${pad}${k}: []`;
    const block = v.map((item) => formatListItem(item, indent + 1)).join('\n');
    return `${pad}${k}:\n${block}`;
  }
  if (v && typeof v === 'object') {
    if (Object.keys(v).length === 0) return `${pad}${k}: {}`;
    return `${pad}${k}:\n${formatInline(v, indent + 1)}`;
  }
  return `${pad}${k}: ${formatInline(v, indent + 1)}`;
}

export function toYaml(obj) {
  return stringify(obj, 0) + '\n';
}
