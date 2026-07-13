import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { messaging } from '../../../config/firebase.config';

@Injectable({
  providedIn: 'root'
})
export class FireBaseServiceService {
  public fcmToken: string | null = null;
  private generatingToken = false;
  private tokenPromise: Promise<string | null> | null = null;

  constructor() { 
    this.fcmToken = localStorage.getItem('fcmToken');
  }

  initFCM(): Promise<string | null> {
    if (this.fcmToken) {
      return Promise.resolve(this.fcmToken);
    }
    if (this.tokenPromise) {
      return this.tokenPromise;
    }
    if (!messaging) {
      console.warn("FCM messaging not available");
      return Promise.resolve(null);
    }
    this.generatingToken = true;
    this.tokenPromise= messaging.getToken({
      vapidKey: environment.firebaseConfig.vapidKey
    })
      .then((currentToken) => {
        this.generatingToken = false;
        if (currentToken) {
          this.fcmToken = currentToken;
          localStorage.setItem('fcmToken', currentToken);
          console.log("FCM TOKEN:", currentToken);
        } else {
          console.log("No registration token available.");
        }
        return currentToken;
      })
      .catch((err) => {
        this.generatingToken = false;
        console.log("FCM token error:", err);
        return null;
      }).finally(() => {
        this.tokenPromise = null; // reset after completion
      });
    return this.tokenPromise;
  }
}
