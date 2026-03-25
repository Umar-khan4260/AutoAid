@echo off
echo ============================================================
echo   AutoAid Recommender API - Starting...
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.9+
    pause
    exit /b 1
)

REM Install dependencies if not already installed
echo [*] Checking Python dependencies...
pip install --default-timeout=100 -r requirements.txt --quiet

echo.
echo [*] Starting FastAPI server on http://localhost:8000
echo [*] Press Ctrl+C to stop
echo.

REM Run the FastAPI app from the api/ directory
cd /d "%~dp0"
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

pause
