@echo off
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul
set PATH=C:\Users\Rafae\AppData\Local\Programs\CMake\cmake-3.31.6-windows-x86_64\bin;%PATH%
set QT6_DIR=C:\Qt\6.8.0\msvc2022_64
set PATH=C:\Qt\6.8.0\msvc2022_64\bin;%PATH%
cmake -B build\test -G Ninja -DCMAKE_BUILD_TYPE=Debug -DBUILD_TESTING=ON -DCMAKE_PREFIX_PATH=C:\Qt\6.8.0\msvc2022_64
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%
cmake --build build\test
