import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonService } from '../../../../shared/services/common.service';
import { AppToastService } from '../../../../shared/services/toaster.service';

interface ParsedMessage {
  title: string;
  description: string;
  pairs: { key: string; value: string }[];
  isPlain: boolean;
}

interface CameraAsset {
  id: number;
  name: string;
  streamUrl: string;
  streamName: string;
  locationName: string;
}

@Component({
  selector: 'app-infant-alert-dialog',
  templateUrl: './infant-alert-dialog.component.html',
  styleUrls: ['./infant-alert-dialog.component.scss']
})
export class InfantAlertDialogComponent implements OnInit, OnDestroy {

  remarksForm: FormGroup;
  isLoading = false;
  currentUserId: string;

  private alertMeta: { [key: string]: { icon: string; colorClass: string } } = {
    'CE-TAM': { icon: '/assets/Alert/CE-TAM.svg',             colorClass: 'banner-orange' },
    'CE-INS': { icon: '/assets/Alert/CE-INS.svg',             colorClass: 'banner-blue'   },
    'CE-WRP': { icon: '/assets/Alert/CE-WRP.svg',             colorClass: 'banner-red'    },
    'RU-MO':  { icon: '/assets/Alert/IP/Moved-out-icon.svg',  colorClass: 'banner-red'    },
    'RU-FA':  { icon: '/assets/Alert/IP/fall.svg',            colorClass: 'banner-red'    },
    'RU-MI':  { icon: '/assets/Alert/IP/patient-missing.svg', colorClass: 'banner-red'    },
    'RU-GO':  { icon: '/assets/Alert/IP/geofence.svg',        colorClass: 'banner-teal'   },
    'RU-SE':  { icon: '/assets/Alert/IP/sensor.svg',          colorClass: 'banner-teal'   },
  };

  alertCode: string;
  alertIcon: string;
  alertColorClass: string;
  alertTitle: string;
  parsedMsg: ParsedMessage;

  // ── Camera / video state ──────────────────────────────────────────────────
  showVideo      = false;
  cameraLoading  = false;
  cameraError    = '';
  cameras: CameraAsset[] = [];
  selectedCamera: CameraAsset | null = null;

  isStreamLoading = false;
  streamError     = '';
  isPlaying       = false;
  isVolumeMuted   = false;
  isFullscreen    = false;
  timeDisplay     = '0:00 / LIVE';

  private pc: RTCPeerConnection | null = null;
  private progressInterval: any;
  private elapsedSeconds = 0;

  @ViewChild('videoPlayer')
  set videoSetter(el: ElementRef<HTMLVideoElement>) {
    if (el) {
      this.videoEl = el;
      this.startStream();
    }
  }
  videoEl: ElementRef<HTMLVideoElement> | null = null;

  constructor(
    public dialogRef: MatDialogRef<InfantAlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { alert: any; patient: any },
    private fb: FormBuilder,
    private commonService: CommonService,
    private toastr: AppToastService
  ) {}

  ngOnInit() {
    this.currentUserId = localStorage.getItem('userId');
    this.remarksForm = this.fb.group({ comments: [''] });

    const alert = this.data.alert;
    this.alertCode      = alert?.eventCode || alert?.alertCode || '';
    const meta          = this.alertMeta[this.alertCode] || { icon: '', colorClass: 'banner-blue' };
    this.alertIcon      = meta.icon;
    this.alertColorClass = meta.colorClass;
    this.alertTitle     = alert?.eventName || this.alertCode || 'Alert';
    this.parsedMsg      = this.parseMessage(alert?.message || '');
  }

  // ── Message parsing ───────────────────────────────────────────────────────
  private parseMessage(raw: string): ParsedMessage {
    const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const kvPattern = /^([^:\n]{1,40}):\s*(.+)$/;
    const pairs: { key: string; value: string }[] = [];
    const headerLines: string[] = [];
    let kvStarted = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { continue; }
      const match = trimmed.match(kvPattern);
      if (match) {
        pairs.push({ key: match[1].trim(), value: match[2].trim() });
        kvStarted = true;
      } else if (!kvStarted) {
        headerLines.push(trimmed);
      }
    }

