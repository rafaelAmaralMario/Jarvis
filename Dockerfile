# JARVIS — Docker Image for Testing & Validation
# Build:  docker build -t jarvis:test .
# Run:    docker run --rm -it jarvis:test
# Shell:  docker run --rm -it --entrypoint bash jarvis:test

# ============================================================
# Stage 1: Backend dependencies + tests
# ============================================================
FROM ubuntu:24.04 AS backend

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PATH="/venv/bin:$PATH"

RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    git curl ca-certificates \
    libgtk-3-dev libwebkit2gtk-4.1-dev \
    libjavascriptcoregtk-4.1-dev libsoup-3.0-dev \
    tesseract-ocr tesseract-ocr-por tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /venv

WORKDIR /app
COPY backend/ ./backend/

RUN pip install -e "./backend[dev]" 2>&1
RUN pip install -e "./backend[ocr,caldav,docs,vision]" 2>&1 \
    || echo "Some optional groups may have failed (expected)"
RUN pip install -e "./backend[native,audio]" 2>&1 \
    || echo "native/audio groups require compilers — skipping (non-fatal)"

RUN cd backend && python -m pytest --tb=short --no-header -q 2>&1 \
    && echo "BACKEND TESTS PASSED" || (echo "BACKEND TESTS FAILED" && exit 1)

# ============================================================
# Stage 2: Frontend dependencies + tests + build
# ============================================================
FROM node:22-bookworm AS frontend

WORKDIR /app
COPY ui/package.json ui/package-lock.json ui/tsconfig*.json ui/vite.config.ts ui/index.html ./
COPY ui/public/ ./public/
COPY ui/src/ ./src/
COPY ui/e2e/ ./e2e/

RUN npm ci

RUN npx tsc --noEmit 2>&1 \
    && echo "TYPECHECK PASSED" || (echo "TYPECHECK FAILED" && exit 1)

RUN npx vitest run 2>&1 \
    && echo "UI TESTS PASSED" || (echo "UI TESTS FAILED" && exit 1)

RUN npm run build 2>&1 \
    && echo "FRONTEND BUILD PASSED" || (echo "FRONTEND BUILD FAILED" && exit 1)

# ============================================================
# Stage 3: Lint + combine artifacts
# ============================================================
FROM backend AS lint

RUN cd backend && ruff check . 2>&1 \
    && echo "LINT PASSED" || (echo "LINT FAILED (non-fatal)" && true)

# ============================================================
# Stage 4: Final image — runtime environment
# ============================================================
FROM ubuntu:24.04 AS runtime

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PATH="/venv/bin:$PATH"
ENV DISPLAY="${DISPLAY:-:99}"

RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    git curl ca-certificates \
    xvfb \
    libgtk-3-dev libwebkit2gtk-4.1-dev \
    libjavascriptcoregtk-4.1-dev libsoup-3.0-dev \
    tesseract-ocr tesseract-ocr-por tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /venv

WORKDIR /app

COPY --from=backend /venv /venv
COPY --from=backend /app/backend ./backend/
COPY --from=frontend /app/dist ./ui/dist/

RUN pip install -e "./backend[dev]" 2>&1

EXPOSE 1420

CMD ["bash", "-c", "Xvfb :99 -screen 0 1280x720x24 & sleep 1 && python backend/jarvis/main.py --dev"]
