import { create } from 'zustand'
import { Message, Conversation } from '@/types/chat'

interface ChatState {
  conversations: Conversation[]
  activeConvId: string | null
  messages: Message[]
  isStreaming: boolean
  sendMessage: (question: string) => Promise<void>
  newConversation: () => void
  selectConversation: (id: string) => void
  deleteConversation: (id: string) => void
  loadConversations: () => Promise<void>
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('tw_token') : null

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConvId: null,
  messages: [],
  isStreaming: false,

  sendMessage: async (question: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(), role: 'user', content: question,
      status: 'complete', timestamp: new Date(),
    }
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = {
      id: assistantId, role: 'assistant', content: '',
      status: 'pending', timestamp: new Date(),
    }

    set(s => ({ messages: [...s.messages, userMsg, assistantMsg], isStreaming: true }))

    const updateAssistant = (patch: Partial<Message>) =>
      set(s => ({
        messages: s.messages.map(m => m.id === assistantId ? { ...m, ...patch } : m)
      }))

    try {
      // Use fetch + ReadableStream — NOT EventSource (does not support POST)
      const response = await fetch(`${API}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken() || ''}`,
        },
        body: JSON.stringify({ question, session_id: get().activeConvId || 'default' }),
      })

      if (!response.ok) {
        updateAssistant({ content: 'Request failed. Please try again.', status: 'error' })
        set({ isStreaming: false })
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''      // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))
            switch (ev.event) {
              case 'session':
                if (get().activeConvId !== ev.id) {
                  set({ activeConvId: ev.id })
                  get().loadConversations()
                }
                break
              case 'intent':
                updateAssistant({ domain: ev.domain, status: 'streaming' })
                break
              case 'sql':
              case 'sql_corrected':
                updateAssistant({ sql: ev.sql })
                break
              case 'data':
                updateAssistant({ data: ev.rows, rowCount: ev.row_count })
                break
              case 'token':
                set(s => ({
                  messages: s.messages.map(m =>
                    m.id === assistantId ? { ...m, content: m.content + ev.text } : m
                  )
                }))
                break
              case 'chart':
                updateAssistant({ chartSpec: ev.spec })
                break
              case 'followups':
                updateAssistant({ followups: ev.suggestions })
                break
              case 'done':
                updateAssistant({ status: 'complete' })
                set({ isStreaming: false })
                break
              case 'error':
                updateAssistant({ content: ev.message, status: 'error' })
                set({ isStreaming: false })
                break
            }
          } catch { /* skip malformed line */ }
        }
      }
    } catch (err) {
      updateAssistant({ content: 'Network error. Please try again.', status: 'error' })
      set({ isStreaming: false })
    }
  },

  newConversation: () => set({ activeConvId: null, messages: [] }),
  selectConversation: async (id) => {
    set({ activeConvId: id, messages: [] })
    try {
      const res = await fetch(`${API}/chat/conversations/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken() || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        set({ messages: data.messages || [] })
      }
    } catch (e) {}
  },
  deleteConversation: async (id) => {
    set(s => ({
      conversations: s.conversations.filter(c => c.id !== id),
      activeConvId: s.activeConvId === id ? null : s.activeConvId,
      messages: s.activeConvId === id ? [] : s.messages,
    }))
    try {
      await fetch(`${API}/chat/conversations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken() || ''}` }
      })
    } catch (e) {}
  },
  loadConversations: async () => {
    try {
      const res = await fetch(`${API}/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${getToken() || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        set({ conversations: data.conversations || [] })
      }
    } catch (e) {}
  },
}))
