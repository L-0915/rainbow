# 🌈 彩虹创口贴 - 阿里云 Docker 一键部署脚本

# 镜像地址
IMAGE_URL="harbor.baai.ac.cn/external-cooperation/flagrelease:flagrelease_nv_qwen3_8b"

# 容器名称
CONTAINER_NAME="rainbow-helper"

# 端口映射
HOST_PORT=7860
CONTAINER_PORT=7860

# 数据持久化目录
DATA_DIR="/opt/rainbow-data"

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🌈 彩虹创口贴 - 阿里云 Docker 一键部署              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
fi

echo "✅ Docker 版本：$(docker --version)"
echo ""

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p "$DATA_DIR"

# 停止旧容器
echo "⏹️  停止旧容器（如果存在）..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# 拉取镜像
echo "📥 拉取镜像：$IMAGE_URL"
docker pull "$IMAGE_URL"

# 启动容器
echo "🚀 启动容器..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart always \
  -p "$HOST_PORT":"$CONTAINER_PORT" \
  -v "$DATA_DIR:/app/data" \
  -e SERVER_PORT="$CONTAINER_PORT" \
  -e QWEN_API_KEY="" \
  -e QWEN_API_URL="" \
  "$IMAGE_URL" \
  python3 app.py

# 等待容器启动
echo "⏳ 等待容器启动..."
sleep 5

# 检查容器状态
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if docker ps | grep -q "$CONTAINER_NAME"; then
    echo "✅ 部署成功！容器正在运行"
    echo ""
    echo "📊 容器信息:"
    docker ps | grep "$CONTAINER_NAME"
    echo ""
    echo "📄 查看日志：docker logs -f $CONTAINER_NAME"
    echo "🛑 停止容器：docker stop $CONTAINER_NAME"
    echo "🔄 重启容器：docker restart $CONTAINER_NAME"
    echo "🗑️  删除容器：docker rm -f $CONTAINER_NAME"
    echo ""
    echo "🌐 访问地址："
    echo "   本地测试：http://localhost:$HOST_PORT"
    echo "   外网访问：http://你的阿里云公网 IP:$HOST_PORT"
    echo ""
    echo "⚠️  如果外网无法访问，请在阿里云安全组开放 $HOST_PORT 端口"
else
    echo "❌ 容器启动失败！"
    echo ""
    echo "📄 查看错误日志:"
    docker logs "$CONTAINER_NAME"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
