#!/bin/bash

# 数据库备份脚本

set -e

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="pim_db"
DB_USER="pim_user"
S3_BUCKET="pim-backups"  # 修改为你的S3存储桶名称

echo "=========================================="
echo "开始备份数据库..."
echo "=========================================="

# 创建备份目录
mkdir -p $BACKUP_DIR

# 读取数据库密码
read -sp "输入数据库密码: " DB_PASSWORD
echo

# 执行备份
echo "📦 正在备份数据库..."
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 压缩备份文件
echo "🗜️ 压缩备份文件..."
gzip $BACKUP_DIR/backup_$DATE.sql

# 上传到S3（如果配置了AWS CLI）
if command -v aws &> /dev/null; then
    read -p "是否上传到S3? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "☁️ 上传到S3..."
        aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://$S3_BUCKET/
        echo "✅ 已上传到 s3://$S3_BUCKET/backup_$DATE.sql.gz"
    fi
fi

# 删除7天前的备份
echo "🧹 清理旧备份..."
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo ""
echo "✅ 备份完成！"
echo "备份文件: $BACKUP_DIR/backup_$DATE.sql.gz"
echo ""

# 列出所有备份
echo "现有备份:"
ls -lh $BACKUP_DIR/backup_*.sql.gz



