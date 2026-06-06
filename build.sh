#!/usr/bin/env bash
set -euo pipefail

echo "=== Building React Frontend ==="
cd ui
npm install && npm run build
cd ..

echo "=== Building Python Backend ==="
cd backend
pip install -e .
cd ..

echo "=== Done ==="
echo "Run: python backend/jarvis/main.py"
