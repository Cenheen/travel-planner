#!/bin/bash

# 旅行规划应用 - 自动化部署脚本
# 使用方法: ./deploy.sh

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  旅行规划应用 - 自动化部署"
echo "=========================================="
echo ""

# 1. 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 travel-planner 项目目录下运行此脚本"
    exit 1
fi

echo "✅ 当前目录: $(pwd)"
echo ""

# 2. 拉取最新代码
echo "📥 步骤 1: 拉取最新代码..."
git pull origin main
echo "✅ 代码已更新"
echo ""

# 3. 安装依赖
echo "📦 步骤 2: 安装项目依赖..."
npm install
echo "✅ 依赖已安装"
echo ""

# 4. 构建前端
echo "🔨 步骤 3: 构建前端应用..."
npm run build
echo "✅ 前端构建完成"
echo ""

# 5. 检查 dist 目录
echo "📁 步骤 4: 检查构建产物..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ dist 目录存在，包含 index.html"
    ls -lh dist/
else
    echo "❌ 错误: dist 目录或 index.html 不存在"
    exit 1
fi
echo ""

# 6. 初始化数据库（如果需要）
echo "🗄️  步骤 5: 检查数据库..."
npx prisma migrate deploy
echo "✅ 数据库已就绪"
echo ""

# 7. 停止旧的 PM2 进程
echo "🔄 步骤 6: 重启应用服务..."
if pm2 list | grep -q "travel-app"; then
    echo "停止旧的 travel-app 进程..."
    pm2 delete travel-app
fi

# 8. 启动新的服务（使用 3001 端口）
echo "启动新的 travel-app 服务..."
PORT=3001 pm2 start server/index.cjs --name "travel-app"

# 9. 保存 PM2 配置
pm2 save
echo ""

# 10. 显示状态
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "📊 服务状态:"
pm2 status
echo ""
echo "📝 查看日志: pm2 logs travel-app"
echo "🌐 访问地址: http://$(curl -s ifconfig.me):3001"
echo ""
echo "=========================================="
