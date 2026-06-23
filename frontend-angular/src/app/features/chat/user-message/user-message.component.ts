import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../../../shared/models/chat.model';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-end group">
      <div class="max-w-2xl bg-brand-light/10 text-brand-navy px-5 py-3 rounded-2xl rounded-tr-sm border border-brand-primary/20">
        <div *ngIf="!isEditing()" class="text-sm font-medium whitespace-pre-wrap">{{ message.content }}</div>
        
        <div *ngIf="isEditing()" class="flex flex-col gap-2 w-full min-w-[300px]">
          <textarea [(ngModel)]="editText" 
                    class="w-full bg-white border border-gray-300 rounded p-2 text-sm text-gray-800 outline-none focus:border-brand-primary resize-y min-h-[80px]"
                    autoFocus></textarea>
          <div class="flex justify-end gap-2">
            <button (click)="cancelEdit()" class="px-3 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700">Cancel</button>
            <button (click)="saveEdit()" class="px-3 py-1 text-xs rounded bg-brand-primary text-white hover:bg-brand-primary/90">Save & Send</button>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" *ngIf="!isEditing()">
        <!-- Copy Button -->
        <div class="relative flex items-center group/tooltip">
          <button (click)="copyText()" class="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
            <svg *ngIf="!copied()" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <svg *ngIf="copied()" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          
          <!-- Custom Tooltip -->
          <div class="absolute bottom-full right-1/2 translate-x-1/2 mb-1 hidden group-hover/tooltip:flex items-center gap-1.5 bg-white text-gray-600 border border-gray-200 text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap shadow-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none">
            {{ copied() ? 'Copied!' : 'Copy' }}
          </div>
        </div>
        
        <!-- Edit Button -->
        <div class="relative flex items-center group/tooltip">
          <button (click)="startEdit()" class="text-gray-400 hover:text-brand-primary p-1 rounded transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
          
          <!-- Custom Tooltip -->
          <div class="absolute bottom-full right-1/2 translate-x-1/2 mb-1 hidden group-hover/tooltip:flex items-center gap-1.5 bg-white text-gray-600 border border-gray-200 text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap shadow-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none">
            Edit message
          </div>
        </div>
      </div>
    </div>
  `,
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
