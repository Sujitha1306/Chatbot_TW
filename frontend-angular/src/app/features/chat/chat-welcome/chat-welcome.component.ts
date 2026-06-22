import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { LucideAngularModule } from 'lucide-angular';
import { FacilityFilterComponent } from '../facility-filter/facility-filter.component';

@Component({
  selector: 'app-chat-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, FacilityFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-welcome.component.html',
})
export class ChatWelcomeComponent {
  suggestions = [
    { icon: 'bar-chart-2', title: 'Porter Performance',  subtitle: 'Show porter performance by facility',          query: 'Show porter performance by facility' },
    { icon: 'line-chart',  title: 'Assets Dashboard',    subtitle: 'Display active assets by department',         query: 'Display active assets by department' },
    { icon: 'clock',       title: 'TAT Analysis',        subtitle: 'Which porter had the minimum TAT last month?',query: 'Which porter had the minimum TAT last month?' },
    { icon: 'shield',      title: 'Warranty Status',     subtitle: 'Which assets have warranty expiring next 30 days?', query: 'Which assets have warranty expiring in next 30 days?' },
  ];
  inputValue = '';

  constructor(private chat: ChatService, private router: Router) {}

  selectSuggestion(query: string) { 
    this.inputValue = query; 
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }
  
  send() { 
    const q = this.inputValue.trim();
    if (!q) return;
    const convId = this.chat.startConversation(q);
    this.router.navigate(['/chat', convId]);
  }
}
