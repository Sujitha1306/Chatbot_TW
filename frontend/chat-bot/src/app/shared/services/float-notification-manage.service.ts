import { ApplicationRef, ComponentFactoryResolver, Injectable, Injector } from '@angular/core';
import { OnSiteNotificationComponent } from '../modules/entry-component/on-site-notification/on-site-notification.component';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class FloatNotificationManageService {
  private readonly callerDataSubject = new BehaviorSubject<any>(null);
  callerData$ = this.callerDataSubject.asObservable();

  constructor(private readonly appRef: ApplicationRef, private readonly resolver: ComponentFactoryResolver, private readonly injector: Injector, private readonly router: Router) { }

  show( title: string, message: string, type, payloadData?: any) {
    const factory = this.resolver.resolveComponentFactory(OnSiteNotificationComponent);
    const componentRef = factory.create(this.injector);
  
    componentRef.instance.title = title;
    componentRef.instance.message = message;
    componentRef.instance.type = type;
  
    let audio: HTMLAudioElement | null = null;

  if (type.hasOwnProperty('isCalling') && type.isCalling === true) {
    audio = new Audio('../../../../assets/audio/notification-ringtone.mp3');
    audio.loop = true;
    audio.play().catch(err => console.log('Autoplay blocked:', err));
  }

  const stopAudio = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio = null;
    }
  };

  this.updateCallerData(payloadData)

  componentRef.instance.accept.subscribe(() => {
    stopAudio();
    this.callerDataSubject.next(payloadData);
    let data = JSON.parse(payloadData.data?.additionalInfo);
    if(data.identifyingType === 'RQT-AMB'){
      let callData = {
        "channelName": data.channelName,
        "token": data.token,
        "meetingId": data.meetingId
      }
      this.router.navigate(['/ovitag/workflow/ambulance'], {
        queryParams: { callId: JSON.stringify(callData) }
      });
    }
    this.cleanup(componentRef);
  });

  componentRef.instance.reject.subscribe(() => {
    stopAudio();
    this.cleanup(componentRef);
    this.updateCallerData('reject');
  });

  this.appRef.attachView(componentRef.hostView);
  const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
  document.body.appendChild(domElem);

  setTimeout(() => {
    stopAudio();
    this.cleanup(componentRef);
  }, type.hasOwnProperty('isCalling') && type.isCalling === true ? 30000 : 5000);
}

  updateCallerData(data: string) {
    this.callerDataSubject.next(data);
  }
  
  private cleanup(componentRef: any) {
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }
}
