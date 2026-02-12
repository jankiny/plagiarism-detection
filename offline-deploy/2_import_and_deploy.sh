#!/bin/bash
###############################################################################
# 2_import_and_deploy.sh
# 在内网 Docker 宿主机上执行：导入镜像 → 启动服务
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE_DIR="$SCRIPT_DIR/images"

echo "======================================"
echo "  离线部署 - 第2步：导入镜像 & 启动服务"
echo "======================================"

# ---------- 1. 检查镜像文件 ----------
echo ""
echo "[检查] 验证镜像文件..."
REQUIRED_IMAGES=(
  "plagiarism-api.tar"
  "plagiarism-frontend.tar"
  "pgvector.tar"
  "redis.tar"
  "minio.tar"
)

for img in "${REQUIRED_IMAGES[@]}"; do
  if [ ! -f "$IMAGE_DIR/$img" ]; then
    echo "  ✗ 缺少镜像文件: $IMAGE_DIR/$img"
    echo "  请先在有网络的机器上执行 1_export_images.sh"
    exit 1
  fi
  echo "  ✓ $img"
done

# ---------- 2. 导入镜像 ----------
echo ""
echo "[导入] 正在加载 Docker 镜像 (可能需要几分钟)..."

echo "  → 加载 pgvector..."
docker load -i "$IMAGE_DIR/pgvector.tar"

echo "  → 加载 redis..."
docker load -i "$IMAGE_DIR/redis.tar"

echo "  → 加载 minio..."
docker load -i "$IMAGE_DIR/minio.tar"

echo "  → 加载 plagiarism-api..."
docker load -i "$IMAGE_DIR/plagiarism-api.tar"

echo "  → 加载 plagiarism-frontend..."
docker load -i "$IMAGE_DIR/plagiarism-frontend.tar"

echo ""
echo "[验证] 已加载的镜像:"
docker images | grep -E "plagiarism|pgvector|redis|minio"

# ---------- 3. 检查 .env.docker ----------
ENV_FILE="$SCRIPT_DIR/.env.docker"
if [ ! -f "$ENV_FILE" ]; then
  echo ""
  echo "[警告] 未找到 .env.docker 文件，正在创建默认配置..."
  cat > "$ENV_FILE" << 'ENVEOF'
# ===== 数据库 =====
DATABASE_URL=postgresql+asyncpg://user:password@db:5432/plagiarism_db
SYNC_DATABASE_URL=postgresql+psycopg2://user:password@db:5432/plagiarism_db

# ===== Redis =====
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# ===== MinIO / S3 =====
S3_ENDPOINT_URL=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=plagiarism

# ===== 应用 =====
SECRET_KEY=change-me-to-a-random-string-in-production
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=admin123

# ===== Embedding / AI 检测 (按需配置) =====
# OPENAI_API_KEY=your-key
# OPENAI_BASE_URL=http://your-local-llm:8080/v1
# EMBEDDING_MODEL=text-embedding-ada-002
ENVEOF
  echo "  已创建默认 .env.docker，请根据实际环境修改后重新运行"
  echo "  文件位置: $ENV_FILE"
fi

# ---------- 4. 创建数据目录 ----------
echo ""
echo "[准备] 创建数据持久化目录..."
DATA_BASE="/home/tzdl/data/plagiarism"
mkdir -p "$DATA_BASE/pgdata"
mkdir -p "$DATA_BASE/redis"
mkdir -p "$DATA_BASE/minio"
echo "  ✓ 数据目录: $DATA_BASE/{pgdata,redis,minio}"

# ---------- 5. 启动服务 ----------
echo ""
echo "[启动] 使用 docker compose 启动所有服务..."
cd "$SCRIPT_DIR"
docker compose -f docker-compose.offline.yml up -d

echo ""
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
echo "  前端访问地址:    http://<宿主机IP>"
echo "  后端API地址:     http://<宿主机IP>:8000"
echo "  MinIO控制台:     http://<宿主机IP>:9001"
echo "    MinIO 用户名:  minioadmin"
echo "    MinIO 密码:    minioadmin"
echo ""
echo "  查看服务状态: docker compose -f docker-compose.offline.yml ps"
echo "  查看日志:     docker compose -f docker-compose.offline.yml logs -f"
echo "  停止服务:     docker compose -f docker-compose.offline.yml down"