    const isPlain = pairs.length === 0;
    return {
      title:       isPlain ? '' : (headerLines[0] || ''),
      description: isPlain ? headerLines.join(' ') : headerLines.slice(1).join(' '),
      pairs,
      isPlain,
    };
  }

  // ── Cancel alert ─────────────────────────────────────────────────────────
  onCancelAlert() {
    const alertId = this.data.alert?.alertId;
    if (!alertId) { return; }

    this.isLoading = true;
    const payload = {
      ids: [alertId],
      comments: this.remarksForm.value.comments || '',
      closedById: parseInt(this.currentUserId, 10),
    };

    this.commonService.cancelAlert(payload).subscribe(
      res => {
        this.isLoading = false;
        if (res.statusCode === 1) {
          this.toastr.success('Success', res.message);
          this.dialogRef.close('confirm');
        }
      },
      err => {
        this.isLoading = false;
        this.toastr.error('Error', err?.error?.message || 'Something went wrong');
      }
    );
  }

  // ── Dialog resize (with CSS transition on the overlay pane) ──────────────
  private resizeDialog(width: string, height: string) {
    const pane = document.querySelector('.infant-alert-popup') as HTMLElement;
    if (pane) {
      pane.style.transition = 'width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1)';
    }
    this.dialogRef.updateSize(width, height);
  }

  // ── Video panel toggle ────────────────────────────────────────────────────
  onVideoClick() {
    const locationId = this.data.patient?.locationId
                    || this.data.patient?.currentLocationId
                    || this.data.alert?.locationId;

    if (!locationId) {
      this.toastr.error('Error', 'Location not available to fetch camera.');
      return;
    }

    this.cameraLoading = true;
    this.cameraError   = '';
    this.showVideo     = true;
    this.resizeDialog('72vw', '88vh');

    this.commonService.getConnectivityAssets(locationId).subscribe(
      res => {
        this.cameraLoading = false;
        const raw: any[] = res?.results || [];
        this.cameras = raw
          .filter(a => a.assetTypeId === 'AT-CCTV')
          .map(a => {
            let streamUrl  = '';
            let streamName = '';
            try {
              const out = JSON.parse(a.outputDate || '{}');
              streamUrl  = out.streamUrl  || '';
              streamName = out.streamName || '';
            } catch { /* ignore parse errors */ }
            return { id: a.id, name: a.name, streamUrl, streamName, locationName: a.locationName };
          });

        if (this.cameras.length === 0) {
          this.cameraError = 'No CCTV camera found for this location.';
        } else if (this.cameras.length === 1) {
          this.selectedCamera = this.cameras[0];
          this.resizeDialog('82vw', '92vh');
        }
      },
      () => {
        this.cameraLoading = false;
        this.cameraError   = 'Failed to fetch camera list.';
      }
    );
  }

  closeVideoPanel() {
    this.showVideo      = false;
    this.cameraError    = '';
    this.cameras        = [];
    this.selectedCamera = null;
    this.destroyStream();
    this.resizeDialog('460px', 'auto');
  }

  selectCamera(cam: CameraAsset) {
    this.destroyStream();
    this.selectedCamera  = cam;
    this.streamError     = '';
    this.elapsedSeconds  = 0;
    this.timeDisplay     = '0:00 / LIVE';
    this.isPlaying       = false;
    this.resizeDialog('82vw', '92vh');
  }

  backToCameraList() {
    this.destroyStream();
    this.selectedCamera = null;
    this.streamError    = '';
    this.resizeDialog('72vw', '88vh');
  }

  // ── WebRTC stream ─────────────────────────────────────────────────────────
  async startStream() {
    if (!this.videoEl || !this.selectedCamera) { return; }

    this.isStreamLoading = true;
    this.streamError     = '';
    const video = this.videoEl.nativeElement;

    try {
      this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

      this.pc.ontrack = event => {
        video.srcObject = event.streams[0];
        this.isStreamLoading = false;
        this.isPlaying       = true;
        this.startProgressTimer();
      };

      this.pc.oniceconnectionstatechange = () => {
        if (this.pc?.iceConnectionState === 'failed' || this.pc?.iceConnectionState === 'disconnected') {
          this.isStreamLoading = false;
          this.streamError = 'Stream connection lost. Please try again.';
        }
      };

      this.pc.addTransceiver('video', { direction: 'recvonly' });
      this.pc.addTransceiver('audio', { direction: 'recvonly' });

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const response = await fetch(this.selectedCamera.streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: offer.sdp,
      });

      if (!response.ok) { throw new Error(`Server responded with ${response.status}`); }

      const result = await response.json();
      if (result.code !== 0) { throw new Error(result.msg || 'Stream server error'); }

      await this.pc.setRemoteDescription({ type: 'answer', sdp: result.sdp });

    } catch (err: any) {
      this.isStreamLoading = false;
      this.streamError = err?.message || 'Failed to connect to camera stream.';
    }
  }

  togglePlay() {
    const video = this.videoEl?.nativeElement;
    if (!video) { return; }
    if (video.paused) { video.play(); this.isPlaying = true; }
    else              { video.pause(); this.isPlaying = false; }
  }

  toggleVolume() {
    const video = this.videoEl?.nativeElement;
    if (!video) { return; }
    video.muted = !video.muted;
    this.isVolumeMuted = video.muted;
  }

  setVolume(event: Event) {
    const video = this.videoEl?.nativeElement;
    if (!video) { return; }
    const val = +(event.target as HTMLInputElement).value;
    video.volume = val / 100;
    this.isVolumeMuted = val === 0;
  }

  toggleFullscreen() {
    const el = this.videoEl?.nativeElement;
    if (!el) { return; }
    if (!document.fullscreenElement) { el.requestFullscreen(); this.isFullscreen = true; }
    else                              { document.exitFullscreen(); this.isFullscreen = false; }
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
    if (this.pc) { this.pc.close(); this.pc = null; }
    if (this.videoEl?.nativeElement) { this.videoEl.nativeElement.srcObject = null; }
    this.videoEl         = null;
    this.isPlaying       = false;
    this.isStreamLoading = false;
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.destroyStream();
  }
}
