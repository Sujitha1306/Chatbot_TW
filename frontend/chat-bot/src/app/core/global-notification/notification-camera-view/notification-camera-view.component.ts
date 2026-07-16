import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface CameraAsset {
  id: number;
  name: string;
  streamUrl: string;
  playUrl?: string;
  streamName: string;
  locationName: string;
}

@Component({
  selector: 'app-notification-camera-view',
  templateUrl: './notification-camera-view.component.html',
  styleUrls: ['./notification-camera-view.component.scss']
})
export class NotificationCameraViewComponent implements OnInit, OnDestroy {

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

  // DVR seek bar / rewind playback states
  @ViewChild('seekTrack') seekTrackEl!: ElementRef<HTMLDivElement>;
  seekLeftBound: Date = new Date();
  seekRightBound: Date = new Date();
  seekNow: Date = new Date();
  isSeekDragging = false;
  dragPreviewFraction = 0;
  dragPreviewTime: Date | null = null;
  isSeekHovering = false;
  hoverPreviewFraction = 0;
  hoverPreviewTime: Date | null = null;
  isReplayMode = false;
  replayStartTime: Date | null = null;
  noRecordingMessage: string | null = null;
  private replayQueue: { url: string; time: Date; end: Date }[] = [];
  private replayQueueIndex = 0;
  private pendingSeekOffsetSeconds = 0;
  private seekClockInterval: any;
  private seekPointerMoveHandler = (e: PointerEvent) => this.updateDragPosition(e.clientX);
  private seekPointerUpHandler = () => this.onSeekRelease();

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

  ngOnInit(): void {
    this.updateSeekBounds();
    this.seekClockInterval = setInterval(() => {
      this.seekNow = new Date();
      this.updateSeekBounds();
    }, 1000);
  }

