import { buildSchema } from 'graphql';
import OpenAI from 'openai';

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
`);

// 定义 Context 类型
interface Context {
  env: {
    OPENAI_API_KEY: string;
  };
}

// OpenAI 客户端实例
let openaiClient: OpenAI | null = null;

const getOpenAIClient = (apiKey: string): OpenAI => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiClient;
};

// GraphQL 解析器
export const resolvers = {
  Query: {
    hello: () => 'Hello from Cloudflare Workers GraphQL!',
    chatHistory: async (_: any, __: any, context: Context) => {
      // 在实际应用中，这里应该从数据库获取聊天历史
      // 现在返回空数组作为示例
      return [];
    },
  },

  Mutation: {
    sendMessage: async (_: any, { message }: { message: string }, context: Context) => {
      try {
        // 验证输入
        if (!message || message.trim().length === 0) {
          return {
            success: false,
            message: '消息不能为空',
            response: '',
          };
        }

        // 获取 OpenAI API Key
        const apiKey = context.env.OPENAI_API_KEY;
        if (!apiKey) {
          console.error('OPENAI_API_KEY not found in environment variables');
          return {
            success: false,
            message: 'OpenAI API Key 未配置',
            response: '',
          };
        }

        // 创建 OpenAI 客户端
        const openai = getOpenAIClient(apiKey);

        // 调用 OpenAI API
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

        return {
          success: true,
          message: '消息发送成功',
          response: response,
        };

      } catch (error) {
        console.error('Error calling OpenAI API:', error);
        
        let errorMessage = '处理消息时发生错误';
        
        if (error instanceof Error) {
          if (error.message.includes('API key')) {
            errorMessage = 'OpenAI API Key 无效或未设置';
          } else if (error.message.includes('quota')) {
            errorMessage = 'OpenAI API 配额不足';
          } else if (error.message.includes('rate limit')) {
            errorMessage = 'API 调用频率超限，请稍后再试';
          }
        }

        return {
          success: false,
          message: errorMessage,
          response: '',
        };
      }
    },
  },
};