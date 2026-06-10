'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, BarChart2, Activity, Clock, ShieldCheck } from 'lucide-react'
import { useChatStore } from '@/store/chat'
import UserMessage from '@/components/chat/UserMessage'
import AssistantMessage from '@/components/chat/AssistantMessage'

export default function ChatPage() {
  const [input, setInput] = useState('')
  const { messages, isStreaming, sendMessage } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isStreaming) return
    
    const question = input.trim()
    setInput('')
    sendMessage(question)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFollowup = (q: string) => {
    if (isStreaming) return
    sendMessage(q)
  }

  const suggestions = [
    {
      title: 'Porter Performance',
      icon: <BarChart2 size={20} className="text-brand-primary" />,
      query: 'Show porter performance by facility'
    },
    {
      title: 'Assets Dashboard',
      icon: <Activity size={20} className="text-brand-primary" />,
      query: 'Display active assets by department'
    },
    {
      title: 'TAT Analysis',
      icon: <Clock size={20} className="text-brand-primary" />,
      query: 'Which porter had the minimum TAT overall?'
    },
    {
      title: 'Warranty Status',
      icon: <ShieldCheck size={20} className="text-brand-primary" />,
      query: 'Which assets have warranty expiring next month?'
    }
  ]

  return (
    <div className="flex flex-col h-full items-center">
      {messages.length === 0 ? (
        // Welcome Screen (Centered)
        <div className="flex-1 w-full max-w-3xl flex flex-col items-center justify-center text-center p-4">
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-16 h-16 bg-brand-surface rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-brand-primary/20">
              <span className="text-brand-primary text-3xl font-bold">◈</span>
            </div>
            <h1 className="text-4xl font-bold text-brand-navy mb-4">TrackerWave Analytics</h1>
            <p className="text-lg text-gray-500">What would you like to explore today?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleFollowup(s.query)}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:bg-brand-surface hover:border-brand-primary/30 transition-all shadow-sm text-left group"
              >
                <div className="p-3 bg-gray-50 group-hover:bg-white rounded-lg transition-colors">
                  {s.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{s.query}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Chat Messages
        <div className="flex-1 w-full overflow-y-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {messages.map((m) => (
              m.role === 'user' 
                ? <UserMessage key={m.id} message={m} />
                : <AssistantMessage key={m.id} message={m} onFollowup={handleFollowup} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input Area (Bottom pinned) */}
      <div className="w-full bg-gradient-to-t from-white via-white to-transparent pt-6 pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSend}
            className={`relative bg-white rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.05)] border transition-all ${isStreaming ? 'border-gray-200 opacity-80' : 'border-gray-200 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary'}`}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={isStreaming ? "Generating response..." : "Ask anything about your operations..."}
              className="w-full py-4 pl-6 pr-24 rounded-2xl bg-transparent outline-none text-gray-900 placeholder-gray-400 resize-none min-h-[56px] max-h-[200px]"
              rows={1}
              style={{ overflow: 'hidden' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '56px';
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary hover:bg-brand-light disabled:bg-gray-200 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 h-10"
            >
              Send <Send size={16} />
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-4">
            AI-powered analytics can make mistakes. Verify important data.
          </p>
        </div>
      </div>
    </div>
  )
}
