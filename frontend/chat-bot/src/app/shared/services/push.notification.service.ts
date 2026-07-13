import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { messaging } from '../../../config/firebase.config';
import { FloatNotificationManageService } from './float-notification-manage.service';


@Injectable({
    providedIn: 'root'
})
export class PushNotificationsService {
    public permission: Permission;
    private audioCooldown = false;

    constructor(private readonly floatNotificationService: FloatNotificationManageService) {
        this.permission = this.isSupported() ? 'default' : 'denied';
    }

    private readonly refreshTaskCount = new Subject<void>();
    refreshNotification$ = this.refreshTaskCount.asObservable();
    triggerNotificationRefresh() {
        this.refreshTaskCount.next();
    }

    public isSupported(): boolean {
        return 'Notification' in window;
    }

    requestPermission(): void {
        const self = this;
        if ('Notification' in window) {
            Notification.requestPermission(function(status) {
                return self.permission = status;
            });
        }
    }

    create(title: string, options ?: PushNotification): any {
        const self = this;
        return new Observable(function(obs) {
            if (!('Notification' in window)) {
                console.log('Notifications are not available in this environment');
                obs.complete();
            }
            if (self.permission !== 'granted') {
                console.log('The user hasn\'t granted you permission to send push notifications');
                obs.complete();
            }
            const _notify = new Notification(title, options);
            _notify.onshow = function(e) {
                return obs.next({
                    notification: _notify,
                    event: e
                });
            };
            _notify.onclick = function(e) {
                return obs.next({
                    notification: _notify,
                    event: e
                });
            };
            _notify.onerror = function(e) {
                return obs.error({
                    notification: _notify,
                    event: e
                });
            };
            _notify.onclose = function() {
                return obs.complete();
            };
        });
    }

    generateNotification(source: Array < any > ,image?): void {
        const self = this;
        source.forEach((item) => {
            const options = {
                body: item.alertContent,
                icon: image
            };
            const notify = self.create(item.title, options).subscribe();
            // this.playAudio(item.sounds)
            this.scheduleAudio(item.sounds, item.time);
        });
    }
    playAudio(alertConfig){
        if(alertConfig != null && alertConfig.enabled) {
            let audio = new Audio();
            audio.volume = 1
            audio.src = "../../../assets/audio/"+alertConfig.audio_file;
            audio.load();
            audio.play();

        }
    }

    scheduleAudio(alertConfig, audioCoolDownTime): void {
        if (!alertConfig?.enabled) {
            return;
        }
        // If cooldown active, don't play audio
        if (this.audioCooldown) {
            return;
        }
        // Play audio immediately
        this.playAudio(alertConfig);
        // Start cooldown
        this.audioCooldown = true;
        setTimeout(() => {
            this.audioCooldown = false;
        }, audioCoolDownTime);
    }

    //fire-base 

    listen() {
        if (!messaging) {
            console.log('FCM not initialized (likely HTTP or unsupported browser)');
            return;
        }

        messaging.onMessage((payload) => {
            const type = JSON.parse(payload.data?.additionalInfo);

            if (type?.isCalling) {
                const audio = new Audio('../../../../assets/audio/notification alert.mp3');
                audio.play().catch(err => console.log('Autoplay blocked:', err));
            }

            const title = payload.notification?.title;
            const body = payload.notification?.body;
            this.floatNotificationService.show(title, body, type, payload);
        });
    }
}

export declare type Permission = 'denied' | 'granted' | 'default';

export interface PushNotification {
    body ?: string;
    icon ?: string;
    tag ?: string;
    data ?: any;
    renotify ?: boolean;
    silent ?: boolean;
    sound ?: string;
    noscreen ?: boolean;
    sticky ?: boolean;
    dir ?: 'auto' | 'ltr' | 'rtl';
    lang ?: string;
    vibrate ?: number[];
}
