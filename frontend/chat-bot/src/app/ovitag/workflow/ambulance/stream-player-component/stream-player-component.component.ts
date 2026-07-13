import { Component, ElementRef, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-stream-player-component',
  templateUrl: './stream-player-component.component.html',
  styleUrls: ['./stream-player-component.component.scss']
})
export class StreamPlayerComponentComponent  {
  ws!: WebSocket;
  micStream!: MediaStream;
  audioContext!: AudioContext;
  processor: any;
  micEnabled = false;
  currentCam!: string | null ;
  audioUrl
  baseUrl
@ViewChild('videoPlayer')
set videoSetter(video: ElementRef<HTMLVideoElement>) {
  if (video) {
    this.video = video;
    this.startStream(); 
  }
}

video!: ElementRef<HTMLVideoElement>;
private initialized = false;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    const url = data?.audioUrl;
     this.audioUrl = new URL(data?.audioUrl);
    if(this.audioUrl){
     this.baseUrl = this.audioUrl.origin; 
      this.currentCam = this.audioUrl.searchParams.get('cam');
    }
  }


async startStream() {

  const video = this.video.nativeElement;

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  pc.ontrack = (event) => {
    video.srcObject = event.streams[0];
  };
  
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const response = await fetch(this.data.streamUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: offer.sdp
  });

  const data = await response.json();

  if (data.code !== 0) {
    console.error("ZLM Error:", data.msg);
    return;
  }

  await pc.setRemoteDescription({
    type: "answer",
    sdp: data.sdp
  });

  console.log("WebRTC Connected!");
}

async startTalk() {
  await fetch(`${this.baseUrl}/start-talk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cam: this.currentCam })
  });
  const url = new URL(this.audioUrl);
  const host = url.host;
  const query = url.search; 
  const wsUrl = `wss://${host}/ws${query}`;
  this.ws = new WebSocket(wsUrl);
  this.ws.binaryType = 'arraybuffer';

  this.ws.onopen = () => {
    console.log("Talk WS connected");
  };
  this.ws.onerror = (err) => {
    console.error("WS error:", err);
  };

  this.ws.onclose = (event) => {
    console.warn("WS closed:", event);
  };
  this.isPlaying = true;
  this.startProgressTimer();
}
async startMic() {
  this.micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    }
  });

  this.audioContext = new AudioContext({ sampleRate:  48000   });
  if (this.audioContext.state === 'suspended') {
    await this.audioContext.resume();
  }

  const source = this.audioContext.createMediaStreamSource(this.micStream);
  this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

  this.processor.onaudioprocess = (e: any) => {

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const input = e.inputBuffer.getChannelData(0);
    const pcm = new Int16Array(input.length);

    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    this.ws.send(pcm.buffer);
  };

  source.connect(this.processor);
 const silentDest = this.audioContext.createMediaStreamDestination();
  this.processor.connect(silentDest);
  this.micEnabled = true;
}

stopMic() {
  this.processor?.disconnect();
  this.audioContext?.close();
  this.micStream?.getTracks().forEach(t => t.stop());
  this.micEnabled = false;
}

async stopTalk() {
  await fetch(`${this.baseUrl}/stop-talk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cam: this.currentCam })
  });

  this.ws?.close();
}

isTalking = false;
isMicMuted = true;

toggleTalk() {
  this.isTalking = !this.isTalking;
  const btn = document.getElementById('talkBtn');
  const label = document.getElementById('talkLabel');
  if (label) label.textContent = this.isTalking ? 'End Talk' : 'Talk';
  btn?.setAttribute('title', this.isTalking ? 'End Talk' : 'Start Talk');
  this.isTalking ? btn?.classList.add('active') : btn?.classList.remove('active');

  // wire to your existing methods:
  this.isTalking ? this.startTalk() : this.stopTalk();
}

toggleMic() {
  this.isMicMuted = !this.isMicMuted;
  const btn = document.getElementById('micBtn');
  const onIcon  = document.getElementById('micOnIcon');
  const offIcon = document.getElementById('micOffIcon');
  if (onIcon)  onIcon.style.display  = this.isMicMuted ? 'none' : '';
  if (offIcon) offIcon.style.display = this.isMicMuted ? ''     : 'none';
  this.isMicMuted ? btn?.classList.add('muted') : btn?.classList.remove('muted');
  btn?.setAttribute('title', this.isMicMuted ? 'Mic Off' : 'Mic On');

  // wire to your existing methods:
  this.isMicMuted ? this.stopMic() : this.startMic();
}
// Add these new state properties
isPlaying = false;
isVolumeMuted = false;
isFullscreen = false;
timeDisplay = '0:00 / LIVE';
private progressInterval: any;
private elapsedSeconds = 0;

// Play / Pause
togglePlay() {
  const video = this.video?.nativeElement;
  if (!video) return;
  if (video.paused) { video.play(); this.isPlaying = true; }
  else              { video.pause(); this.isPlaying = false; }
}

toggleVolume() {
  const video = this.video?.nativeElement;
  if (!video) return;
  video.muted = !video.muted;
  this.isVolumeMuted = video.muted;
}

// Volume slider
setVolume(event: Event) {
  const video = this.video?.nativeElement;
  if (!video) return;
  const val = +(event.target as HTMLInputElement).value;
  video.volume = val / 100;
  this.isVolumeMuted = val === 0;
}

// Fullscreen
toggleFullscreen() {
  const el = this.video?.nativeElement;
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen();
    this.isFullscreen = true;
  } else {
    document.exitFullscreen();
    this.isFullscreen = false;
  }
}
toggleVoice() {
  if (!this.isTalking) {
    this.isTalking = true;
    this.isMicMuted = false;

    this.startTalk();
    this.startMic();
    return;
  }

  this.isMicMuted = !this.isMicMuted;

  if (this.isMicMuted) {
    this.stopMic();
  } else {
    this.startMic();
  }
}

private startProgressTimer() {
  this.progressInterval = setInterval(() => {
    this.elapsedSeconds++;
    const m = Math.floor(this.elapsedSeconds / 60);
    const s = String(this.elapsedSeconds % 60).padStart(2, '0');
    this.timeDisplay = `${m}:${s} / LIVE`;
  }, 1000);
}

close(){
  this.stopMic()
  this.stopTalk()
}
}