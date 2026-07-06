import { post } from './client'

export const askChatbot = (message, history = []) =>
  post('/chatbot/ask', { message, history })
