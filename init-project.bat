@echo off
chcp 65001 > nul
echo ========================================
echo 项目初始化脚本
echo ========================================
echo.

echo [1/4] 检查 Node.js 环境...
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js v18+
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

echo.
echo [2/4] 安装根目录依赖...
call npm install
if errorlevel 1 (
    echo ❌ 安装失败
    pause
    exit /b 1
)

echo.
echo [3/4] 安装后端依赖...
cd server
call npm install
if errorlevel 1 (
    echo ❌ 后端依赖安装失败
    pause
    exit /b 1
)

echo.
echo 生成 Prisma 客户端...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Prisma 生成失败
    pause
    exit /b 1
)

echo.
echo 运行数据库迁移...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo ⚠️  数据库迁移失败，但可能是因为已经迁移过
)

cd ..

echo.
echo [4/4] 安装前端依赖...
cd client
call npm install
if errorlevel 1 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo ✅ 项目初始化完成！
echo ========================================
echo.
echo 下一步：
echo 1. 双击运行 start-local.bat 启动项目
echo 2. 浏览器访问 http://localhost:5173
echo.
pause


