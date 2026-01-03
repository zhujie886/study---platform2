#!/bin/bash

# 应用更新脚本
# 用于快速更新应用代码

set -e

APP_DIR="/home/ubuntu/pim-app"

echo "=========================================="
echo "开始更新应用..."
echo "=========================================="

cd $APP_DIR

# 拉取最新代码（如果使用Git）
if [ -d ".git" ]; then
    echo "📥 拉取最新代码..."
    git pull
fi

# 安装依赖
echo "📦 更新依赖..."
npm run install:all

# 构建前端
echo "🔨 重新构建前端..."
cd client
npm run build

# 构建后端
echo "🔨 重新构建后端..."
cd ../server

# 运行数据库迁移（如果有新迁移）
echo "🗄️ 检查数据库迁移..."
npx prisma migrate deploy

npm run build

# 重启应用
echo "🔄 重启应用..."
cd ..
pm2 restart all

# 清理Nginx缓存
echo "🧹 清理缓存..."
sudo systemctl reload nginx

echo ""
echo "✅ 应用更新完成！"
echo ""
echo "查看状态: pm2 status"
echo "查看日志: pm2 logs"