  // Ruler is a rolling 1-hour window ending at the live edge - this view
  // always starts on live, so there's no alert timestamp to anchor to.
  private updateSeekBounds() {
    this.seekLeftBound = new Date(this.seekNow.getTime() - 60 * 60 * 1000);
    this.seekRightBound = this.seekNow;
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

  // ── DVR seek bar / rewind playback ─────────────────────────────────────

  get seekThumbTime(): Date {
    if (this.isSeekDragging && this.dragPreviewTime) {
      return this.dragPreviewTime;
    }
    if (this.isReplayMode) {
      const segment = this.replayQueue[this.replayQueueIndex];
      const base = segment?.time || this.replayStartTime;
      if (base) {
        const elapsed = this.videoEl?.nativeElement?.currentTime || 0;
        return new Date(base.getTime() + elapsed * 1000);
      }
    }
    return this.seekRightBound;
  }

  get seekThumbFraction(): number {
    if (this.isSeekDragging) {
      return this.dragPreviewFraction;
    }
    return this.seekFractionForTime(this.seekThumbTime);
  }

  private seekFractionForTime(time: Date): number {
    const total = this.seekRightBound.getTime() - this.seekLeftBound.getTime();
    if (total <= 0) return 1;
    const clamped = Math.min(Math.max(time.getTime() - this.seekLeftBound.getTime(), 0), total);
    return clamped / total;
  }

  formatClock(d: Date | null): string {
    if (!d) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  onSeekPointerDown(event: PointerEvent) {
    event.preventDefault();
    this.isSeekDragging = true;
    this.updateDragPosition(event.clientX);
    window.addEventListener('pointermove', this.seekPointerMoveHandler);
    window.addEventListener('pointerup', this.seekPointerUpHandler);
  }

  onSeekHoverMove(event: PointerEvent) {
    if (this.isSeekDragging) return;
    const result = this.computeFractionAndTime(event.clientX);
    if (!result) return;
    this.isSeekHovering = true;
    this.hoverPreviewFraction = result.fraction;
    this.hoverPreviewTime = result.time;
  }

  onSeekHoverLeave() {
    this.isSeekHovering = false;
    this.hoverPreviewTime = null;
  }

  private computeFractionAndTime(clientX: number): { fraction: number; time: Date } | null {
    const track = this.seekTrackEl?.nativeElement;
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    const fraction = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const totalMs = this.seekRightBound.getTime() - this.seekLeftBound.getTime();
    const time = new Date(this.seekLeftBound.getTime() + fraction * totalMs);
    return { fraction, time };
  }

  private updateDragPosition(clientX: number) {
    const result = this.computeFractionAndTime(clientX);
    if (!result) return;
    this.dragPreviewFraction = result.fraction;
    this.dragPreviewTime = result.time;
  }

  private endSeekDrag() {
    this.isSeekDragging = false;
    this.dragPreviewTime = null;
    window.removeEventListener('pointermove', this.seekPointerMoveHandler);
    window.removeEventListener('pointerup', this.seekPointerUpHandler);
  }

  private onSeekRelease() {
    const target = this.dragPreviewTime;
    this.endSeekDrag();
    if (!target) return;

    const nearLiveMs = 15 * 1000;
    if (this.seekRightBound.getTime() - target.getTime() <= nearLiveMs) {
      if (this.isReplayMode) {
        this.goLive();
      }
      return;
    }
    // Bound the fetch to the ruler's own right edge (at most 1 hour away)
    // instead of "now" - a wide open-ended range can cause the NVR to only
    // return its most-recent chunks, skipping the one at the dropped time.
    this.playFromTimestamp(target, this.seekRightBound);
  }

  private buildPlaybackUrl(baseUrl: string, start: Date, end: Date): string {
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    if (baseUrl.includes('<start>') || baseUrl.includes('<end>')) {
      return baseUrl.replace('<start>', startIso).replace('<end>', endIso);
    }
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}start=${startIso}&end=${endIso}`;
  }

  async playFromTimestamp(start: Date, end: Date = new Date()): Promise<boolean> {
    const video = this.videoEl?.nativeElement;
    if (!video || !this.selectedCamera) return false;

    if (!this.selectedCamera.playUrl) {
      this.errorMessage = 'Playback is not configured for this camera.';
      return false;
    }

    this.destroyStream();
    this.errorMessage = null;
    this.noRecordingMessage = null;
    this.isPlaying = false;
    this.isReplayMode = true;
    this.replayStartTime = start;

    // Shinobi only returns chunks whose own start time is >= the query's
    // "start" - it won't hand back a chunk that began earlier but is still
    // covering the requested instant. Pad the query backward by more than
    // one chunk's length so an already-in-progress chunk is included too.
    const queryStart = new Date(start.getTime() - 15 * 60 * 1000);
    const listUrl = this.buildPlaybackUrl(this.selectedCamera.playUrl, queryStart, end);

    try {
      const res = await fetch(listUrl);
      const data = await res.json();
      const videos: any[] = data?.videos || [];
      if (!data?.ok || !videos.length) {
        this.noRecordingMessage = 'No recorded footage available for this time.';
        this.isReplayMode = false;
        this.replayStartTime = null;
        return false;
      }

      const origin = new URL(listUrl).origin;
      this.replayQueue = videos
        .map(v => ({ url: origin + (v.href || v.actionUrl), time: new Date(v.time), end: new Date(v.end || v.time) }))
        // Drop chunks that are entirely padding - they ended before the
        // point we actually want to play from.
        .filter(v => v.end.getTime() > start.getTime())
        .sort((a, b) => a.time.getTime() - b.time.getTime());

      if (!this.replayQueue.length) {
        this.noRecordingMessage = 'No recorded footage available for this time.';
        this.isReplayMode = false;
        this.replayStartTime = null;
        return false;
      }

      this.replayQueueIndex = 0;

      // The first queued segment is now either the chunk that actually
      // contains "start" (offset seeks into it) or, if there's a genuine
      // gap in the recording, the earliest chunk after "start" (offset
      // clamps to 0, i.e. play from that chunk's own beginning).
      const firstSegment = this.replayQueue[0];
      this.pendingSeekOffsetSeconds = Math.max(0, (start.getTime() - firstSegment.time.getTime()) / 1000);

      this.playReplayQueueSegment();
      return true;
    } catch {
      this.errorMessage = 'Failed to load recorded footage for the selected time.';
      this.isReplayMode = false;
      this.replayStartTime = null;
      return false;
    }
  }

  private playReplayQueueSegment() {
    const video = this.videoEl?.nativeElement;
    if (!video) return;
    if (this.replayQueueIndex >= this.replayQueue.length) {
      this.goLive();
      return;
    }

    const segment = this.replayQueue[this.replayQueueIndex];
    const seekOffset = this.pendingSeekOffsetSeconds;
    this.pendingSeekOffsetSeconds = 0;

    video.src = segment.url;
    video.currentTime = 0;
    video.load();

    if (seekOffset > 0) {
      const applyOffset = () => {
        video.currentTime = Math.min(seekOffset, video.duration || seekOffset);
        video.removeEventListener('loadedmetadata', applyOffset);
      };
      video.addEventListener('loadedmetadata', applyOffset);
    }

    video.play().then(() => {
      this.isPlaying = true;
    }).catch(() => {
      this.errorMessage = 'Failed to play recorded footage for the selected time.';
    });
  }

  goLive() {
    this.destroyStream();
    this.elapsedSeconds = 0;
    this.timeDisplay = '0:00 / LIVE';
    this.startStream();
  }

  onReplayEnded() {
    if (!this.isReplayMode) return;
    this.replayQueueIndex++;
    this.playReplayQueueSegment();
  }

  onVideoTick() {
    // No-op: presence of this binding keeps change detection in sync
    // with the <video> element's currentTime while replaying, so the
    // seek thumb tracks playback progress.
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
      const video = this.videoEl.nativeElement;
      video.srcObject = null;
      video.removeAttribute('src');
      video.load();
    }
    this.endSeekDrag();
    this.isReplayMode = false;
    this.replayStartTime = null;
    this.replayQueue = [];
    this.replayQueueIndex = 0;
    this.pendingSeekOffsetSeconds = 0;
    this.noRecordingMessage = null;
  }

  ngOnDestroy() {
    this.destroyStream();
    clearInterval(this.seekClockInterval);
  }
}
