#!/bin/bash

# 应用部署脚本
# 在应用目录运行此脚本来部署/更新应用

set -e

APP_DIR="/home/ubuntu/pim-app"
DOMAIN="your-domain.com"  # 修改为你的域名

echo "=========================================="
echo "开始部署应用..."
echo "=========================================="

# 检查目录
if [ ! -d "$APP_DIR" ]; then
    echo "❌ 应用目录不存在: $APP_DIR"
    echo "请先上传代码到该目录"
    exit 1
fi

cd $APP_DIR

# 配置环境变量
echo "🔧 配置环境变量..."
if [ ! -f "server/.env" ]; then
    echo "请配置 server/.env 文件"
    read -p "是否现在配置? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "数据库密码: " DB_PASSWORD
        read -p "JWT密钥 (留空自动生成): " JWT_SECRET
        if [ -z "$JWT_SECRET" ]; then
            JWT_SECRET=$(openssl rand -base64 32)
        fi
        read -p "加密密钥 (留空自动生成): " ENCRYPTION_KEY
        if [ -z "$ENCRYPTION_KEY" ]; then
            ENCRYPTION_KEY=$(openssl rand -base64 32 | head -c 32)
        fi
        
        cat > server/.env <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://pim_user:$DB_PASSWORD@localhost:5432/pim_db"
JWT_SECRET="$JWT_SECRET"
ENCRYPTION_KEY="$ENCRYPTION_KEY"
CORS_ORIGIN="https://$DOMAIN"
EOF
        echo "✅ 环境变量配置完成"
    else
        echo "❌ 请手动创建 server/.env 文件后再运行"
        exit 1
    fi
fi

# 安装依赖
echo "📦 安装依赖..."
if [ -f "package.json" ]; then
    npm run install:all
else
    echo "â„¹ï¸ æœªæ‰¾åˆ°æ ¹ç›®å½• package.jsonï¼Œåˆ†åˆ«å®‰è£… client/server ä¾èµ–"
    (cd server && (npm ci || npm install))
    (cd client && (npm ci || npm install))
fi

# 数据库迁移
echo "🗄️ 运行数据库迁移..."
cd server
npx prisma migrate deploy
npx prisma generate

# 构建应用
echo "🔨 构建前端..."
cd ../client
npm run build

echo "🔨 构建后端..."
cd ../server
npm run build

# 配置PM2
echo "⚙️ 配置PM2..."
cat > /home/ubuntu/pim-app/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'pim-backend',
    cwd: '/home/ubuntu/pim-app/server',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/ubuntu/pim-app/logs/err.log',
    out_file: '/home/ubuntu/pim-app/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
EOF

# 创建日志目录
mkdir -p /home/ubuntu/pim-app/logs

# 启动/重启应用
echo "🚀 启动应用..."
cd /home/ubuntu/pim-app
if pm2 list | grep -q "pim-backend"; then
    pm2 restart ecosystem.config.js
else
    pm2 start ecosystem.config.js
    pm2 startup
    pm2 save
fi

# 配置Nginx
echo "🔧 配置Nginx..."
sudo tee /etc/nginx/sites-available/pim > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root /home/ubuntu/pim-app/client/dist;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # 前端路由
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket支持
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/pim /etc/nginx/sites-enabled/

# 测试Nginx配置
echo "🧪 测试Nginx配置..."
sudo nginx -t

# 重启Nginx
echo "🔄 重启Nginx..."
sudo systemctl restart nginx

# 检查状态
echo "📊 检查服务状态..."
echo ""
echo "PM2状态:"
pm2 status
echo ""
echo "Nginx状态:"
sudo systemctl status nginx --no-pager
echo ""

# 配置SSL (可选)
read -p "是否配置SSL证书? (需要先配置域名DNS) (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔒 配置SSL证书..."
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --register-unsafely-without-email
    echo "✅ SSL证书配置完成"
fi

echo ""
echo "=========================================="
echo "✅ 应用部署完成！"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  HTTP:  http://$DOMAIN"
echo "  HTTPS: https://$DOMAIN"
echo "  API:   https://$DOMAIN/api/health"
echo ""
echo "管理命令:"
echo "  查看日志: pm2 logs"
echo "  重启应用: pm2 restart all"
echo "  停止应用: pm2 stop all"
echo "  查看状态: pm2 status"
echo ""
echo "Nginx日志:"
echo "  访问日志: /var/log/nginx/access.log"
echo "  错误日志: /var/log/nginx/error.log"
echo ""


