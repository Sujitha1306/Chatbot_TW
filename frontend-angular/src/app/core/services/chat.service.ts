import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage, Conversation } from '../../shared/models/chat.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { FacilityService } from './facility.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  private streamingSubject = new BehaviorSubject<boolean>(false);
  isStreaming$ = this.streamingSubject.asObservable();

  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  conversations$ = this.conversationsSubject.asObservable();

  activeConvId: string | null = null;

  // Token buffering (Fix 5)
  private tokenBuffer = '';
  private tokenFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private activeAssistantId = '';

  constructor(private auth: AuthService, private zone: NgZone, private facilitySvc: FacilityService) {}

  getCurrentMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  newConversation(): void {
    this.activeConvId = null;
    this.messagesSubject.next([]);
  }

  startConversation(question: string): string {
    const newId = crypto.randomUUID();
    this.newConversation();
    this.activeConvId = newId;
    this.sendMessage(question);
    return newId;
  }

  selectConversation(id: string): void {
    this.activeConvId = id;
    this.loadConversationMessages(id);
  }

  private currentLoadRequestId = 0;
  private currentConvListRequestId = 0;

  async loadConversations(): Promise<void> {
    const token = this.auth.getToken();
    if (!token) return;
    const requestId = ++this.currentConvListRequestId;
    try {
      const res = await fetch(`${environment.apiUrl}/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (requestId !== this.currentConvListRequestId) return;
      if (!res.ok) return;
      const data = await res.json();
      if (requestId !== this.currentConvListRequestId) return;
      this.conversationsSubject.next(data.conversations || []);
    } catch (e) {
      if (requestId === this.currentConvListRequestId) {
        console.error('Failed to load conversations', e);
      }
    }
  }

  async loadConversationMessages(convId: string): Promise<void> {
    const token = this.auth.getToken();
    if (!token) return;
    const requestId = ++this.currentLoadRequestId;
    try {
      const res = await fetch(`${environment.apiUrl}/chat/conversations/${convId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (requestId !== this.currentLoadRequestId) return;
      if (!res.ok) return;
      const data = await res.json();
      if (requestId !== this.currentLoadRequestId) return;
      const loadedMessages = (data.messages || []).map((m: any) => ({
        ...m,
        status: 'complete',
        rowCount: m.row_count || m.rowCount
      }));
      this.messagesSubject.next(loadedMessages);
      this.activeConvId = convId;
    } catch (e) {
      if (requestId === this.currentLoadRequestId) {
        console.error('Failed to load messages', e);
      }
    }
  }

  async deleteConversation(convId: string): Promise<void> {
    const token = this.auth.getToken();
    if (!token) return;
    try {
      await fetch(`${environment.apiUrl}/chat/conversations/${convId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const remaining = this.conversationsSubject.value.filter(c => c.id !== convId);
      this.conversationsSubject.next(remaining);
      if (this.activeConvId === convId) {
        this.newConversation();
      }
    } catch (e) {
      console.error('Failed to delete conversation', e);
    }
  }

  async sendMessage(question: string): Promise<void> {
    const current = this.messagesSubject.value;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: question,
      status: 'complete', timestamp: new Date(),
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId, role: 'assistant', content: '',
      status: 'pending', timestamp: new Date(),
      chartSpec: undefined,
      data: undefined,
    };

    this.messagesSubject.next([...current, userMsg, assistantMsg]);
    this.streamingSubject.next(true);

    const update = (patch: Partial<ChatMessage>) => {
      this.zone.run(() => {
        const msgs = this.messagesSubject.value.map(m =>
          m.id === assistantId ? { ...m, ...patch } : m
        );
        this.messagesSubject.next(msgs);
      });
    };

    try {
      const user = this.auth.getUser();
      const response = await fetch(`${environment.apiUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.getToken() || ''}`,
        },
        body: JSON.stringify({
          question,
          user_id: user?.id || 'TW', 
          session_id: this.activeConvId || 'default',
          filters: this.facilitySvc.getActiveFilters(),
        }),
      });

      if (!response.ok) {
        let errBody = 'Unknown error';
        try { errBody = await response.text(); } catch(e) {}
        update({ content: `Error: ${response.status} - ${errBody.slice(0,200)}`, status: 'error' });
        this.zone.run(() => this.streamingSubject.next(false));
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        let errBody = 'Invalid content type';
        try { errBody = await response.text(); } catch(e) {}
        console.error('Stream endpoint returned non-SSE response:', response.status, errBody);
        update({ content: `Error: Non-SSE response - ${errBody.slice(0,200)}`, status: 'error' });
        this.zone.run(() => this.streamingSubject.next(false));
        return;
      }
      
      if (!response.body) {
        update({ content: 'Response body is empty', status: 'error' });
        this.zone.run(() => this.streamingSubject.next(false));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
              this.activeConvId = ev.id;
              this.loadConversations();
              break;
            case 'intent':
              update({ domain: ev.domain, status: 'streaming' });
              break;
            case 'conversational':
              update({ domain: undefined, status: 'streaming' });
              break;
            case 'sql':
            case 'sql_corrected':
              update({ sql: ev.sql });
              break;
            case 'data':
              update({ data: ev.rows, rowCount: ev.row_count });
              break;
            case 'multi_data':
              update({ displaySections: ev.sections, rowCount: ev.row_count });
              break;
            case 'cross_conversation_results':
              update({ crossConversationRefs: ev.matches });
              break;
            case 'token':
              this.tokenBuffer += ev.text;
              if (this.tokenFlushTimer) clearTimeout(this.tokenFlushTimer);
              this.tokenFlushTimer = setTimeout(() => {
                const batch = this.tokenBuffer;
                this.tokenBuffer = '';
                this.zone.run(() => {
                  const msgs = this.messagesSubject.value.map(m =>
                    m.id === assistantId ? { ...m, content: m.content + batch } : m
                  );
                  this.messagesSubject.next(msgs);
                });
              }, 30);
              break;
            case 'chart':
              update({ chartSpec: ev.spec });
              break;
            case 'followups':
              update({ followups: ev.suggestions });
              break;
            case 'suggestions':
              update({ suggestions: ev.items });
              break;
            case 'done':
              // Flush remaining tokens
              if (this.tokenBuffer) {
                const batch = this.tokenBuffer;
                this.tokenBuffer = '';
                this.zone.run(() => {
                  const msgs = this.messagesSubject.value.map(m =>
                    m.id === assistantId ? { ...m, content: m.content + batch, status: 'complete' as const } : m
                  );
                  this.messagesSubject.next(msgs);
                });
              } else {
                update({ status: 'complete' });
              }
              this.zone.run(() => {
                this.streamingSubject.next(false);
                this.loadConversations();
              });
              break;
            case 'error':
              update({ content: ev.message, status: 'error' });
              this.zone.run(() => {
                this.streamingSubject.next(false);
                this.loadConversations();
              });
              break;
          }
        }
      }
    } catch {
      update({ content: 'Network error. Please try again.', status: 'error' });
      this.zone.run(() => this.streamingSubject.next(false));
    }
  }
}
