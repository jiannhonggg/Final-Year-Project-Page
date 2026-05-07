@echo off
cd /d "%~dp0"
echo Starting FYP Presentation server...
echo Open http://localhost:8080 in your browser
echo Close this window to stop the server.
echo.
python -m http.server 8080
pause
