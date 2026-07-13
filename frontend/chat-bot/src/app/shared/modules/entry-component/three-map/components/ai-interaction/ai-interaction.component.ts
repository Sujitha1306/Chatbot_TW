import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../../../../../../environments/environment';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

@Component({
  selector: 'app-ai-interaction',
  standalone: false,
  templateUrl: './ai-interaction.component.html',
  styleUrls: ['./ai-interaction.component.scss']
})
export class AiInteractionComponent implements AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  messages: Message[] = [];
  userInput = '';
  isAiTyping = false;
  isChatEnabled = false;

  private messageIdCounter = 0;
  private shouldScrollToBottom = false;
  private welcomeShown = false;

  private conversationHistory: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }> = [];

  private readonly GEMINI_API_KEY = environment.base_value.geminiApiKey;

  private readonly GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

  constructor(private http: HttpClient) { }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat(): void {
    this.isChatEnabled = !this.isChatEnabled;

    if (this.isChatEnabled && !this.welcomeShown) {
      this.initializeConversation();
      this.addWelcomeMessage();
      this.welcomeShown = true;
    }
  }

  /**
   * Add a single instruction that controls HOW the AI responds.
   * This is NOT conversational content.
   */
  private initializeConversation(): void {
    this.conversationHistory.push({
      role: 'user',
      parts: [
        {
          text:
            'Answer clearly and directly. Avoid repeating context, greetings, or unnecessary introductions.'
        }
      ]
    });
  }

  private addWelcomeMessage(): void {
    const welcomeMessage: Message = {
      id: this.messageIdCounter++,
      text:
        'Hi! 👋 I’m your assistant. Feel free to ask me anything.',
      sender: 'ai',
      timestamp: new Date()
    };

    this.messages.push(welcomeMessage);
    this.shouldScrollToBottom = true;
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isAiTyping) {
      return;
    }

    const userMessage: Message = {
      id: this.messageIdCounter++,
      text: this.userInput.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    this.messages.push(userMessage);

    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage.text }]
    });

    this.userInput = '';
    this.shouldScrollToBottom = true;

    this.getAiResponse();
  }

  private getAiResponse(): void {
    this.isAiTyping = true;

    const url = `${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`;

    const body = {
      contents: this.conversationHistory,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 500
      }
    };

    this.http.post<any>(url, body).subscribe({
      next: (response) => {
        const text =
          response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          const aiMessage: Message = {
            id: this.messageIdCounter++,
            text,
            sender: 'ai',
            timestamp: new Date()
          };

          this.messages.push(aiMessage);

          this.conversationHistory.push({
            role: 'model',
            parts: [{ text }]
          });
        } else {
          this.addErrorMessage('Empty response from AI.');
        }

        this.isAiTyping = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Gemini API Error:', error);

        let errorText = 'Something went wrong. Please try again.';

        if (error.status === 429) {
          errorText = 'Rate limit reached. Please wait and retry.';
        } else if (error.status === 403) {
          errorText = 'Invalid or restricted API key.';
        } else if (error.status === 404) {
          errorText = 'AI model or endpoint not found.';
        }

        this.addErrorMessage(errorText);
        this.isAiTyping = false;
        this.shouldScrollToBottom = true;
      }
    });
  }

  private addErrorMessage(text: string): void {
    this.messages.push({
      id: this.messageIdCounter++,
      text,
      sender: 'ai',
      timestamp: new Date()
    });
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    } catch { }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
