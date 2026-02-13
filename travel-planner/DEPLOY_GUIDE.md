# 阿里云服务器部署指南 (新手向)

本指南将教你如何将 Travel Planner 旅行应用部署到阿里云服务器，让所有人都能通过公网访问。

## 准备工作

1.  **购买服务器 (ECS)**
    *   **操作系统**: 推荐选择 **Ubuntu 22.04** 或 **24.04** (对新手最友好)。
    *   **配置**: 最低配置 (如 2核 2G) 即可运行本项目。
    *   **公网 IP**: 购买时请确保分配了公网 IPv4 地址。

2.  **安全组设置 (防火墙)**
    *   在阿里云控制台找到你的实例 -> 安全组 -> 配置规则。
    *   **入方向** 添加规则：允许端口 `22` (SSH), `80` (HTTP), `3001` (后端端口)。
    *   授权对象：`0.0.0.0/0` (允许所有人访问)。

---

## 步骤 1: 连接服务器

使用你电脑上的终端 (Terminal/PowerShell) 连接到服务器：

```bash
# 将 <你的公网IP> 替换为实际 IP 地址
ssh root@<你的公网IP>
```

*如果这是第一次连接，输入 `yes` 确认指纹，然后输入服务器密码。*

---

## 步骤 2: 安装运行环境

在服务器终端中执行以下命令，安装 Node.js 和 PM2：

```bash
# 1. 更新系统软件源
apt update

# 2. 安装 Node.js (v20 版本)
curl -fsSL https://deb.nodesource.com/setup_20.x | -E bash -
apt install -y nodejs

# 3. 验证安装 (应该输出版本号)
node -v
npm -v

# 4. 安装 PM2 (用于在后台保持应用运行)
npm install -g pm2
```

---

## 步骤 3: 上传代码

这里介绍两种简单的方法：

### 方法 A: 使用 Git (推荐)
如果你已经把代码上传到了 GitHub/Gitee：

```bash
# 在服务器上
git clone <你的仓库地址>
cd travel-planner
```

### 方法 B: 手动上传 (如果你没有 Git 仓库)
在你**本地电脑**上，将项目文件夹复制到服务器：

```bash
# 在你本地电脑的项目父目录下执行
# 将 <你的公网IP> 替换为实际 IP
scp -r travel-planner root@<你的公网IP>:/root/
```
*上传完成后，在服务器上进入目录：`cd /root/travel-planner`*

---

## 步骤 4: 构建与启动

在服务器的项目目录下执行：

```bash
# 1. 安装项目依赖
npm install

# 2. 构建前端页面 (这会生成 dist 文件夹)
npm run build

# 3. 使用 PM2 启动后端服务
pm2 start server/index.cjs --name "travel-app"

# 4. 保存当前进程列表 (确保重启后自动运行)
pm2 save
pm2 startup
```

---

## 步骤 5: 验证访问

1.  打开浏览器。
2.  访问 `http://<你的公网IP>:3001`。
3.  你应该能看到你的旅行应用了！

---

## 进阶：使用 80 端口 (去掉 :3001)

如果你希望用户直接通过 `http://<IP>` 访问，而不需要输入端口号，可以使用 Nginx 进行端口转发。

1.  **安装 Nginx**:
    ```bash
    apt install -y nginx
    ```

2.  **配置 Nginx**:
    编辑配置文件:
    ```bash
    nano /etc/nginx/sites-available/default
    ```

    找到 `location /` 部分，修改为：
    ```nginx
    server {
        listen 80;
        
        # 你的公网IP 或 域名
        server_name _; 

        location / {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **重启 Nginx**:
    ```bash
    systemctl restart nginx
    ```

现在你可以直接访问 `http://<你的公网IP>` 了。
