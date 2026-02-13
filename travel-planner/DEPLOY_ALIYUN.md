# 部署到阿里云 (ECS) 指南

这是一个 React (前端) + Node.js (后端) + SQLite (数据库) 的全栈应用。
以下步骤将指导您如何在阿里云 ECS 服务器上部署此项目。

## 1. 准备阿里云服务器 (ECS)

1.  登录 [阿里云控制台](https://console.aliyun.com/)。
2.  购买一台 ECS 实例：
    *   **操作系统**: 推荐 **Ubuntu 20.04** 或 **22.04** (更易于安装 Node.js)。
    *   **配置**: 最低配置 (1核 2G) 即可运行本项目。
    *   **安全组**: 确保开放 **80** (HTTP) 和 **22** (SSH) 端口。

## 2. 连接服务器并安装环境

使用终端 (Mac/Linux) 或 PuTTY (Windows) 连接到服务器：
```bash
ssh root@<您的公网IP>
```

安装 Node.js (使用 nvm):
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc

# 安装 Node.js LTS 版本
nvm install --lts
node -v # 检查版本，应 > 18.x
```

安装 git:
```bash
apt update
apt install git -y
```

## 3. 获取代码与构建

将代码上传到服务器。您可以使用 Git (推荐) 或 SCP。

```bash
# 方法 A: Git Clone (如果您已将代码推送到 GitHub/GitLab)
git clone <您的仓库地址>
cd travel-planner

# 方法 B: 手动上传 (如果代码在本地)
# 在您本地电脑执行:
# scp -r /path/to/travel-planner root@<IP地址>:/root/
```

进入项目目录并安装依赖：
```bash
cd travel-planner
npm install
```

构建前端代码：
```bash
npm run build
# 这会生成一个 dist/ 目录，里面是打包好的前端文件
```

## 4. 启动服务 (使用 PM2)

PM2 是一个进程管理器，可以保证您的服务在后台一直运行，即使服务器重启也能自动启动。

```bash
# 安装 PM2
npm install -g pm2

# 启动服务 (指定端口为 80，这样可以直接通过 IP 访问)
PORT=80 pm2 start server/index.cjs --name "travel-app"

# 保存当前进程列表，以便开机自启
pm2 save
pm2 startup
```

## 5. 访问

现在，在浏览器输入您的 **服务器公网 IP** (例如 `http://123.45.67.89`)，您应该就能看到您的旅行规划应用了！

---

## 常见问题

**Q: 为什么无法访问？**
A: 请检查阿里云 ECS 控制台的 **安全组 (Security Group)** 设置，确保 **入方向** 规则允许了 TCP 协议的 **80** 端口。

**Q: 如何更新代码？**
A: 
1. `git pull` 拉取最新代码。
2. `npm run build` 重新打包前端。
3. `pm2 restart travel-app` 重启服务。
