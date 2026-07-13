import firebase from 'firebase/compat/app';
import { environment } from '../environments/environment';
import 'firebase/compat/messaging';

firebase.initializeApp(environment.firebaseConfig);
let messaging: firebase.messaging.Messaging;
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
if (!isSafari && !isMobile && (window.location.protocol !== 'http:' || window.location.hostname.includes('localhost')) && environment.fcm_Enable) {
  if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
  }
} else {
  console.log('FCM is disabled in this environment')
}

export { messaging };
