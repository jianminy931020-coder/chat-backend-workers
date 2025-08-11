import { createYoga } from 'graphql-yoga'
import { schema, resolvers } from './schema'

// CORS 配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
}

// 创建 GraphQL Yoga 实例
const yoga = createYoga({
  schema,
  rootValue: resolvers,
  cors: {
    origin: '*',
    credentials: true,
  },
  // 自定义 GraphQL 端点路径
  graphqlEndpoint: '/graphql',
  // 启用 GraphiQL 调试界面（生产环境可以关闭）
  graphiql: true,
})

export default {
  async fetch(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url)

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      })
    }

    // 健康检查端点
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // GraphQL 端点
    if (url.pathname === '/graphql' || url.pathname === '/') {
      try {
        // 将环境变量传递给 GraphQL 上下文
        const response = await yoga.fetch(request, {
          env,
          ctx,
        })

        // 添加 CORS 头部
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers),
            ...corsHeaders,
          },
        })

        return newResponse
      } catch (error) {
        console.error('GraphQL execution error:', error)
        return new Response(
          JSON.stringify({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }
    }

    // 404 处理
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: `Path ${url.pathname} not found`,
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  },
}
