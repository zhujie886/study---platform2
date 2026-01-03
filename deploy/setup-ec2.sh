#!/bin/bash

# AWS EC2 自动化设置脚本
# 在EC2实例上运行此脚本来自动配置环境

set -e  # 遇到错误立即退出

echo "=========================================="
echo "开始配置EC2实例..."
echo "=========================================="

# 更新系统
echo "📦 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18
echo "📦 安装Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "✅ Node.js $(node --version) 安装完成"
echo "✅ npm $(npm --version) 安装完成"

# 安装PostgreSQL
echo "📦 安装PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
fi
echo "✅ PostgreSQL 安装完成"

# 安装Nginx
echo "📦 安装Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
fi
echo "✅ Nginx 安装完成"

# 安装PM2
echo "📦 安装PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "✅ PM2 安装完成"

# 安装Git
echo "📦 安装Git..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
fi
echo "✅ Git 安装完成"

# 配置PostgreSQL
echo "🔧 配置PostgreSQL..."
read -p "输入数据库密码: " DB_PASSWORD

sudo -u postgres psql <<EOF
CREATE DATABASE pim_db;
CREATE USER pim_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE pim_db TO pim_user;
\q
EOF

echo "✅ PostgreSQL 配置完成"

# 配置防火墙
echo "🔒 配置防火墙..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo "✅ 防火墙配置完成"

# 安装Certbot（用于SSL证书）
echo "📦 安装Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
fi
echo "✅ Certbot 安装完成"

echo ""
echo "=========================================="
echo "✅ EC2实例配置完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 上传应用代码到 /home/ubuntu/pim-app"
echo "2. 运行 deploy-app.sh 脚本部署应用"
echo "3. 配置域名和SSL证书"
echo ""
echo "数据库信息："
echo "  数据库名: pim_db"
echo "  用户名: pim_user"
echo "  密码: $DB_PASSWORD"
echo ""



