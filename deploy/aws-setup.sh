#!/bin/bash

# AWS EC2 部署配置脚本
# 自动配置生产环境所需的所有设置

echo "========================================="
echo "  AWS 生产环境配置"
echo "========================================="

# 1. 更新系统包
echo "[1/7] 更新系统..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. 安装Node.js 18.x
echo "[2/7] 安装Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安装PM2（进程管理器）
echo "[3/7] 安装PM2..."
sudo npm install -g pm2

# 4. 安装PostgreSQL
echo "[4/7] 安装PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 5. 创建数据库
echo "[5/7] 配置数据库..."
sudo -u postgres psql -c "CREATE DATABASE meeting_platform;"
sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'your-secure-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE meeting_platform TO appuser;"

# 6. 安装Nginx
echo "[6/7] 安装Nginx..."
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 7. 配置防火墙
echo "[7/7] 配置防火墙..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "========================================="
echo "  ✓ 系统配置完成！"
echo "========================================="
echo ""
echo "下一步："
echo "1. 上传项目代码到 /var/www/meeting-platform"
echo "2. 配置环境变量 (.env)"
echo "3. 运行 npm install 安装依赖"
echo "4. 运行 npx prisma migrate deploy"
echo "5. 使用 PM2 启动应用"
echo ""


