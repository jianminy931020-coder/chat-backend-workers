import { buildSchema } from 'graphql'
import OpenAI from 'openai'

// GraphQL Schema 定义
export const schema = buildSchema(`
  type Query {
    hello: String
    chatHistory: [ChatMessage]
  }

  type Mutation {
    sendMessage(message: String!): SendMessageResponse!
  }

  type ChatMessage {
    id: String!
    message: String!
    response: String!
    timestamp: String!
  }

  type SendMessageResponse {
    success: Boolean!
    message: String!
    response: String!
  }
`)

// 定义 Context 类型
interface Context {
  env: {
    OPENAI_API_KEY: string
  }
  request: Request
  executionContext: ExecutionContext
}

// OpenAI 客户端实例
let openaiClient: OpenAI | null = null

const getOpenAIClient = (apiKey: string): OpenAI => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
    })
  }
  return openaiClient
}

// GraphQL 解析器
export const resolvers = {
  Query: {
    hello: () => {
      console.log('Hello query called')
      return 'Hello from Cloudflare Workers GraphQL!'
    },
    chatHistory: async (_: any, __: any, context: Context) => {
      console.log('ChatHistory query called')
      return []
    },
  },

  Mutation: {
    sendMessage: async (
      _: any,
      args: { message: string },
      context: Context
    ) => {
      console.log('=== sendMessage resolver 开始执行 ===')
      console.log('参数:', JSON.stringify(args))
      console.log('Context keys:', Object.keys(context || {}))

      // 确保总是返回一个有效的响应对象
      try {
        const { message } = args

        // 验证输入
        if (!message || message.trim().length === 0) {
          console.log('消息为空')
          return {
            success: false,
            message: '消息不能为空',
            response: '',
          }
        }

        // 检查 context
        if (!context) {
          console.error('Context is null or undefined')
          return {
            success: false,
            message: 'Context 未正确传递',
            response: '',
          }
        }

        // 检查 env
        if (!context.env) {
          console.error('context.env is null or undefined')
          return {
            success: false,
            message: '环境变量未正确传递',
            response: '',
          }
        }

        // 获取 API Key
        const apiKey = context.env.OPENAI_API_KEY
        console.log('API Key 检查:', {
          exists: !!apiKey,
          length: apiKey ? apiKey.length : 0,
          prefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A',
        })

        if (!apiKey) {
          console.error('OPENAI_API_KEY not found')
          return {
            success: false,
            message: 'OpenAI API Key 未配置，请检查环境变量设置',
            response: '',
          }
        }

        // 先返回测试响应，确保基本流程正常
        console.log('返回测试响应')
        return {
          success: true,
          message: '消息处理成功（测试模式）',
          response: `收到您的消息: "${message}". 这是一个测试响应。`,
        }

        // TODO: 等基本流程正常后，再启用 OpenAI 调用
        /*
        console.log('创建 OpenAI 客户端');
        const openai = getOpenAIClient(apiKey);

        console.log('调用 OpenAI API');
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个有用的AI助手。请用中文回答用户的问题。',
            },
            {
              role: 'user',
              content: message,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        const response = completion.choices[0]?.message?.content || '抱歉，我无法生成回复。';
        console.log('OpenAI 响应成功');

        return {
          success: true,
          message: '消息发送成功',
          response: response,
        };
        */
      } catch (error) {
        console.error('=== Resolver 捕获到错误 ===')
        console.error('错误详情:', error)
        console.error('错误类型:', error?.constructor?.name)
        console.error(
          '错误消息:',
          error instanceof Error ? error.message : String(error)
        )
        console.error(
          '错误堆栈:',
          error instanceof Error ? error.stack : 'No stack'
        )

        // 确保即使发生错误也返回有效的响应对象
        return {
          success: false,
          message: `发生错误: ${
            error instanceof Error ? error.message : '未知错误'
          }`,
          response: '',
        }
      }
    },
  },
}
