@echo off
chcp 65001 >nul
title JARVIS Installer Builder

echo ============================================
echo   JARVIS - Build do Instalador Completo
echo ============================================
echo.

:: 1. Build do frontend + PyInstaller
echo ^>^>^> [1/3] Compilando executavel (npm + PyInstaller)...
echo.
python scripts\build_exe.py
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Build do executavel falhou!
    pause
    exit /b %ERRORLEVEL%
)
echo.

:: 2. Verificar se o .exe foi gerado
echo ^>^>^> [2/3] Verificando executavel...
if not exist "dist\JARVIS.exe" (
    echo [ERRO] dist\JARVIS.exe nao encontrado!
    pause
    exit /b 1
)
echo OK - dist\JARVIS.exe encontrado
echo.

:: 3. Compilar instalador com Inno Setup
echo ^>^>^> [3/3] Compilando instalador (Inno Setup)...
echo.

:: Tenta encontrar ISCC automaticamente
set ISCC_PATH=
if exist "C:\Program Files\Inno Setup 7\ISCC.exe" set ISCC_PATH="C:\Program Files\Inno Setup 7\ISCC.exe"
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" set ISCC_PATH="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if exist "C:\Program Files\Inno Setup 6\ISCC.exe" set ISCC_PATH="C:\Program Files\Inno Setup 6\ISCC.exe"
if exist "C:\Program Files (x86)\Inno Setup 5\ISCC.exe" set ISCC_PATH="C:\Program Files (x86)\Inno Setup 5\ISCC.exe"

if "%ISCC_PATH%"=="" (
    echo [AVISO] Inno Setup nao encontrado.
    echo         O executavel foi gerado em: dist\JARVIS.exe
    echo.
    echo Para compilar o instalador manualmente:
    echo   1. Instale Inno Setup 6+ em: https://jrsoftware.org/isdl.php
    echo   2. Execute: iscc scripts\installer.iss
    echo.
) else (
    %ISCC_PATH% scripts\installer.iss
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Compilacao do instalador falhou!
        pause
        exit /b %ERRORLEVEL%
    )
)

echo.
echo ============================================
echo   BUILD CONCLUIDO!
echo ============================================
echo.
dir /b dist\JARVIS-Setup-*.exe 2>nul && echo   Instalador: dist\JARVIS-Setup-*.exe
echo   Executavel: dist\JARVIS.exe
echo.
echo   Para instalar, execute o JARVIS-Setup-*.exe
echo.
pause
