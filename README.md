# cs_vue3_backend

基于 NestJS + TypeORM 的后端项目，默认连接 PostgreSQL（推荐使用 `pgvector/pgvector:pg16` 以支持向量检索）。

## 本地开发

### 1) 启动数据库（pgvector）

按你的习惯直接运行（PowerShell）：

```powershell
docker run -d `
  --name postgres-vector `
  -p 5432:5432 `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=appdb `
  -v pgdata:/var/lib/postgresql/data `
  --restart unless-stopped `
  pgvector/pgvector:pg16 `
  -c shared_preload_libraries=vector
```

> 如果改用 `docker-compose up -d`，请确保 `docker-compose.yml` 使用的是 `pgvector/pgvector:*`，否则项目启动时创建 `vector` 扩展会失败。

### 2) 配置环境变量

复制一份示例配置：

```bash
cp .env.example .env
```

按需修改 `.env`（仓库已通过 `.gitignore` 忽略 `.env`）。

### 3) 安装依赖并启动

```bash
npm install
npm run start:dev
```

服务默认监听：`http://localhost:3000`（可通过 `.env` 的 `PORT` 修改）。

## API 文档

- Swagger UI：`http://localhost:3000/api-docs-ui`
- Swagger JSON：`http://localhost:3000/api-docs`

## 功能概览

### Auth

- `POST /api/auth/register`：注册用户（默认角色 `user`）
- `POST /api/auth/login`：登录获取 `access_token`（JWT）

开发期会在启动时自动确保存在一个管理员账号（可在 `.env` 里用 `ADMIN_*` 覆盖）：

- 用户名：`admin`
- 邮箱：`admin@example.com`
- 密码：`admin123`

### Posts

- `GET /api/posts`：文章列表（分页/排序/筛选）
  - `q`：ILIKE 关键词搜索
  - `vectorQ`：语义搜索（pgvector，相似度排序；需要配置 `OPENAI_API_KEY`）
- `GET /api/posts/:id`：文章详情
- `POST /api/posts`：创建（需要 JWT Bearer）
- `PATCH /api/posts/:id`：更新（需要 JWT Bearer）
- `DELETE /api/posts/:id`：删除（需要 JWT Bearer）

## 备注

- 项目启动时会自动创建数据库（若不存在）并执行 `CREATE EXTENSION IF NOT EXISTS vector`。
- `TypeORM synchronize: true` 仅建议用于开发环境。

