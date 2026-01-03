#!/bin/bash

# 一键部署脚本 - AWS生产环境
# 用于首次部署和后续更新

PROJECT_DIR="/var/www/meeting-platform"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"

echo "========================================="
echo "  开始部署到生产环境"
echo "========================================="

# 1. 进入项目目录
cd $PROJECT_DIR || exit

# 2. 拉取最新代码
echo "[1/8] 拉取最新代码..."
git pull origin main

# 3. 安装服务器依赖
echo "[2/8] 安装服务器依赖..."
cd $SERVER_DIR
npm install --production

# 4. 生成Prisma Client
echo "[3/8] 生成Prisma Client..."
npx prisma generate

# 5. 执行数据库迁移
echo "[4/8] 执行数据库迁移..."
npx prisma migrate deploy

# 6. 构建后端
echo "[5/8] 构建后端..."
npm run build

# 7. 构建前端
echo "[6/8] 构建前端..."
cd $CLIENT_DIR
npm install
npm run build

# 8. 重启PM2进程
echo "[7/8] 重启应用..."
pm2 restart meeting-platform || pm2 start $SERVER_DIR/dist/index.js --name meeting-platform

# 9. 保存PM2配置
echo "[8/8] 保存PM2配置..."
pm2 save

echo ""
echo "========================================="
echo "  ✓ 部署完成！"
echo "========================================="
echo ""
echo "应用状态："
pm2 list
echo ""
echo "查看日志： pm2 logs meeting-platform"
echo "停止应用： pm2 stop meeting-platform"
echo "重启应用： pm2 restart meeting-platform"
echo ""


