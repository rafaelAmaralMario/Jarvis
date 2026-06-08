#!/usr/bin/env bash
set -euo pipefail

echo "=== Running Backend Tests ==="
cd backend
python -m pytest --tb=short --no-header -q
cd ..

echo "=== Running UI Tests ==="
cd ui
npm install --silent 2>/dev/null
npx tsc --noEmit
npx vitest run
cd ..

echo "=== Building React Frontend ==="
cd ui
npm run build
cd ..

echo "=== Building Server ==="
cd server
npm install --silent 2>/dev/null
npx tsc --noEmit
npx vitest run
npm run build
cd ..

echo "=== Running E2E Tests ==="
cd tests/e2e
npm init -y --silent 2>/dev/null
npm install vitest --silent 2>/dev/null
npx vitest run
cd ../..

echo "=== Installing Python Backend ==="
cd backend
pip install -e . 2>/dev/null || pip install -e .
cd ..

echo "=== Build Complete! ==="
echo "Run: python backend/jarvis/main.py"
