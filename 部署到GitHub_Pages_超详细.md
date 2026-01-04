# 部署到 GitHub Pages（超详细小白版）

这份文档把“本地项目 → GitHub → 在线可访问网页”分成两部分：

1) 前端静态页面：部署到 GitHub Pages（必须做）
2) 后端 API + WebSocket：必须部署到其它服务器（否则大部分功能不能用）

本项目结构：

- 前端在 `client/`（Vite + React）
- 后端在 `server/`（Express + Prisma + Socket.IO）

---

## 0. 你需要准备的东西

1) 一个 GitHub 账号  
2) 已安装 Git（Windows 用户推荐 Git for Windows）  
3) 已安装 Node.js（建议 18 或 20）  
4) 能打开 PowerShell/终端  

如果命令行输入 `git -v` 或 `node -v` 报错，先安装再继续。

---

## 1. 先确认本地能运行（强烈建议）

### 1.1 启动后端（server）

在项目根目录打开 PowerShell，执行：

```powershell
cd d:\desktop\课程\实验2\server
npm install
```

如果还没有后端环境文件，复制示例（有就跳过）：

```powershell
copy .env.example .env
```

初始化 Prisma：

```powershell
npm run prisma:generate
npm run prisma:migrate
```

启动后端：

```powershell
npm run dev
```

浏览器打开 `http://localhost:3000/health`，看到 `{"status":"ok"}` 说明后端正常。

### 1.2 启动前端（client）

新开一个 PowerShell：

```powershell
cd d:\desktop\课程\实验2\client
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`，看到页面说明前端正常。

---

## 2. 在 GitHub 上新建仓库

1) 打开 GitHub，点击右上角 `+` → New repository  
2) 填写仓库名（建议英文或拼音，例如 `experiment-2`）  
3) 选择 `Public` 或 `Private`  
4) 不勾选 “Add a README”，点 Create repository  

---

## 3. 把本地代码推到 GitHub

在项目根目录执行：

```powershell
cd d:\desktop\课程\实验2
git init
git add .
git commit -m "init"
git branch -M main
```

然后把远程仓库地址粘进去（用你自己的仓库地址替换）：

```powershell
git remote add origin https://github.com/<你的用户名>/<你的仓库名>.git
git push -u origin main
```

如果提示登录，用 GitHub 的网页登录或 Token 登录即可。

---

## 4. 部署后端（必须做，前端才能正常使用）

GitHub Pages 只能放静态网页，后端必须放到服务器。
下面给出最直接的方式：使用项目里已有的 AWS 脚本。

### 4.1 创建一台 EC2（AWS）

1) AWS 控制台 → EC2 → Launch instance  
2) 选 Ubuntu 22.04  
3) 选 t2.micro 或 t3.micro（免费层）  
4) 新建 Key Pair（下载 .pem 文件）  
5) 安全组开放端口：  
   - 22（SSH）  
   - 80（HTTP）  
   - 443（HTTPS）  

记下 EC2 的 **Public IPv4 address**（公网 IP）。

### 4.2 连接到 EC2（PuTTY 小白版）

如果你用 **PuTTY**，按下面做：

1) 安装 PuTTY（包含 PuTTYgen）  
2) 打开 **PuTTYgen**  
   - 点 **Load** → 选择你的 `.pem`  
   - 若看不到 `.pem`，把文件类型改成 **All Files**  
   - 成功后点 **Save private key** → 保存成 `.ppk`  
3) 打开 **PuTTY**  
   - Host Name: `ubuntu@<EC2公网IP>`  
   - Port: `22`  
   - Connection type: `SSH`  
4) 左侧点 **Connection → SSH → Auth → Credentials**  
   - Private key file: 选择你刚保存的 `.ppk`  
5) 回到 **Session**，可以先 **Save**（下次直接点）  
6) 点击 **Open**  
7) 第一次会弹确认，点 **Accept**  
8) 进入后看到类似 `ubuntu@ip-...:~$` 就成功了  

如果你想用 PowerShell（可选）：
```powershell
ssh -i C:\path\to\your-key.pem ubuntu@<EC2公网IP>
```

### 4.3 在 EC2 上拉取代码并准备脚本

在 EC2 上执行：

提示：
1) PuTTY 里粘贴命令：直接 **右键** 就能粘贴  
2) 如果仓库是 Private，会提示用户名/密码：用户名填 GitHub 用户名，密码填 Token

```bash
sudo apt update
sudo apt install -y git
git clone https://github.com/<你的用户名>/<你的仓库名>.git /home/ubuntu/pim-app
cp -r /home/ubuntu/pim-app/deploy /home/ubuntu/deploy
cd /home/ubuntu/deploy
chmod +x *.sh
```

### 4.4 运行部署脚本

1) 初始化环境（只需要第一次）：
   
   ```bash
   ./setup-ec2.sh
   ```

2) 部署应用：
   
   ```bash
   ./deploy-app.sh
   ```

脚本会提示你输入数据库密码、JWT 密钥等信息，按提示输入即可。

