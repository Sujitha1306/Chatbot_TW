import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IframeService {

  sendNotification(actionType: 'post' | 'put' | 'delete', details: any): void {
    // Ensure we are inside an iframe and have a parent window reference
    if (window.parent) {
      const message = {
        type: 'UI_CHANGE_NOTIFICATION', // A specific message type for identification
        action: actionType,
        payload: details
      };
      // window.parent refers to the parent window.
      // Always specify the target origin for security, never use '*' in production.
      // Replace 'https://your-parent-origin.com' with the actual origin of the parent app.
      window.parent.postMessage(message, 'https://your-parent-origin.com');
    }
  }
}
