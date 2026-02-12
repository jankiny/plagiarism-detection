#!/bin/bash
###############################################################################
# 1_export_images.sh
# 在有网络的开发机上执行：构建应用镜像 + 拉取依赖镜像 → 导出为 tar 包
# 执行前确保 docker 已启动
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$SCRIPT_DIR/images"

echo "======================================"
echo "  离线部署 - 第1步：导出镜像"
echo "======================================"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

cd "$PROJECT_DIR"

# ---------- 1. 构建应用镜像 ----------
echo ""
echo "[1/4] 构建后端镜像 (plagiarism-api)..."
docker build -t plagiarism-api:latest -f backend/Dockerfile ./backend

echo "[2/4] 构建前端镜像 (plagiarism-frontend)..."
docker build -t plagiarism-frontend:latest -f frontend/Dockerfile .

# ---------- 2. 拉取依赖镜像 ----------
echo "[3/4] 拉取依赖镜像..."
docker pull ankane/pgvector:v0.5.1
docker pull redis:7-alpine
docker pull minio/minio:latest

# ---------- 3. 导出所有镜像为 tar ----------
echo "[4/4] 导出所有镜像为 tar 文件..."

echo "  → 导出 plagiarism-api..."
docker save plagiarism-api:latest -o "$OUTPUT_DIR/plagiarism-api.tar"

echo "  → 导出 plagiarism-frontend..."
docker save plagiarism-frontend:latest -o "$OUTPUT_DIR/plagiarism-frontend.tar"

echo "  → 导出 pgvector..."
docker save ankane/pgvector:v0.5.1 -o "$OUTPUT_DIR/pgvector.tar"

echo "  → 导出 redis..."
docker save redis:7-alpine -o "$OUTPUT_DIR/redis.tar"

echo "  → 导出 minio..."
docker save minio/minio:latest -o "$OUTPUT_DIR/minio.tar"

echo ""
echo "======================================"
echo "  所有镜像已导出到: $OUTPUT_DIR/"
echo "======================================"
ls -lh "$OUTPUT_DIR/"

echo ""
echo "下一步："
echo "  1. 将整个 offline-deploy/ 目录复制到 U盘 或内网文件共享"
echo "  2. 在内网 Docker 宿主机上执行 2_import_and_deploy.sh"
