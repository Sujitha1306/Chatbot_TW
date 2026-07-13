import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface MfaVerifyResponse {
  statusCode: number;
  results: {
    success: boolean;
  };
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class MfaService {
  constructor(private api: ApiService) {}

  verify(userName: string, token: string): Observable<MfaVerifyResponse> {
    return this.api.post('api/all/auth/mfa/verify', { userName, token });
  }
}
