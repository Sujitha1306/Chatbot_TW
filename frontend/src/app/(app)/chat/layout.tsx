'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, MessageSquare, Search, Settings, LogOut, Menu, X, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useChatStore } from '@/store/chat'
import * as Avatar from '@radix-ui/react-avatar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const { conversations, loadConversations, selectConversation, deleteConversation, newConversation, activeConvId } = useChatStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-brand-navy text-white flex flex-col
        transition-transform duration-300 ease-in-out md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-2 font-bold text-lg text-white">
            <span className="text-brand-primary">◈</span> Analytics
          </Link>
          <button className="md:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={() => { newConversation(); setSidebarOpen(false); }}
            className="w-full bg-brand-primary hover:bg-brand-light transition-colors text-white rounded-lg p-3 flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={18} /> New Chat
          </button>
        </div>

        <div className="px-4 pb-2 mt-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-white/10 border border-white/20 rounded-md py-2 pl-9 pr-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Conversations</h3>
            <div className="space-y-1">
              {conversations.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No recent conversations</p>
              ) : (
                conversations.map(c => (
                  <div key={c.id} className={`group w-full flex items-center justify-between p-2 rounded transition-colors text-sm truncate ${activeConvId === c.id ? 'bg-brand-primary/20 text-white' : 'hover:bg-white/10 text-gray-200'}`}>
                    <button 
                      onClick={() => { selectConversation(c.id); setSidebarOpen(false); }}
                      className="flex-1 text-left truncate flex items-center gap-2 outline-none"
                    >
                      <MessageSquare size={14} className="flex-shrink-0" />
                      {c.title}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity outline-none"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="w-full flex items-center gap-3 hover:bg-white/10 p-2 rounded-lg transition-colors outline-none">
                <Avatar.Root className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-sm font-bold">
                  <Avatar.Fallback>{user?.name?.charAt(0) || 'U'}</Avatar.Fallback>
                </Avatar.Root>
                <div className="flex-1 text-left truncate">
                  <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                </div>
                <Settings size={16} className="text-gray-400" />
              </button>
            </DropdownMenu.Trigger>
            
            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                className="min-w-[200px] bg-white rounded-md shadow-lg border border-gray-200 p-1 z-50 mb-2"
                sideOffset={5}
                align="center"
              >
                <DropdownMenu.Item className="flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none">
                  <Settings size={16} /> Settings
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                <DropdownMenu.Item 
                  className="flex items-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer outline-none"
                  onClick={logout}
                >
                  <LogOut size={16} /> Log out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2 font-bold text-lg text-brand-navy">
            <span className="text-brand-primary">◈</span> Analytics
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  )
}
