import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User { id: string; name: string; email: string; role: string; }
interface AuthResponse { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        // If any of the auth-related keys change in another tab/window
        const authKeys = ['tw_user', 'tw_token', btoa('userId'), btoa('user_token'), btoa('current_user')];
        if (event.key && authKeys.includes(event.key)) {
          this.refreshUser();
        }
      });
    }
  }

  refreshUser(): void {
    const user = this.getStoredUser();
    this.userSubject.next(user);
  }

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('tw_user');
    if (raw) {
      const u = JSON.parse(raw);
      console.log("Chatbot Auth: Found tw_user:", u);
      return u;
    }

    // Fallback to parent application's user
    const parentUserId = localStorage.getItem(btoa('userId'));
    const parentName = localStorage.getItem(btoa('current_user'));
    
    console.log("Chatbot Auth: Parent user check:", { parentUserId, parentName });
    
    if (parentUserId || parentName) {
      return {
        id: parentUserId || 'TW',
        name: parentName ? atob(parentName) : 'User', // Usually parent apps base64 encode the values too! Let's just use it raw for now.
        email: '',
        role: 'user'
      };
    }
    return null;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.chatbotApiUrl}auth/login`, { email, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  signup(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.chatbotApiUrl}auth/signup`, { name, email, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  private setSession(res: AuthResponse) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('tw_token', res.token);
    localStorage.setItem('tw_user', JSON.stringify(res.user));
    this.userSubject.next(res.user);
  }

  updateName(newName: string): Observable<{ status: string, name: string }> {
    return this.http.put<{ status: string, name: string }>(`${environment.chatbotApiUrl}auth/me/name`, { name: newName }).pipe(
      tap(res => {
        const user = this.userSubject.value;
        if (user && res.status === 'ok') {
          const updatedUser = { ...user, name: res.name };
          if (typeof window !== 'undefined') {
            localStorage.setItem('tw_user', JSON.stringify(updatedUser));
          }
          this.userSubject.next(updatedUser);
        }
      })
    );
  }

  logout(expired: boolean = false): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tw_token');
      localStorage.removeItem('tw_user');
    }
    this.userSubject.next(null);
    const queryParams = expired ? { expired: 'true' } : {};
    this.router.navigate(['/login'], { queryParams });
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    let token = localStorage.getItem(btoa('user_token')) || localStorage.getItem('tw_token');
    if (token === 'null') return null;
    return token;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    return this.getStoredUser();
  }
}
