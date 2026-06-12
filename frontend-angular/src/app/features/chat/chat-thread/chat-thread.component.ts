import { Component, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { UserMessageComponent } from '../user-message/user-message.component';
import { AssistantMessageComponent } from '../assistant-message/assistant-message.component';
import { FacilityFilterComponent } from '../facility-filter/facility-filter.component';
import { FacilityService } from '../../../core/services/facility.service';
import { ChatMessage } from '../../../shared/models/chat.model';

@Component({
  selector: 'app-chat-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, UserMessageComponent, AssistantMessageComponent, FacilityFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-thread.component.html',
})
export class ChatThreadComponent implements OnInit {
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private scrollScheduled = false;

  messages$: any;
  isStreaming$: any;
  inputValue = '';

  constructor(
    private chat: ChatService, 
    private route: ActivatedRoute, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    public facilitySvc: FacilityService
  ) {
    this.messages$ = this.chat.messages$;
    this.isStreaming$ = this.chat.isStreaming$;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('conversationId');
      if (id && id !== 'current' && id !== this.chat.activeConvId) {
        this.chat.selectConversation(id);
      }
    });
  }

  private scheduleScroll(): void {
    if (this.scrollScheduled) return;
    this.scrollScheduled = true;
    requestAnimationFrame(() => {
      this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.scrollScheduled = false;
    });
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  async send() {
    const q = this.inputValue.trim();
    if (!q) return;
    this.inputValue = '';
    await this.chat.sendMessage(q);
    this.scheduleScroll();
  }

  onFollowupClick(text: string) {
    this.chat.sendMessage(text);
    this.scheduleScroll();
  }

  trackById(index: number, msg: ChatMessage): string {
    return msg.id;
  }

  getPreviousUserMessage(index: number): string {
    if (index === 0) return '';
    const msgs = this.chat.getCurrentMessages();
    const prev = msgs[index - 1];
    return prev?.role === 'user' ? prev.content : '';
  }
}
