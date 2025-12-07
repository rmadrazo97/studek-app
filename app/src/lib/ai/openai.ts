/**
 * OpenAI Client Configuration
 *
 * Provides configured OpenAI client instance and utilities
 * for AI-powered deck and card generation.
 */

import OpenAI from 'openai';

// ============================================
// Configuration
// ============================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const DEFAULT_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10);

// ============================================
// Client Instance
// ============================================

let openaiClient: OpenAI | null = null;

/**
 * Get the OpenAI client instance (lazy initialization)
 */
export function getOpenAIClient(): OpenAI {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!OPENAI_API_KEY;
}

// ============================================
// Types
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  toolChoice?: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption;
}

export interface GenerateResult {
  content: string | null;
  toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================
// Generation Functions
// ============================================

/**
 * Generate a chat completion
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const client = getOpenAIClient();

  const {
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = 0.7,
    tools,
    toolChoice,
  } = options;

  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    ...(tools && { tools }),
    ...(toolChoice && { tool_choice: toolChoice }),
  });

  const choice = response.choices[0];

  return {
    content: choice.message.content,
    toolCalls: choice.message.tool_calls || null,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
}

/**
 * Generate with structured output using function calling
 */
export async function generateWithTools<T>(
  messages: ChatMessage[],
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  options: Omit<GenerateOptions, 'tools'> = {}
): Promise<{ result: T; usage: GenerateResult['usage'] }> {
  const response = await generateChatCompletion(messages, {
    ...options,
    tools,
    toolChoice: 'required',
  });

  if (!response.toolCalls || response.toolCalls.length === 0) {
    throw new Error('No tool calls in response');
  }

  const toolCall = response.toolCalls[0];
  const result = JSON.parse(toolCall.function.arguments) as T;

  return {
    result,
    usage: response.usage,
  };
}

// ============================================
// Exports
// ============================================

export { DEFAULT_MODEL, DEFAULT_MAX_TOKENS };
