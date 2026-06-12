import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User { id: string; name: string; email: string; role: string; }
interface AuthResponse { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('tw_user');
    return raw ? JSON.parse(raw) : null;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  signup(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/signup`, { name, email, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  private setSession(res: AuthResponse) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('tw_token', res.token);
    localStorage.setItem('tw_user', JSON.stringify(res.user));
    this.userSubject.next(res.user);
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tw_token');
      localStorage.removeItem('tw_user');
    }
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('tw_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
