import { Component, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface CameraAsset {
  id: number;
  name: string;
  streamUrl: string;
  streamName: string;
  locationName: string;
}

@Component({
  selector: 'app-notification-camera-view',
  templateUrl: './notification-camera-view.component.html',
  styleUrls: ['./notification-camera-view.component.scss']
})
export class NotificationCameraViewComponent implements OnDestroy {

  cameras: CameraAsset[] = [];
  selectedCamera: CameraAsset | null = null;

  isLoading = false;
  errorMessage: string | null = null;
  isPlaying = false;
  isVolumeMuted = false;
  isFullscreen = false;
  timeDisplay = '0:00 / LIVE';

  private pc: RTCPeerConnection | null = null;
  private progressInterval: any;
  private elapsedSeconds = 0;

  @ViewChild('videoPlayer')
  set videoSetter(video: ElementRef<HTMLVideoElement>) {
    if (video) {
      this.videoEl = video;
      this.startStream();
    }
  }
  videoEl: ElementRef<HTMLVideoElement> | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { cameras: CameraAsset[]; locationName: string }) {
    this.cameras = data.cameras || [];
    if (this.cameras.length === 1) {
      this.selectedCamera = this.cameras[0];
    }
  }

  selectCamera(camera: CameraAsset) {
    this.destroyStream();
    this.selectedCamera = camera;
    this.errorMessage = null;
    this.elapsedSeconds = 0;
    this.timeDisplay = '0:00 / LIVE';
    this.isPlaying = false;
  }

  async startStream() {
    if (!this.videoEl || !this.selectedCamera) return;

    this.isLoading = true;
    this.errorMessage = null;

    const video = this.videoEl.nativeElement;

    try {
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      this.pc.ontrack = (event) => {
        video.srcObject = event.streams[0];
        this.isLoading = false;
        this.isPlaying = true;
        this.startProgressTimer();
      };

      this.pc.oniceconnectionstatechange = () => {
        if (this.pc?.iceConnectionState === 'failed' || this.pc?.iceConnectionState === 'disconnected') {
          this.isLoading = false;
          this.errorMessage = 'Stream connection lost. Please try again.';
        }
      };

      this.pc.addTransceiver('video', { direction: 'recvonly' });
      this.pc.addTransceiver('audio', { direction: 'recvonly' });

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const response = await fetch(this.selectedCamera.streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: offer.sdp
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.msg || 'Stream server returned an error');
      }

      await this.pc.setRemoteDescription({ type: 'answer', sdp: result.sdp });

    } catch (err: any) {
      this.isLoading = false;
      this.errorMessage = err?.message || 'Failed to connect to the camera stream.';
    }
  }

  togglePlay() {
    const video = this.videoEl?.nativeElement;
    if (!video) return;
    if (video.paused) { video.play(); this.isPlaying = true; }
    else { video.pause(); this.isPlaying = false; }
  }

  toggleVolume() {
    const video = this.videoEl?.nativeElement;
    if (!video) return;
    video.muted = !video.muted;
    this.isVolumeMuted = video.muted;
  }

  setVolume(event: Event) {
    const video = this.videoEl?.nativeElement;
    if (!video) return;
    const val = +(event.target as HTMLInputElement).value;
    video.volume = val / 100;
    this.isVolumeMuted = val === 0;
  }

  toggleFullscreen() {
    const el = this.videoEl?.nativeElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }

  private startProgressTimer() {
    clearInterval(this.progressInterval);
    this.progressInterval = setInterval(() => {
      this.elapsedSeconds++;
      const m = Math.floor(this.elapsedSeconds / 60);
      const s = String(this.elapsedSeconds % 60).padStart(2, '0');
      this.timeDisplay = `${m}:${s} / LIVE`;
    }, 1000);
  }

  private destroyStream() {
    clearInterval(this.progressInterval);
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.videoEl?.nativeElement) {
      this.videoEl.nativeElement.srcObject = null;
    }
  }

  ngOnDestroy() {
    this.destroyStream();
  }
}
