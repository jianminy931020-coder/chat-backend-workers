# Cloudflare Workers 聊天后端

这是一个基于 Cloudflare Workers 的聊天应用后端，使用 GraphQL 和 OpenAI API。

## 功能特性

- Cloudflare Workers 无服务器架构
- GraphQL API with GraphQL Yoga
- OpenAI GPT-3.5 Turbo 集成
- CORS 支持
- TypeScript 类型安全
- 错误处理和日志记录

## 快速开始

1. 克隆仓库
```bash
git clone https://github.com/jianminy931020-coder/chat-backend-workers.git
cd chat-backend-workers
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
npx wrangler secret put OPENAI_API_KEY
# 输入你的 OpenAI API Key
```

4. 本地开发
```bash
npm run dev
```

5. 部署到 Cloudflare Workers
```bash
npm run deploy
```

## API 端点

- `GET/POST /graphql` - GraphQL API 端点
- `GET /health` - 健康检查端点

## 环境变量

- `OPENAI_API_KEY` - OpenAI API 密钥

## GraphQL Schema

### Mutations
```graphql
sendMessage(message: String!): SendMessageResponse!
```

### Queries
```graphql
hello: String
chatHistory: [ChatMessage]
```
