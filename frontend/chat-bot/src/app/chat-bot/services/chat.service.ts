import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ChatMessage, Conversation } from '../models/chat.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { FacilityService } from './facility.service';

function safeRandomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ActiveStream {
  messages: ChatMessage[];
  abortController: AbortController;
  isStreaming: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  private streamingSubject = new BehaviorSubject<boolean>(false);
  isStreaming$ = this.streamingSubject.asObservable();

  private isFetchingChatSubject = new BehaviorSubject<boolean>(false);
  isFetchingChat$ = this.isFetchingChatSubject.asObservable();

  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  conversations$ = this.conversationsSubject.asObservable();
  
  get currentConversations(): Conversation[] {
    return this.conversationsSubject.value;
  }

  private recommendationsSubject = new BehaviorSubject<string[]>([]);
  recommendations$ = this.recommendationsSubject.asObservable();

  private fillInputSubject = new BehaviorSubject<string>('');
  fillInput$ = this.fillInputSubject.asObservable();

  // Fires after a previous conversation's full history has finished loading,
  // so the view can jump straight to the latest message instead of the start.
  private conversationLoadedSubject = new Subject<void>();
  conversationLoaded$ = this.conversationLoadedSubject.asObservable();

  private initialLoadingSubject = new BehaviorSubject<boolean>(true);
  initialLoading$ = this.initialLoadingSubject.asObservable();

  activeConvId: string | null = null;
  private activeStreams = new Map<string, ActiveStream>();

  private updateStreamingState(): void {
    if (this.activeConvId && this.activeStreams.has(this.activeConvId)) {
      this.streamingSubject.next(this.activeStreams.get(this.activeConvId)!.isStreaming);
    } else {
      this.streamingSubject.next(false);
    }
  }

  // Removed shared tokenBuffer state

  constructor(private auth: AuthService, private zone: NgZone, private facilitySvc: FacilityService) {
    let lastUserId: string | null = null;
    this.auth.user$.subscribe(user => {
      const currentId = user?.id || null;
      if (lastUserId !== null && currentId !== lastUserId) {
        this.newConversation();
        this.conversationsSubject.next([]);
        this.recommendationsSubject.next([]);
        this.initialLoadingSubject.next(true);
      }
      lastUserId = currentId;
    });
  }

  getCurrentMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  hasMoreMessages = true;
  messageOffset = 0;

  newConversation(): void {
    this.activeConvId = null;
    this.hasMoreMessages = true;
    this.messageOffset = 0;
    this.messagesSubject.next([]);
  }

  startConversation(question: string): string {
    const newId = safeRandomUUID();
    this.newConversation();
    this.activeConvId = newId;
    this.sendMessage(question);
    return newId;
  }

  selectConversation(id: string): void {
    if (this.activeConvId !== id) {
      this.messagesSubject.next([]); // Clear messages immediately for instant visual feedback
    }
    this.activeConvId = id;
    
    if (this.activeStreams.has(id)) {
      const state = this.activeStreams.get(id)!;
      this.messagesSubject.next(state.messages);
      this.messageOffset = state.messages.length;
      this.hasMoreMessages = true;
      this.updateStreamingState();
      this.conversationLoadedSubject.next();
      return;
    }

    this.messagesSubject.next([]); // Clear before loading new
    this.messageOffset = 0;
    this.hasMoreMessages = true;
    this.isFetchingChatSubject.next(true);
    this.updateStreamingState();
    this.loadConversationMessages(id, 50, 0); // Initially load last 50 messages
  }

  private currentLoadRequestId = 0;
  private currentConvListRequestId = 0;

  private buildApiUrl(path: string): string {
    const user = this.auth.getUser();
    let url = `${environment.base_value.chatbotApiUrl}${path}`;
    if (user && user.id) {
      const separator = path.includes('?') ? '&' : '?';
      url += `${separator}userId=${encodeURIComponent(user.id)}`;
    }
    return url;
  }

  private getHeaders(): Record<string, string> {
    const token = this.auth.getToken();
    const user = this.auth.getUser();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (user && user.id) headers['X-User-Id'] = user.id;
    return headers;
  }

  hasMoreConversations = true;

  async loadConversations(limit: number = 10, offset: number = 0, append: boolean = false): Promise<void> {
    const requestId = ++this.currentConvListRequestId;
    try {
      const res = await fetch(this.buildApiUrl(`chat/conversations?limit=${limit}&offset=${offset}`), {
        headers: this.getHeaders(),
      });
      if (requestId !== this.currentConvListRequestId) return;
      if (!res.ok) return;
      const data = await res.json();
      if (requestId !== this.currentConvListRequestId) return;
      
      const newConvs = data.conversations || [];
      this.hasMoreConversations = newConvs.length === limit;

      if (append) {
        const existing = this.conversationsSubject.value;
        // avoid duplicates if they were pushed manually before reload
        const existingIds = new Set(existing.map(c => c.id));
        const filteredNew = newConvs.filter((c: any) => !existingIds.has(c.id));
        this.conversationsSubject.next([...existing, ...filteredNew]);
      } else {
        this.conversationsSubject.next(newConvs);
      }
      
      // Also load recommendations whenever conversations load initially
      if (!append) {
        this.loadRecommendations();
        this.initialLoadingSubject.next(false);
      }
    } catch (e) {
      if (requestId === this.currentConvListRequestId) {
        console.error('Failed to load conversations', e);
        if (!append) this.initialLoadingSubject.next(false);
      }
    }
  }

  private async loadRecommendations(): Promise<void> {
    try {
      const res = await fetch(this.buildApiUrl('chat/recommendations'), {
        headers: this.getHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      this.recommendationsSubject.next(data.recommendations || []);
    } catch (e) {
      console.error('Failed to load recommendations', e);
    }
  }

  async loadConversationMessages(convId: string, limit?: number, offset: number = 0, prepend: boolean = false): Promise<number> {
    const requestId = ++this.currentLoadRequestId;
    try {
      const path = limit ? `chat/conversations/${convId}?limit=${limit}&offset=${offset}` : `chat/conversations/${convId}`;
      const res = await fetch(this.buildApiUrl(path), {
        headers: this.getHeaders(),
      });
      if (requestId !== this.currentLoadRequestId) return 0;
      if (!res.ok) {
        if (!prepend) this.isFetchingChatSubject.next(false);
        return 0;
      }
      const data = await res.json();
      if (requestId !== this.currentLoadRequestId) return 0;
      
      const loadedMessages = (data.messages || []).map((m: any) => ({
        ...m,
        status: 'complete',
        rowCount: m.row_count || m.rowCount
      }));
      
      if (prepend) {
        const current = this.messagesSubject.value;
        this.messagesSubject.next([...loadedMessages, ...current]);
      } else {
        this.messagesSubject.next(loadedMessages);
      }
      
      this.activeConvId = convId;
      if (!prepend) {
        this.conversationLoadedSubject.next();
      }
      
      if (limit) {
        this.messageOffset += loadedMessages.length;
        this.hasMoreMessages = loadedMessages.length === limit;
      }
      
      if (!prepend) {
        this.isFetchingChatSubject.next(false);
      }
      
      return loadedMessages.length;
    } catch (e) {
      if (requestId === this.currentLoadRequestId) {
        console.error('Failed to load messages', e);
        if (!prepend) this.isFetchingChatSubject.next(false);
      }
      return 0;
    }
  }

  async deleteConversation(convId: string): Promise<void> {
    const current = this.conversationsSubject.value;
    const remaining = current.filter(c => c.id !== convId);
    this.conversationsSubject.next(remaining);
    
    if (this.activeConvId === convId) {
      this.newConversation();
    }

    try {
      await fetch(this.buildApiUrl(`chat/conversations/${convId}`), {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      this.loadRecommendations();
      
      // If there are more on the server, automatically fetch 1 to replace the deleted one
      if (this.hasMoreConversations) {
        this.loadConversations(1, remaining.length, true);
      }
    } catch (e) {
      console.error('Failed to delete conversation', e);
      // Rollback on failure
      this.conversationsSubject.next(current);
    }
  }

  async renameConversation(convId: string, newTitle: string): Promise<void> {
    const current = this.conversationsSubject.value;
    const updated = current.map(c => 
      c.id === convId ? { ...c, title: newTitle } : c
    );
    this.conversationsSubject.next(updated);

    try {
      const headers = this.getHeaders();
      headers['Content-Type'] = 'application/json';
      
      await fetch(this.buildApiUrl(`chat/conversations/${convId}`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ title: newTitle })
      });
    } catch (e) {
      console.error('Failed to rename conversation', e);
      this.conversationsSubject.next(current); // Rollback
    }
  }

  async toggleFavorite(convId: string, isFavorite: boolean): Promise<void> {
    const current = this.conversationsSubject.value;
    const updated = current.map(c => 
      c.id === convId ? { ...c, is_favorite: isFavorite } : c
    );
    this.conversationsSubject.next(updated);

    try {
      const headers = this.getHeaders();
      headers['Content-Type'] = 'application/json';
      
      const res = await fetch(this.buildApiUrl(`chat/conversations/${convId}/favorite`), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_favorite: isFavorite })
      });
      
      if (!res.ok) {
        throw new Error('Failed to toggle favorite on backend');
      }
    } catch (e) {
      console.error('Failed to toggle favorite', e);
      this.conversationsSubject.next(current); // Rollback
    }
  }

  fillInput(text: string): void {
    this.fillInputSubject.next(text);
  }

  async editMessage(messageId: string, newText: string): Promise<void> {
    if (!this.activeConvId) return;
    
    // Stop any ongoing generation for this conversation
    this.stopStream();
    
    // Truncate on backend
    try {
      await fetch(this.buildApiUrl(`chat/conversations/${this.activeConvId}/messages/${messageId}`), {
        method: 'DELETE',
        headers: this.getHeaders()
      });
    } catch (e) {
      console.error('Failed to truncate conversation history', e);
      // Even if backend fails, let's try to proceed locally for the user
    }

    // Truncate locally
    const current = this.messagesSubject.value;
    const msgIndex = current.findIndex(m => m.id === messageId);
    if (msgIndex !== -1) {
      const removedCount = current.length - msgIndex;
      this.messagesSubject.next(current.slice(0, msgIndex));
      this.messageOffset = Math.max(0, this.messageOffset - removedCount);
    }

    // Send the new text as if it was a new question
    return this.sendMessage(newText);
  }

  stopStream(): void {
    if (this.activeConvId && this.activeStreams.has(this.activeConvId)) {
      const state = this.activeStreams.get(this.activeConvId)!;
      state.abortController.abort();
      state.isStreaming = false;
      this.updateStreamingState();
    }
  }

  async sendMessage(question: string): Promise<void> {
    let targetConvId = this.activeConvId;
    if (!targetConvId) return;

    if (this.activeStreams.has(targetConvId)) {
      this.activeStreams.get(targetConvId)!.abortController.abort();
    }

    const current = this.messagesSubject.value;

    const userMsg: ChatMessage = {
      id: safeRandomUUID(), role: 'user', content: question,
      status: 'complete', timestamp: new Date(),
    };
    const assistantId = safeRandomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId, role: 'assistant', content: '',
      status: 'pending', timestamp: new Date(),
      chartSpec: undefined,
      data: undefined,
    };

    const newMessages = [...current, userMsg, assistantMsg];
    
    const abortController = new AbortController();
    this.activeStreams.set(targetConvId, {
      messages: newMessages,
      abortController,
      isStreaming: true
    });

    if (this.activeConvId === targetConvId) {
      this.messagesSubject.next(newMessages);
      this.messageOffset += 2; // Sync offset with DB insertions
      this.updateStreamingState();
    }

    // Optimistically add to sidebar if it doesn't exist
    const currentConvs = this.conversationsSubject.value;
    if (!currentConvs.find(c => c.id === targetConvId)) {
      this.conversationsSubject.next([
        { id: targetConvId, title: question, created_at: new Date() },
        ...currentConvs
      ]);
    }

    const updateTarget = (patch: Partial<ChatMessage>) => {
      this.zone.run(() => {
        const state = this.activeStreams.get(targetConvId);
        if (state) {
          state.messages = state.messages.map(m =>
            m.id === assistantId ? { ...m, ...patch } : m
          );
          if (this.activeConvId === targetConvId) {
            this.messagesSubject.next(state.messages);
          }
        }
      });
    };

    try {
      const user = this.auth.getUser();
      const headers = this.getHeaders();
      headers['Content-Type'] = 'application/json';
      
      const response = await fetch(this.buildApiUrl('chat/stream'), {
        method: 'POST',
        headers,
        signal: abortController.signal,
        body: JSON.stringify({
          question,
          user_id: user?.id || 'TW', 
          session_id: targetConvId,
          filters: this.facilitySvc.getActiveFilters(),
        }),
      });

      if (!response.ok) {
        let errBody = 'Unknown error';
        try { errBody = await response.text(); } catch(e) {}
        updateTarget({ content: `Error: ${response.status} - ${errBody.slice(0,200)}`, status: 'error' });
        this.zone.run(() => {
          const state = this.activeStreams.get(targetConvId);
          if (state) state.isStreaming = false;
          this.updateStreamingState();
        });
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        let errBody = 'Invalid content type';
        try { errBody = await response.text(); } catch(e) {}
        console.error('Stream endpoint returned non-SSE response:', response.status, errBody);
        updateTarget({ content: `Error: Non-SSE response - ${errBody.slice(0,200)}`, status: 'error' });
        this.zone.run(() => {
          const state = this.activeStreams.get(targetConvId);
          if (state) state.isStreaming = false;
          this.updateStreamingState();
        });
        return;
      }
      
      if (!response.body) {
        updateTarget({ content: 'Response body is empty', status: 'error' });
        this.zone.run(() => {
          const state = this.activeStreams.get(targetConvId);
          if (state) state.isStreaming = false;
          this.updateStreamingState();
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      let localTokenBuffer = '';
      let localTokenFlushTimer: ReturnType<typeof setTimeout> | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let ev: any;
          try { ev = JSON.parse(line.slice(6)); } catch { continue; }

          switch (ev.event) {
            case 'session':
              if (ev.id !== targetConvId) {
                // If backend changed the session ID, update our maps
                const state = this.activeStreams.get(targetConvId);
                if (state) {
                  this.activeStreams.set(ev.id, state);
                  this.activeStreams.delete(targetConvId);
                }
                if (this.activeConvId === targetConvId) {
                  this.activeConvId = ev.id;
                }
                targetConvId = ev.id;
              }
              this.loadConversations();
              break;
            case 'intent':
              updateTarget({ domain: ev.domain, status: 'streaming' });
              break;
            case 'conversational':
              updateTarget({ domain: undefined, status: 'streaming' });
              break;
            case 'metrics':
              updateTarget({ tokensUsed: ev.tokens });
              break;
            case 'sql':
            case 'sql_corrected':
              updateTarget({ sql: ev.sql });
              break;
            case 'data':
              updateTarget({ data: ev.rows, rowCount: ev.row_count });
              break;
            case 'multi_data':
              updateTarget({ displaySections: ev.sections, rowCount: ev.row_count });
              break;
            case 'cross_conversation_results':
              updateTarget({ crossConversationRefs: ev.matches });
              break;
            case 'token':
              localTokenBuffer += ev.text;
              if (localTokenFlushTimer) clearTimeout(localTokenFlushTimer);
              localTokenFlushTimer = setTimeout(() => {
                const batch = localTokenBuffer;
                localTokenBuffer = '';
                this.zone.run(() => {
                  const state = this.activeStreams.get(targetConvId);
                  if (state) {
                    state.messages = state.messages.map(m =>
                      m.id === assistantId ? { ...m, content: m.content + batch } : m
                    );
                    if (this.activeConvId === targetConvId) {
                      this.messagesSubject.next(state.messages);
                    }
                  }
                });
              }, 30);
              break;
            case 'chart':
              updateTarget({ chartSpec: ev.spec });
              break;
            case 'followups':
              updateTarget({ followups: ev.suggestions });
              break;
            case 'suggestions':
              updateTarget({ suggestions: ev.items });
              break;
            case 'done':
              // Flush remaining tokens
              if (localTokenBuffer) {
                const batch = localTokenBuffer;
                localTokenBuffer = '';
                this.zone.run(() => {
                  const state = this.activeStreams.get(targetConvId);
                  if (state) {
                    state.messages = state.messages.map(m =>
                      m.id === assistantId ? { ...m, content: m.content + batch, status: 'complete' as const } : m
                    );
                    if (this.activeConvId === targetConvId) {
                      this.messagesSubject.next(state.messages);
                    }
                  }
                });
              } else {
                updateTarget({ status: 'complete' });
              }
              this.zone.run(() => {
                const state = this.activeStreams.get(targetConvId);
                if (state) state.isStreaming = false;
                this.updateStreamingState();
                this.loadConversations();
              });
              break;
            case 'error':
              updateTarget({ content: ev.message, status: 'error' });
              this.zone.run(() => {
                const state = this.activeStreams.get(targetConvId);
                if (state) state.isStreaming = false;
                this.updateStreamingState();
                this.loadConversations();
              });
              break;
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // Stream was stopped by user
        updateTarget({ status: 'complete' });
        this.zone.run(() => {
          const state = this.activeStreams.get(targetConvId);
          if (state) state.isStreaming = false;
          this.updateStreamingState();
        });
      } else {
        updateTarget({ content: 'Network error. Please try again.', status: 'error' });
        this.zone.run(() => {
          const state = this.activeStreams.get(targetConvId);
          if (state) state.isStreaming = false;
          this.updateStreamingState();
        });
      }
    }
  }
}
