import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {
  voices: SpeechSynthesisVoice[] = [];
  voicesLoaded: boolean = false;

  constructor() { 
    this.voicesList([]);
  }

  voicesList(textList?: any, language?: string, volume?, speed?, pitch?) {
    window.speechSynthesis.onvoiceschanged = () => {
      this.voices = window.speechSynthesis.getVoices();
      this.voicesLoaded = true;
      console.log("Voices have been loaded", this.voices);
      if (textList?.length > 0) {
        this.speak(textList, language, volume, speed, pitch);
      } 
    };
  }

  speak(textList: any, language?: string, volume?, speed?, pitch?, voice?): Promise<void> {
    return new Promise(resolve => {
      //console.log("inside speak");
      if (!this.voicesLoaded) {
        //console.log("Voices not yet loaded. Please wait...");
        this.voicesList(textList, language, volume, speed, pitch);
        return resolve();
      } 
      if (textList.length > 0) {
        this.speakText(textList, language, volume, speed, pitch, voice).then(() => {
          resolve(); // resolve when all speech is done
        });
      } else {
        resolve();
      }
    });
  }

speakText(textList: string[], language?: string, volume?, speed?, pitch?, voice?): Promise<void> {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported');
      return resolve();
    }
    const synth = window.speechSynthesis;
    let index = 0;

    const speakNext = () => {
      if (index >= textList.length) {
        return resolve();
      }

      // If page is hidden or unloading, skip remaining
      if (document.visibilityState !== 'visible') {
        console.warn('Page not visible; skipping speech');
        return resolve();
      }

      const currentText = textList[index];
      const utter = new SpeechSynthesisUtterance(currentText);

      utter.lang = language ?? 'en-US';
      utter.volume = volume ?? 1;
      utter.rate = speed ?? 1;
      utter.pitch = pitch ?? 1;

      if (this.voices?.length && voice) {
        const v = this.voices.find(x => x.name.includes(voice));
        if (v) utter.voice = v;
      }

      const cleanup = () => {
        utter.onend = null;
        utter.onerror = null;
      };

      utter.onend = () => {
        cleanup();
        index++;
        // tiny delay to avoid race conditions in some browsers
        setTimeout(speakNext, 10);
      };

      utter.onerror = (ev) => {
        console.warn('Speech utterance error', ev);
        cleanup();
        index++;
        setTimeout(speakNext, 10);
      };

      try {
        synth.speak(utter);
      } catch (err) {
        console.error('synth.speak threw', err);
        // continue to next text instead of rejecting
        index++;
        setTimeout(speakNext, 10);
      }
    };

    speakNext();
  });
}


}
