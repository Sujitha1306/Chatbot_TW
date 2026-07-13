import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  private readonly consentKey = 'cookiesAccepted';

  constructor(private readonly cookieService: CookieService) {}

  // Check if the user has accepted cookies
  hasUserConsented(): boolean {
    return localStorage.getItem(this.consentKey) === 'true';
  }

  // Set user consent and enable cookies
  acceptCookies() {
    localStorage.setItem(this.consentKey, 'true');
    this.enableCookies();
  }

  // Deny cookies and clear stored cookies
  denyCookies() {
    localStorage.setItem(this.consentKey, 'false');
    this.clearCookies();
  }

  // Enable necessary cookies (only if accepted)
  enableCookies() {
    this.cookieService.set('session_cookie', 'user123', 1, '/'); // Example session cookie
  }

  // Clear all cookies if consent is denied
  clearCookies() {
    this.cookieService.deleteAll('/');
  }
}