### 4.5 配置后端允许 GitHub Pages 访问

编辑后端环境变量：

```bash
nano /home/ubuntu/pim-app/server/.env
```

把 `CORS_ORIGIN` 改成你的 GitHub Pages 域名（只写域名，不带路径）：

```
CORS_ORIGIN="https://<你的用户名>.github.io"
```

注意：本项目 Prisma 默认使用 SQLite。若你没有改 `schema.prisma`，请确保 `.env` 里是：
```
DATABASE_URL="file:./dev.db"
```
如果脚本写成了 PostgreSQL，把那行改成上面这行即可。

保存后重启服务：

```bash
pm2 restart all
```

### 4.6 测试后端是否正常

在服务器上执行：

```bash
curl http://localhost:3000/health
```

看到 `{"status":"ok"}` 表示后端正常。

### 4.7 绑定正式域名并开启 HTTPS（不使用临时域名）

GitHub Pages 是 https，如果后端不是 https，浏览器会拦截（Mixed Content）。  
想要 **正式域名 + HTTPS**，必须自己买域名并做 DNS 解析。

1) 购买域名  
   - 国内：阿里云 / 腾讯云  
   - 国外：Namecheap / GoDaddy

2) 在域名商的 DNS 里添加解析  
   - A 记录：`@` → 你的 EC2 公网 IP  
   - A 或 CNAME：`www` → `@`（或同一个公网 IP）

3) 等待解析生效（几分钟到几小时）

4) EC2 上修改 Nginx 域名并重启  
```bash
sudo nano /etc/nginx/sites-available/pim
```
把 `server_name ...;` 改成：
```
server_name 你的域名 www.你的域名;
```
保存后执行：
```bash
sudo nginx -t
sudo systemctl restart nginx
```

5) 申请 HTTPS 证书  
```bash
sudo certbot --nginx -d 你的域名 -d www.你的域名
```

> 没有域名就无法申请证书；如果暂时没有域名，只能先用临时域名或先用 HTTP 测试。

---

## 5. 配置 GitHub Pages 部署前端

本项目已经准备好 GitHub Actions 部署脚本：
`/.github/workflows/deploy-pages.yml`  
你只需要在 GitHub 上设置变量即可。

### 5.1 打开 GitHub Pages 设置

GitHub 仓库 → Settings → Pages  
Build and deployment 选择 `GitHub Actions`

### 5.2 设置前端环境变量

GitHub 仓库 → Settings → Secrets and variables → Actions → Variables  
点击 “New repository variable”，依次添加：

1) `VITE_API_URL`  
   
   - 值：`https://<你的后端域名>/api`  
   - 例：`https://api.example.com/api`

2) `VITE_WS_URL`  
   
   - 值：`https://<你的后端域名或IP>`  
   - 例：`https://api.example.com`

3) `BASE_URL`  
   
   - 如果仓库名是 `<你的用户名>.github.io`，填 `/`  
   - 其他仓库填 `/<你的仓库名>/`  

### 5.3 重新推送触发部署

回到本地，随便改一个文件（比如这个文档），然后：

```powershell
git add .
git commit -m "deploy docs"
git push
```

---

## 6. 查看上线地址

GitHub 仓库 → Actions  
看到部署成功后，回到 Settings → Pages  
页面地址一般是：

1) 普通仓库：`https://<你的用户名>.github.io/<你的仓库名>/`
2) 用户主页仓库（仓库名等于 `<你的用户名>.github.io`）：`https://<你的用户名>.github.io/`

---

## 7. 后续更新怎么发布

以后每次改代码，只要：

```powershell
git add .
git commit -m "update"
git push
```

GitHub Actions 会自动重新构建并发布新版本。

---

## 8. 常见问题排查

1) 页面空白  
   
   - 检查 `BASE_URL` 是否正确  
   - 普通仓库必须是 `/<仓库名>/`  

2) 刷新子页面出现 404  
   
   - 确认 `client/public/404.html` 存在  
   - 如果仓库名是 `<你的用户名>.github.io`，把 `client/public/404.html` 里的 `pathSegmentsToKeep` 改成 `0`  

3) API 报错 / 403 / CORS 错误  
   
   - 检查后端 `server/.env` 的 `CORS_ORIGIN` 是否包含 `https://<你的用户名>.github.io`  
   - 保存后记得 `pm2 restart all`

4) WebSocket 连接失败  
   
   - `VITE_WS_URL` 必须是 HTTPS 域名  
   - 前端是 HTTPS 时，后端也必须 HTTPS（否则浏览器会拦截）

5) Actions 构建失败  
   
   - 打开 GitHub → Actions 查看报错日志  
   - 确认 `client/package-lock.json` 存在  
   - 确认已设置 `VITE_API_URL`、`VITE_WS_URL`、`BASE_URL`

---

## 9. 你需要我继续帮的地方

如果你希望我一步一步带你做完后端部署（比如 AWS/其他平台），告诉我：

1) 你打算用哪家云服务  
2) 你有没有域名  
3) 你是否已经注册并能登录云控制台  
