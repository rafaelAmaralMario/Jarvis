@echo off
chcp 65001 >nul
title JARVIS Installer Builder

echo ============================================
echo   JARVIS - Build do Instalador Completo
echo ============================================
echo.

:: 0. Ler versao atual do codigo
echo ^>^>^> [0/4] Obtendo versao...
for /f "tokens=2 delims== " %%a in ('python -c "import sys; sys.path.insert(0,'backend'); from jarvis.version import APP_VERSION; print(f'VERSION={APP_VERSION}')"') do set APP_VERSION=%%a
if "%APP_VERSION%"=="" set APP_VERSION=0.2.0
echo Versao: %APP_VERSION%
echo.

:: 1. Build do frontend + PyInstaller
echo ^>^>^> [1/4] Compilando executavel (npm + PyInstaller)...
echo.
python scripts\build_exe.py
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Build do executavel falhou!
    pause
    exit /b %ERRORLEVEL%
)
echo.

:: 2. Verificar se o .exe foi gerado
echo ^>^>^> [2/4] Verificando executavel...
if not exist "dist\JARVIS.exe" (
    echo [ERRO] dist\JARVIS.exe nao encontrado!
    pause
    exit /b 1
)
echo OK - dist\JARVIS.exe encontrado (%APP_VERSION%)
echo.

:: 3. Compilar instalador com Inno Setup
echo ^>^>^> [3/4] Compilando instalador (Inno Setup)...
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
    echo   2. Execute: iscc /dMyAppVersion=%APP_VERSION% scripts\installer.iss
    echo.
) else (
    %ISCC_PATH% /dMyAppVersion=%APP_VERSION% scripts\installer.iss
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Compilacao do instalador falhou!
        pause
        exit /b %ERRORLEVEL%
    )
)

:: 4. Renomear instalador para incluir versao se necessario
echo ^>^>^> [4/4] Finalizando...
for %%f in (dist\JARVIS-Setup-*.exe) do (
    if not "%%f"=="dist\JARVIS-Setup-%APP_VERSION%.exe" (
        move "%%f" "dist\JARVIS-Setup-%APP_VERSION%.exe" >nul 2>&1
    )
)

echo.
echo ============================================
echo   BUILD CONCLUIDO! - Versao %APP_VERSION%
echo ============================================
echo.
if exist "dist\JARVIS-Setup-%APP_VERSION%.exe" echo   Instalador: dist\JARVIS-Setup-%APP_VERSION%.exe
echo   Executavel: dist\JARVIS.exe
echo.
echo   Para instalar, execute o instalador acima.
echo.
pause
