FROM node:22-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.33.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile


FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.33.2

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY . .

RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build


FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Ho_Chi_Minh
ENV PORT=3001
ENV STORAGE_ROOT_PATH=/app/storage
ENV LIBREOFFICE_PATH=/usr/bin/libreoffice

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    tzdata \
    libreoffice \
    fontconfig \
    fonts-dejavu \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.33.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

# Quan trọng:
# Copy node_modules từ builder, không copy từ deps.
# Vì prisma generate chạy ở builder và tạo .prisma/client trong node_modules.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/scripts ./apps/api/scripts

# Smoke test: nếu Prisma client chưa được generate thì build fail ngay tại đây,
# không để tới runtime mới crash.
WORKDIR /app/apps/api
RUN node -e "console.log('resolved=', require.resolve('@prisma/client')); require('@prisma/client'); console.log('[OK] Prisma client is available from apps/api')"

WORKDIR /app/apps/api

# QUANLYVKS POWERSHELL EXE WRAPPER
# Linux Docker không có powershell.exe / Word COM.
# Backend vẫn gọi powershell.exe, nên wrapper này bắt lệnh đó và convert DOCX -> PDF bằng LibreOffice.
RUN cat > /usr/local/bin/powershell.exe <<'SH'
#!/bin/sh
set -eu

echo "[quanlyvks-pdf-wrapper] powershell.exe invoked" >&2
echo "[quanlyvks-pdf-wrapper] args: $*" >&2

INPUT=""
OUTPUT=""
OUTDIR=""

PREV=""

for ARG in "$@"; do
  case "$ARG" in
    *.docx)
      INPUT="$ARG"
      ;;
    *.pdf)
      OUTPUT="$ARG"
      ;;
  esac

  case "$PREV" in
    -InputPath|-DocxPath|-SourcePath|-Path|-InputFile|-DocxFile)
      INPUT="$ARG"
      ;;
    -OutputPath|-PdfPath|-TargetPath|-OutputFile|-PdfFile)
      OUTPUT="$ARG"
      ;;
    -OutputDir|-OutDir|-TargetDir)
      OUTDIR="$ARG"
      ;;
  esac

  PREV="$ARG"
done

if [ -z "$INPUT" ]; then
  echo "[quanlyvks-pdf-wrapper] ERROR: Cannot find DOCX input from args" >&2
  exit 2
fi

if [ -n "$OUTPUT" ]; then
  OUTDIR="$(dirname "$OUTPUT")"
fi

if [ -z "$OUTDIR" ]; then
  OUTDIR="$(dirname "$INPUT")"
fi

mkdir -p "$OUTDIR"

echo "[quanlyvks-pdf-wrapper] INPUT=$INPUT" >&2
echo "[quanlyvks-pdf-wrapper] OUTPUT=$OUTPUT" >&2
echo "[quanlyvks-pdf-wrapper] OUTDIR=$OUTDIR" >&2

libreoffice \
  --headless \
  --nologo \
  --nofirststartwizard \
  --convert-to pdf \
  --outdir "$OUTDIR" \
  "$INPUT"

CREATED="$OUTDIR/$(basename "$INPUT" .docx).pdf"

if [ ! -f "$CREATED" ]; then
  echo "[quanlyvks-pdf-wrapper] ERROR: LibreOffice did not create PDF: $CREATED" >&2
  exit 3
fi

if [ -n "$OUTPUT" ] && [ "$CREATED" != "$OUTPUT" ]; then
  mv -f "$CREATED" "$OUTPUT"
  CREATED="$OUTPUT"
fi

echo "[quanlyvks-pdf-wrapper] PDF created: $CREATED" >&2
exit 0
SH

RUN chmod +x /usr/local/bin/powershell.exe
RUN which powershell.exe

EXPOSE 3001
CMD ["node", "dist/main.js"]




