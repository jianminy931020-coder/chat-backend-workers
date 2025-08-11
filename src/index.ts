import { createYoga } from 'graphql-yoga'
import { schema, resolvers } from './schema'

// 创建 GraphQL Yoga 实例
const yoga = createYoga({
  schema,
  resolvers, // 直接传递 resolvers
  cors: false,
  graphqlEndpoint: '/graphql',
  graphiql: true,
  // 添加上下文函数
  context: ({ request, env, executionContext }) => ({
    request,
    env,
    executionContext,
  }),
})

export default {
  async fetch(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url)

    // 统一的 CORS 头部
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, Accept, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    }

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
        // 正确传递环境变量给 GraphQL context
        const response = await yoga.handleRequest(request, {
          request,
          env,
          executionContext: ctx,
        })

        // 创建新的响应，只添加我们的 CORS 头部
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'Content-Type':
              response.headers.get('Content-Type') || 'application/json',
            ...corsHeaders,
          },
        })

        return newResponse
      } catch (error) {
        console.error('GraphQL execution error:', error)
        return new Response(
          JSON.stringify({
            errors: [
              {
                message: 'Internal server error',
                extensions: {
                  code: 'INTERNAL_SERVER_ERROR',
                  details:
                    error instanceof Error ? error.message : 'Unknown error',
                },
              },
            ],
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
