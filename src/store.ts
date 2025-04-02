import { create } from 'zustand'
import { Settings, ChatMessage } from './types'

interface SettingsStore {
  settings: Settings
  isSettingsOpen: boolean
  isChatOpen: boolean
  messages: ChatMessage[]
  setSettings: (settings: Settings) => void
  toggleSettings: () => void
  toggleChat: () => void
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
}

export const useSettingsStore = create<SettingsStore>(set => ({
  settings: {
    mcpServiceUrl: 'http://127.0.0.1:8080',
    baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    apiKey: '',
    modelName: 'Qwen/Qwen2.5-7B-Instruct'
  },
  isSettingsOpen: false,
  isChatOpen: false,
  messages: [],
  setSettings: settings => set({ settings }),
  toggleSettings: () =>
    set(state => ({ isSettingsOpen: !state.isSettingsOpen })),
  toggleChat: () => set(state => ({ isChatOpen: !state.isChatOpen })),
  addMessage: message =>
    set(state => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date()
        }
      ]
    }))
}))
