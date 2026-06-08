@echo off
chcp 65001 >nul

echo === Running Backend Tests ===
cd backend
python -m pytest --tb=short --no-header -q
if %ERRORLEVEL% neq 0 (
    echo Backend tests failed!
    exit /b %ERRORLEVEL%
)
cd ..

echo === Running UI Tests ===
cd ui
call npm install >nul 2>&1
npx tsc --noEmit
if %ERRORLEVEL% neq 0 (
    echo TypeScript type check failed!
    exit /b %ERRORLEVEL%
)
npx vitest run
if %ERRORLEVEL% neq 0 (
    echo UI tests failed!
    exit /b %ERRORLEVEL%
)
cd ..

echo === Building React Frontend ===
cd ui
npm run build
if %ERRORLEVEL% neq 0 (
    echo React build failed!
    exit /b %ERRORLEVEL%
)
cd ..

echo === Building Server ===
cd server
call npm install >nul 2>&1
npx tsc --noEmit
if %ERRORLEVEL% neq 0 (
    echo Server type check failed!
    exit /b %ERRORLEVEL%
)
npx vitest run
if %ERRORLEVEL% neq 0 (
    echo Server tests failed!
    exit /b %ERRORLEVEL%
)
npm run build
if %ERRORLEVEL% neq 0 (
    echo Server build failed!
    exit /b %ERRORLEVEL%
)
cd ..

echo === Running E2E Tests ===
cd tests\e2e
call npm init -y >nul 2>&1
npm install vitest >nul 2>&1
npx vitest run
if %ERRORLEVEL% neq 0 (
    echo E2E tests failed!
    exit /b %ERRORLEVEL%
)
cd ..\..

echo === Installing Python Backend ===
cd backend
pip install -e . >nul 2>&1
if %ERRORLEVEL% neq 0 (
    pip install -e .
)
cd ..

echo === Build Complete! ===
echo Run: python backend/jarvis/main.py
echo Or dev mode: python backend/jarvis/main.py --dev
