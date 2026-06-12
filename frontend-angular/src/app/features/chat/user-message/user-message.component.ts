import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../shared/models/chat.model';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex justify-end">
      <div class="max-w-2xl bg-brand-light/10 text-brand-navy px-5 py-3 rounded-2xl rounded-tr-sm border border-brand-primary/20">
        <div class="text-sm font-medium whitespace-pre-wrap">{{ message.content }}</div>
      </div>
    </div>
  `,
})
export class UserMessageComponent {
  @Input() message!: ChatMessage;
}
