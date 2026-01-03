# AWS部署快速参考卡片

## 🚀 最快部署方式（3个命令）

```bash
# 1. 初始化环境（仅首次）
./setup-ec2.sh

# 2. 部署应用
./deploy-app.sh

# 3. 配置SSL（可选）
sudo certbot --nginx -d your-domain.com
```

## 📋 必需信息

在部署前准备好这些信息：

- ✅ EC2实例公网IP
- ✅ SSH密钥文件 (.pem)
- ✅ 域名（如需HTTPS）
- ✅ 数据库密码（脚本会提示输入）

## 💰 成本估算

### 免费套餐（前12个月）
```
EC2 t2.micro:     免费 750小时/月
RDS db.t2.micro:  免费 750小时/月
S3:               免费 5GB
总计:             $0/月
```

### 最小生产环境
```
EC2 t3.small:     ~$15/月
RDS db.t3.micro:  ~$15/月
S3 + CloudFront:  ~$5/月
域名:             ~$12/年
总计:             ~$35-40/月
```

### 推荐生产环境
```
EC2 t3.medium:    ~$30/月
RDS db.t3.small:  ~$25/月
ElastiCache:      ~$15/月
总计:             ~$70/月
```

## 🔧 常用命令

### 应用管理
```bash
pm2 status              # 查看状态
pm2 logs                # 查看日志
pm2 restart all         # 重启应用
pm2 stop all            # 停止应用
pm2 monit               # 实时监控
```

### 更新应用
```bash
cd /home/ubuntu/deploy
./update-app.sh
```

### 数据库
```bash
./backup.sh             # 备份
./restore.sh            # 恢复
```

### Nginx
```bash
sudo nginx -t           # 测试配置
sudo systemctl restart nginx    # 重启
sudo tail -f /var/log/nginx/error.log  # 查看错误日志
```

## 🔍 检查清单

部署后检查：

```bash
# 1. 检查后端
curl http://localhost:3000/health
✅ 应返回: {"status":"ok"}

# 2. 检查数据库
psql -h localhost -U pim_user -d pim_db
✅ 应能成功连接

# 3. 检查PM2
pm2 status
✅ 应显示 "online" 状态

# 4. 检查Nginx
sudo systemctl status nginx
✅ 应显示 "active (running)"

# 5. 检查网站
curl http://your-domain.com
✅ 应返回HTML内容
```

## 🆘 快速故障排除

### 问题: PM2无法启动
```bash
# 查看详细错误
pm2 logs --err

# 检查环境变量
cat /home/ubuntu/pim-app/server/.env

# 手动启动查看错误
cd /home/ubuntu/pim-app/server
node dist/index.js
```

### 问题: 502 Bad Gateway
```bash
# 检查后端是否运行
pm2 status

# 检查端口占用
sudo netstat -tlnp | grep 3000

# 检查Nginx配置
sudo nginx -t
```

### 问题: 数据库连接失败
```bash
# 测试连接
psql -h localhost -U pim_user -d pim_db

# 检查PostgreSQL状态
sudo systemctl status postgresql

# 查看PostgreSQL日志
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 问题: HTTPS不工作
```bash
# 重新申请证书
sudo certbot --nginx -d your-domain.com

# 测试自动续期
sudo certbot renew --dry-run

# 检查证书
sudo certbot certificates
```

## 📊 监控指标

### 系统资源
```bash
# CPU和内存
htop

# 磁盘空间
df -h

# 网络连接
sudo netstat -tlnp
```

### 应用性能
```bash
# PM2监控
pm2 monit

# 数据库连接数
psql -h localhost -U pim_user -d pim_db -c "SELECT count(*) FROM pg_stat_activity;"

# Nginx请求统计
sudo tail -100 /var/log/nginx/access.log | wc -l
```

## 🔒 安全检查

```bash
# 1. 检查防火墙
sudo ufw status

# 2. 检查SSH配置
sudo cat /etc/ssh/sshd_config | grep PermitRootLogin
# 应为: PermitRootLogin no

# 3. 检查开放端口
sudo netstat -tlnp

# 4. 检查失败登录尝试
sudo grep "Failed password" /var/log/auth.log

# 5. 更新系统
sudo apt update && sudo apt upgrade -y
```

## 🔄 定期维护

### 每天
- [ ] 检查应用状态: `pm2 status`
- [ ] 查看错误日志: `pm2 logs --err`

### 每周
- [ ] 备份数据库: `./backup.sh`
- [ ] 检查磁盘空间: `df -h`
- [ ] 清理旧日志: `pm2 flush`

### 每月
- [ ] 更新系统: `sudo apt update && sudo apt upgrade`
- [ ] 更新依赖: `npm audit fix`
- [ ] 检查SSL证书: `sudo certbot certificates`
- [ ] 审查访问日志

## 📞 紧急联系

### AWS控制台
https://console.aws.amazon.com

### 实用链接
- [PM2文档](https://pm2.keymetrics.io/docs/)
- [Nginx文档](https://nginx.org/en/docs/)
- [PostgreSQL文档](https://www.postgresql.org/docs/)
- [Let's Encrypt文档](https://letsencrypt.org/docs/)

## 💡 优化技巧

### 性能优化
```bash
# 1. 启用Nginx缓存
# 编辑 /etc/nginx/sites-available/pim
# 添加缓存配置

# 2. 增加PM2实例数
# 编辑 ecosystem.config.js
instances: 'max',  # 使用所有CPU核心

# 3. 配置数据库连接池
# 编辑 server/.env
DATABASE_URL="postgresql://...?connection_limit=10"
```

### 成本优化
```bash
# 1. 使用CloudWatch设置成本警报

# 2. 停止开发环境实例
aws ec2 stop-instances --instance-ids i-xxxxx

# 3. 使用Reserved Instances（承诺1-3年）
# 可节省40-60%成本
```

## 🎯 下一步

- [ ] 配置CloudWatch监控
- [ ] 设置自动备份
- [ ] 配置CDN加速
- [ ] 实施CI/CD自动部署
- [ ] 配置域名邮箱
- [ ] 添加监控告警

---

**提示**: 将此文档收藏，部署时随时参考！



