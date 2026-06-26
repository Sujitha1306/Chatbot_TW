import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../../../shared/models/chat.model';

@Component({
  selector: 'app-user-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="user-message-row group">
      <div class="user-message-bubble">
        <div *ngIf="!isEditing()" class="message-text">{{ message.content }}</div>
        
        <div *ngIf="isEditing()" class="edit-container">
          <textarea [(ngModel)]="editText" class="edit-textarea" autoFocus></textarea>
          <div class="edit-actions">
            <button (click)="cancelEdit()" class="btn-cancel">Cancel</button>
            <button (click)="saveEdit()" class="btn-save">Save & Send</button>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="message-actions" *ngIf="!isEditing()">
        <!-- Copy Button -->
        <div class="action-btn-container">
          <button (click)="copyText()" class="action-btn">
            <svg *ngIf="!copied()" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <svg *ngIf="copied()" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <div class="tooltip">{{ copied() ? 'Copied!' : 'Copy' }}</div>
        </div>
        
        <!-- Edit Button -->
        <div class="action-btn-container">
          <button (click)="startEdit()" class="action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
          <div class="tooltip">Edit message</div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./user-message.component.scss']
})
export class UserMessageComponent {
  @Input() message!: ChatMessage;
  @Output() editSubmit = new EventEmitter<{id: string, text: string}>();

  isEditing = signal(false);
  copied = signal(false);
  editText = '';

  startEdit() {
    this.editText = this.message.content;
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  saveEdit() {
    if (this.editText.trim()) {
      this.editSubmit.emit({ id: this.message.id, text: this.editText });
    }
    this.isEditing.set(false);
  }

  copyText() {
    navigator.clipboard.writeText(this.message.content);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
