@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Preparando el sitio de AITUE...
call npm run build
if errorlevel 1 (
  echo No se pudo preparar el sitio. Revisa el error mostrado arriba.
  pause
  exit /b 1
)
echo.
echo Abri http://localhost:3000/admin en tu navegador.
echo Usuario inicial: admin@aitue.net
echo La contrasena esta en .env, variable ADMIN_PASSWORD.
echo Deja esta ventana abierta mientras usas el bot.
echo.
call npm start
pause
