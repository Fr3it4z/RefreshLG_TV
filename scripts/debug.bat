@echo off
REM Abre o DevTools (Chrome) conectado ao app rodando na TV.
set DEVICE=%1
if "%DEVICE%"=="" set DEVICE=tv
call ares-inspect --device %DEVICE% --app com.lgdetox.menu --open
