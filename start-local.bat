@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo [1/3] 清理端口占用 (3000, 3001, 5173)
echo ============================================

for %%P in (3000 3001 5173) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
        echo  - 杀掉端口 %%P 的进程 PID=%%A
        taskkill /PID %%A /F >nul 2>&1
    )
)

echo.
echo ============================================
echo [2/3] 启动后端 server
echo ============================================

if not exist "server\\package.json" (
    echo [ERROR] 未找到 server\\package.json
    pause
    exit /b 1
)

start "Backend Server" cmd /k "cd /d server && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ============================================
echo [3/3] 启动前端 client
echo ============================================

if not exist "client\\package.json" (
    echo [ERROR] 未找到 client\\package.json
    pause
    exit /b 1
)

start "Frontend Client" cmd /k "cd /d client && npm run dev"

echo.
echo ============================================
echo 启动完成
echo 前端: http://localhost:5173
echo 后端: http://localhost:3000
echo ============================================
pause
