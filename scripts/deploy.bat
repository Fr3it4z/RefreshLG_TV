@echo off
REM Empacota, instala e abre o menu na TV.
REM Uso (na pasta do projeto):  scripts\deploy.bat   [nome-do-device, padrao: tv]
setlocal
set DEVICE=%1
if "%DEVICE%"=="" set DEVICE=tv
set APPID=com.lgdetox.menu

cd /d "%~dp0.."
if not exist dist mkdir dist
del /q dist\*.ipk 2>nul

echo === Empacotando ===
call ares-package app -o dist || goto :erro

echo === Instalando em %DEVICE% ===
for %%f in (dist\*.ipk) do call ares-install --device %DEVICE% "%%f" || goto :erro

echo === Abrindo ===
call ares-launch --device %DEVICE% %APPID% || goto :erro

echo Pronto!
exit /b 0

:erro
echo.
echo Falhou. Confira se o Developer Mode esta ligado e a TV na mesma rede.
exit /b 1
