#!/bin/bash

# 数据库恢复脚本

set -e

BACKUP_DIR="/home/ubuntu/backups"
DB_NAME="pim_db"
DB_USER="pim_user"

echo "=========================================="
echo "数据库恢复工具"
echo "=========================================="

# 列出可用的备份
echo "可用的备份文件:"
ls -lh $BACKUP_DIR/backup_*.sql.gz | nl

# 选择备份文件
read -p "输入要恢复的备份编号: " BACKUP_NUM
BACKUP_FILE=$(ls $BACKUP_DIR/backup_*.sql.gz | sed -n "${BACKUP_NUM}p")

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ 无效的备份编号"
    exit 1
fi

echo ""
echo "⚠️  警告：这将覆盖当前数据库！"
read -p "确定要继续吗? (yes/no) " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "❌ 已取消"
    exit 0
fi

# 读取数据库密码
read -sp "输入数据库密码: " DB_PASSWORD
echo

# 解压备份文件
echo "📦 解压备份文件..."
gunzip -c $BACKUP_FILE > /tmp/restore.sql

# 恢复数据库
echo "🔄 恢复数据库..."
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME < /tmp/restore.sql

# 清理临时文件
rm /tmp/restore.sql

echo ""
echo "✅ 数据库恢复完成！"
echo "恢复文件: $BACKUP_FILE"
echo ""
echo "建议重启应用: pm2 restart all"



