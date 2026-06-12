import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './chat-layout.component.html',
})
export class ChatLayoutComponent {
  sidebarCollapsed = false;
  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }
}
