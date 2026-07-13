import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AppToastService {

  constructor(private readonly toastr: ToastrService) {}

  private fixMessage(
    method: 'success' | 'error' | 'info' | 'warning',
    a: string,
    b?: string
  ) {
    let title = '';
    let message = '';

    if (!b) {
      // Only one argument
      // → Use default title based on method
      title = method.charAt(0).toUpperCase() + method.slice(1);
      message = a;
    } else {
      // Two arguments present
      // Detect whether first argument is title or message
      const possibleTitleWords = ['success', 'sucess', 'warning', 'error', 'info'];

      const isTitle =
        possibleTitleWords.includes(a.trim().toLowerCase());

      if (isTitle) {
        // Syntax: title, message
        title = a;
        message = b;
      } else {
        // Syntax: message, title
        title = b;
        message = a;
      }
    }

    return { title, message };
  }

  success(a: string, b?: string) {
    const { title, message } = this.fixMessage('success', a, b);
    this.toastr.success(message, title, { progressBar: true, closeButton: false });
  }

  error(a: string, b?: string) {
    const { title, message } = this.fixMessage('error', a, b);
    this.toastr.error(message, title, { progressBar: true, closeButton: false });
  }

  info(a: string, b?: string) {
    const { title, message } = this.fixMessage('info', a, b);
    this.toastr.info(message, title, { progressBar: true, closeButton: false });
  }

  warning(a: string, b?: string) {
    const { title, message } = this.fixMessage('warning', a, b);
    this.toastr.warning(message, title, { progressBar: true, closeButton: false });
  }

   clear() {
    this.toastr.clear();
  }
}
