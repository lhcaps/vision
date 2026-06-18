import os, re
from pathlib import Path

root = Path('apps/web/src/components/documents')
DONE = {1, 4, 5, 8, 10, 12, 13, 15, 17, 19, 20, 29, 30, 33, 37, 38, 40, 44, 47, 53, 59, 70, 71, 76, 72, 74, 78, 81, 83, 85, 87, 88, 89}

forms = []
for f in sorted(root.glob('bm-*-form-inputs.tsx')):
    m = re.search(r'bm-(\d+)-form-inputs', f.name)
    if not m:
        continue
    bm_id = int(m.group(1))
    if bm_id in DONE:
        continue
    if bm_id > 200:
        continue
    text = f.read_text(encoding='utf-8')
    if 'BmFormSection' in text and 'BmFormMetaBar' in text:
        continue
    lines = len(text.splitlines())
    forms.append((bm_id, lines, f.name))

# Group by ID ranges
def in_range(b, ranges):
    return any(a <= b <= b_ for a, b_ in ranges)

print('=== BESPOKE candidates G02 BP_NGAN_CHAN (085, 091-104) ===')
print('  ID  Lines  File')
total = 0
for bm, lines, name in sorted(forms):
    if bm == 85 or (91 <= bm <= 104):
        print(f'{bm:>4} {lines:>6}  {name}')
        total += lines
print(f'\nSubtotal lines (if all done): {total}')
print()

# Smallest 12 LEGACY overall (likely good candidates)
print('=== Smallest 12 LEGACY (any group) ===')
for bm, lines, name in sorted(forms, key=lambda x: x[1])[:12]:
    print(f'{bm:>4} {lines:>6}  {name}')

print(f'\n=== Stats ===')
print(f'Total LEGACY: {len(forms)}')
print(f'Total lines: {sum(x[1] for x in forms)}')
print(f'Smallest: {min(x[1] for x in forms)}')
print(f'Largest: {max(x[1] for x in forms)}')
print(f'Median: {sorted(x[1] for x in forms)[len(forms)//2]}')
