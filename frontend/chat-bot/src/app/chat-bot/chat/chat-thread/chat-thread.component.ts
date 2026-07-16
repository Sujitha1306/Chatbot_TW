import { Component, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { FacilityService } from '../../services/facility.service';
import { ChatMessage } from '../../models/chat.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-thread',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-thread.component.html',
  styleUrls: ['./chat-thread.component.scss']
})
export class ChatThreadComponent implements OnInit, OnDestroy {
  @Input() conversationId?: string;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private scrollScheduled = false;

  messages$: any;
  isStreaming$: any;
  inputValue = '';
  isStreaming = false;
  private sub?: Subscription;

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
    if (this.conversationId) {
      if (this.conversationId !== this.chat.activeConvId) {
        this.chat.selectConversation(this.conversationId);
      }
    } else {
      this.route.paramMap.subscribe(params => {
        const id = params.get('conversationId');
        if (id && id !== 'current' && id !== this.chat.activeConvId) {
          this.chat.selectConversation(id);
        }
      });
    }

    this.sub = new Subscription();
    this.sub.add(this.chat.fillInput$.subscribe(val => {
      if (val) {
        this.inputValue = val;
        this.cdr.markForCheck();
      }
    }));

    this.sub.add(this.chat.isStreaming$.subscribe(streaming => {
      this.isStreaming = streaming;
    }));

    // When a previous conversation's history finishes loading, jump straight
    // to its most recent message instead of leaving the view at the top.
    this.sub.add(this.chat.conversationLoaded$.subscribe(() => {
      this.scheduleScroll(true);
    }));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private scheduleScroll(instant = false): void {
    if (this.scrollScheduled) return;
    this.scrollScheduled = true;
    requestAnimationFrame(() => {
      this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
      this.scrollScheduled = false;
    });
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!this.isStreaming) {
        this.send();
      }
    }
  }

  async send() {
    const q = this.inputValue.trim();
    if (!q || this.isStreaming) return;
    this.inputValue = '';
    await this.chat.sendMessage(q);
    this.scheduleScroll();
  }

  stop() {
    this.chat.stopStream();
  }

  onUserMessageEdit(event: {id: string, text: string}) {
    this.chat.editMessage(event.id, event.text);
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
