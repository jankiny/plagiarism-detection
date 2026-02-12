# 内网离线部署指南

## 架构概览

```
offline-deploy/
├── 1_export_images.sh          # 开发机执行：构建 & 导出镜像
├── 2_import_and_deploy.sh      # 内网机执行：导入镜像 & 启动服务
├── docker-compose.offline.yml  # 离线专用 compose（不执行 build）
├── .env.docker.example         # 环境变量模板
└── images/                     # 导出的镜像 tar 包（由脚本自动生成）
```

## 部署流程

整个流程分为两步，分别在 **开发机（有网络）** 和 **内网宿主机（无网络）** 上执行。

---

### 第一步：在开发机上导出镜像

> **前提**：开发机已安装 Docker，并能正常联网。

```bash
cd plagiarism-detection/offline-deploy
chmod +x 1_export_images.sh
./1_export_images.sh
```

脚本会自动：
1. 构建 `plagiarism-api:latest` 和 `plagiarism-frontend:latest` 镜像
2. 拉取 `pgvector`、`redis`、`minio` 等依赖镜像
3. 将所有镜像导出为 `images/*.tar` 文件

完成后 `images/` 目录大约 2-3 GB。

---

### 第二步：传输到内网

将整个 `offline-deploy/` 目录通过以下方式传输到内网 Docker 宿主机：

- **U盘 / 移动硬盘**
- **内网文件共享 (SMB/NFS)**
- **scp / rsync**（如有跳板机）

```bash
# 示例：使用 scp 传输
scp -r offline-deploy/ user@内网宿主机IP:/opt/plagiarism/
```

---

### 第三步：在内网宿主机上部署

> **前提**：内网宿主机已安装 Docker 和 Docker Compose。

#### 3.1 配置环境变量

```bash
cd /opt/plagiarism/offline-deploy   # 你放置文件的路径
cp .env.docker.example .env.docker
vim .env.docker                     # 根据实际需要修改
```

**关键配置项**：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `POSTGRES_USER/PASSWORD` | 数据库用户名密码 | user / password |
| `SECRET_KEY` | JWT 密钥，**生产环境必须修改** | change-me-... |
| `FIRST_SUPERUSER_EMAIL` | 管理员邮箱 | admin@example.com |
| `FIRST_SUPERUSER_PASSWORD` | 管理员密码 | admin123 |
| `MINIO_ROOT_USER/PASSWORD` | MinIO 管理账号 | minioadmin |
| `OPENAI_BASE_URL` | 内网 LLM 地址（AI 功能需要） | 未设置 |

#### 3.2 导入镜像并启动

```bash
chmod +x 2_import_and_deploy.sh
./2_import_and_deploy.sh
```

脚本会自动：
1. 验证所有镜像 tar 文件完整
2. `docker load` 导入所有镜像
3. 使用 `docker-compose.offline.yml` 启动全部服务

#### 3.3 验证部署

```bash
# 查看容器状态
docker compose -f docker-compose.offline.yml ps

# 查看日志
docker compose -f docker-compose.offline.yml logs -f api
```

服务启动后访问：

| 服务 | 地址 |
|------|------|
| 前端界面 | `http://<宿主机IP>` |
| 后端 API | `http://<宿主机IP>:8000` |
| API 文档 | `http://<宿主机IP>:8000/docs` |
| MinIO 控制台 | `http://<宿主机IP>:9001` |

---

## 常用运维命令

```bash
# 进入 offline-deploy 目录
cd /opt/plagiarism/offline-deploy

# 停止所有服务
docker compose -f docker-compose.offline.yml down

# 重启某个服务
docker compose -f docker-compose.offline.yml restart api

# 查看实时日志
docker compose -f docker-compose.offline.yml logs -f

# 完全清除（包括数据卷，慎用！）
docker compose -f docker-compose.offline.yml down -v
```

## 版本更新

当应用有新版本时：

1. 在开发机重新执行 `1_export_images.sh`
2. 将新的 `images/*.tar` 文件传输到内网
3. 在内网宿主机执行：

```bash
# 停止旧服务
docker compose -f docker-compose.offline.yml down

# 重新导入镜像
docker load -i images/plagiarism-api.tar
docker load -i images/plagiarism-frontend.tar

# 启动新版本（数据会保留）
docker compose -f docker-compose.offline.yml up -d
```

## 数据持久化

默认使用 Docker named volumes 存储数据。如需挂载宿主机目录（推荐生产环境），编辑 `docker-compose.offline.yml`：

```yaml
db:
  volumes:
    - /mnt/data/plagiarism/pgdata:/var/lib/postgresql/data

minio:
  volumes:
    - /mnt/data/plagiarism/minio:/data
```

## 常见问题

### Q: Docker 宿主机没有安装 Docker 怎么办？

在有网络的机器上下载 Docker 离线安装包：

```bash
# CentOS/RHEL
yumdownloader --resolve docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Ubuntu/Debian
apt download docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

将 `.rpm` 或 `.deb` 包传输到内网后安装：

```bash
# CentOS/RHEL
rpm -ivh *.rpm

# Ubuntu/Debian
dpkg -i *.deb
```

### Q: AI 检测/Embedding 功能如何在内网使用？

需要在内网部署兼容 OpenAI API 的本地大模型服务（如 Ollama、vLLM、LocalAI），然后在 `.env.docker` 中配置：

```env
OPENAI_BASE_URL=http://<内网LLM地址>:<端口>/v1
OPENAI_API_KEY=any-value
EMBEDDING_MODEL=your-model-name
```

### Q: 如何修改前端访问端口？

编辑 `docker-compose.offline.yml` 中 frontend 的端口映射：

```yaml
frontend:
  ports:
    - "8080:80"   # 将 80 改为 8080 或其他端口
```
