# 部署脚本说明

此目录包含用于AWS EC2部署的自动化脚本。

## 📁 脚本文件

| 脚本 | 用途 | 运行位置 |
|------|------|----------|
| `setup-ec2.sh` | 初始化EC2实例，安装所有依赖 | EC2实例 |
| `deploy-app.sh` | 首次部署或完整重新部署应用 | EC2实例 |
| `update-app.sh` | 快速更新应用代码 | EC2实例 |
| `backup.sh` | 备份数据库 | EC2实例 |
| `restore.sh` | 恢复数据库 | EC2实例 |

## 🚀 使用方法

### 1. 首次部署

#### 步骤1: 上传脚本到EC2

在本地执行：
```bash
# 上传部署脚本
scp -i your-key.pem -r ./deploy ubuntu@your-ec2-ip:/home/ubuntu/

# 上传应用代码
scp -i your-key.pem -r ./实验2 ubuntu@your-ec2-ip:/home/ubuntu/pim-app
```

#### 步骤2: 连接到EC2并设置环境

```bash
# SSH连接
ssh -i your-key.pem ubuntu@your-ec2-ip

# 进入部署目录
cd /home/ubuntu/deploy

# 添加执行权限
chmod +x *.sh

# 运行初始化脚本
./setup-ec2.sh
```

#### 步骤3: 部署应用

```bash
# 运行部署脚本
./deploy-app.sh
```

脚本会提示你输入：
- 数据库密码
- JWT密钥（可自动生成）
- 加密密钥（可自动生成）
- 是否配置SSL证书

### 2. 更新应用

当你有新的代码更新时：

```bash
cd /home/ubuntu/deploy
./update-app.sh
```

### 3. 备份数据库

建议定期备份：

```bash
cd /home/ubuntu/deploy
./backup.sh
```

**自动备份（推荐）**：
```bash
# 添加到crontab
crontab -e

# 每天凌晨2点自动备份
0 2 * * * /home/ubuntu/deploy/backup.sh
```

### 4. 恢复数据库

如果需要恢复备份：

```bash
cd /home/ubuntu/deploy
./restore.sh
```

## 🔧 手动操作

### 查看应用状态
```bash
pm2 status
pm2 logs
```

### 重启应用
```bash
pm2 restart all
```

### 查看Nginx日志
```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 测试后端API
```bash
curl http://localhost:3000/health
```

### 检查数据库连接
```bash
psql -h localhost -U pim_user -d pim_db
```

## 📝 配置文件位置

- **应用目录**: `/home/ubuntu/pim-app`
- **环境变量**: `/home/ubuntu/pim-app/server/.env`
- **PM2配置**: `/home/ubuntu/pim-app/ecosystem.config.js`
- **Nginx配置**: `/etc/nginx/sites-available/pim`
- **应用日志**: `/home/ubuntu/pim-app/logs/`
- **备份目录**: `/home/ubuntu/backups/`

## ⚠️ 注意事项

1. **首次运行** `setup-ec2.sh` 之前，确保EC2实例是全新的Ubuntu 22.04
2. **数据库密码**要记录下来，后续操作会用到
3. **SSL证书**需要先配置域名DNS指向EC2公网IP
4. **备份脚本**建议设置定时任务自动运行
5. 修改 `deploy-app.sh` 中的 `DOMAIN` 变量为你的实际域名

## 🆘 故障排除

### 问题: 脚本执行失败

```bash
# 查看详细错误
bash -x ./script-name.sh
```

### 问题: 权限不足

```bash
# 添加执行权限
chmod +x *.sh
```

### 问题: PM2无法启动

```bash
# 查看错误日志
pm2 logs --err

# 手动启动查看错误
cd /home/ubuntu/pim-app/server
node dist/index.js
```

### 问题: Nginx配置错误

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -100 /var/log/nginx/error.log
```

## 📚 进阶配置

### 配置HTTPS（手动）
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 配置自动续期
```bash
# Certbot会自动配置，可以测试
sudo certbot renew --dry-run
```

### 优化PM2
编辑 `ecosystem.config.js`:
```javascript
instances: 'max',  // 使用所有CPU核心
max_memory_restart: '500M',  // 内存超过500M自动重启
```

### 监控资源使用
```bash
# CPU和内存
htop

# 磁盘使用
df -h

# 网络连接
sudo netstat -tlnp
```

## 🔒 安全建议

1. 定期更新系统: `sudo apt update && sudo apt upgrade`
2. 定期备份数据库
3. 使用强密码
4. 定期检查日志
5. 配置CloudWatch监控
6. 限制SSH访问IP

## 💡 提示

- 所有脚本都包含错误处理（`set -e`），遇到错误会立即停止
- 脚本会自动创建必要的目录和配置文件
- 日志文件会自动轮转，不会占用太多磁盘空间
- 建议在生产环境使用前先在测试环境验证

## 📞 获取帮助

如果遇到问题，请：
1. 查看脚本输出的错误信息
2. 检查相关日志文件
3. 参考 `AWS_DEPLOYMENT.md` 文档
4. 查看应用日志: `pm2 logs`



