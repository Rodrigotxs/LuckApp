@echo off
REM Sobe a stack inteira da Barbearia Luck com um duplo-clique.
REM Toda a logica esta em scripts\dev.ps1 — este arquivo so e o atalho.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev.ps1" %*
if errorlevel 1 (
  echo.
  echo Algo falhou. A janela fica aberta para voce ler o erro acima.
  pause
)
