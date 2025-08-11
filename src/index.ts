// src/index.ts
import { createYoga } from 'graphql-yoga'
import { makeExecutableSchema } from '@graphql-tools/schema'

// 简化的 Resolvers
const resolvers = {
  Query: {
    hello: () => {
      console.log('Hello resolver executed')
      return 'Hello World!'
    },
  },
  Mutation: {
    sendMessage: (parent: any, args: any, context: any) => {
      console.log('=== sendMessage resolver 被调用 ===')
      console.log('Args:', JSON.stringify(args))
      console.log('Context:', JSON.stringify(context, null, 2))

      const result = {
        success: true,
        message: '测试成功',
        response: `你说了: ${args.message}`,
      }

      console.log('返回结果:', JSON.stringify(result))
      return result
    },
  },
}

const executableSchema = makeExecutableSchema({
  typeDefs: `
    type Query {
      hello: String
    }

    type Mutation {
      sendMessage(message: String!): SendMessageResponse!
    }

    type SendMessageResponse {
      success: Boolean!
      message: String!
      response: String!
    }
  `,
  resolvers,
})

// 创建 GraphQL Yoga 实例
const yoga = createYoga({
  schema: executableSchema,
  cors: false,
  context: (params) => {
    console.log('创建 context')
    return {
      env: params.env,
      request: params.request,
    }
  },
})

export default {
  async fetch(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
    console.log('Worker fetch 被调用:', request.method, request.url)

    const url = new URL(request.url)

    // CORS 头部
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, Accept, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    }

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      console.log('处理 OPTIONS 请求')
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      })
    }

    // GraphQL 端点
    if (url.pathname === '/graphql' || url.pathname === '/') {
      try {
        console.log('处理 GraphQL 请求')

        // 使用 fetch 方法而不是 handleRequest
        const response = await yoga.fetch(request, {
          env,
          request,
          ctx,
        })

        console.log('GraphQL 响应状态:', response.status)

        // 添加 CORS 头
        const headers = new Headers(response.headers)
        Object.entries(corsHeaders).forEach(([key, value]) => {
          headers.set(key, value)
        })

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      } catch (error) {
        console.error('GraphQL 处理错误:', error)
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

    // 健康检查
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // 404
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders,
    })
  },
}
