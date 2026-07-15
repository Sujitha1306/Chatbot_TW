/*******************************************************************************
 * ======================================================================================================
 *                                     Copyright (C) 2026 Trackerwave Pvt Ltd.
 *                                             All rights reserved
 * ======================================================================================================
 ******************************************************************************/

import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonService } from '../../../services/common.service';
import { ConfigurationService } from '../../../services/configuration.service';
import { AppToastService } from '../../../services/toaster.service';

export interface CameraAsset {
  id: number;
  name: string;
  streamUrl: string;
  playUrl?: string;
  streamName: string;
  locationName: string;
}

@Component({
  selector: 'app-notification-alert-popup',
  templateUrl: './notification-alert-popup.component.html',
  styleUrls: ['./notification-alert-popup.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class NotificationAlertPopupComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoEl!: ElementRef<HTMLVideoElement>;

  selectedAlert: any = null;
  allAlerts: any[] = [];
  ruleFilterList: any[] = [];
  groupedAlerts: any[] = [];
  patientDetails: any = null;
  currentTagId: string | null = null;
  locationId: number | null = null;
  realtimeLocation: any = null;
  private pollingSubscription: any = null;

  get isPatientCare(): boolean {
    return (this.selectedAlert?.configName === 'Patient Care') || 
           (this.selectedAlert?.ruleTypeId === 'CE-PC') || 
           (this.selectedAlert?.identifyingType?.toLowerCase() === 'patient');
  }

  isTempAlert(alert: any): boolean {
    if (!alert) return false;
    const cleanMsg = alert.message?.toLowerCase() || '';
    const configName = alert.configName?.toLowerCase() || '';
    return (
      alert.ruleTypeId === 'RU-SE' ||
      cleanMsg.includes('temperature') ||
      cleanMsg.includes('temp') ||
      configName.includes('temperature') ||
      configName.includes('temp') ||
      alert.alertDetails?.some((x: any) => 
        x.identifyingValue === 'DVIT-TEMP' || 
        x.identifyingType?.toLowerCase() === 'temperature' || 
        x.identifyingType?.toLowerCase() === 'sensor'
      )
    );
  }

  isStaffAlert(alert: any): boolean {
    if (!alert) return false;
    const cleanMsg = alert.message?.toLowerCase() || '';
    const configName = alert.configName?.toLowerCase() || '';
    const idType = alert.identifyingType?.toLowerCase() || '';
    const hasStaffKeywords = cleanMsg.includes('staff') || cleanMsg.includes('employee') || cleanMsg.includes('porter') ||
                             configName.includes('staff') || configName.includes('employee') || configName.includes('porter');
    return (
      idType === 'staff' || idType === 'employee' || idType === 'user' || idType === 'porter' ||
      hasStaffKeywords ||
      alert.alertDetails?.some((x: any) => 
        x.identifyingType === 'Staff' || 
        x.identifyingType === 'Employee' || 
        x.identifyingType === 'User' || 
        x.identifyingType === 'Porter'
      )
    );
  }

  isStaffGeoAlert(alert: any): boolean {
    if (!alert) return false;
    const cleanMsg = alert.message?.toLowerCase() || '';
    const isGeo = alert.ruleTypeId === 'RU-GO' || cleanMsg.includes('geo fence') || cleanMsg.includes('geofence');
    return isGeo && this.isStaffAlert(alert);
  }

  isSosAlert(alert: any): boolean {
    if (!alert) return false;
    const cleanMsg = alert.message?.toLowerCase() || '';
    const configName = alert.configName?.toLowerCase() || '';
    const ruleId = alert.ruleTypeId || '';
    const eventCode = alert.eventCode?.toLowerCase() || alert.event?.toLowerCase() || '';
    const hasSosKeywords = cleanMsg.includes('sos') || configName.includes('sos') || ruleId.includes('SO') || ruleId.includes('SOS') || eventCode.includes('so') || eventCode.includes('sos');
    return hasSosKeywords || alert.alertDetails?.some((x: any) => 
      x.identifyingValue === 'CE-SO' || 
      x.identifyingType?.toLowerCase() === 'sos'
    );
  }

  isAidAlert(alert: any): boolean {
    if (!alert) return false;
    const cleanMsg = alert.message?.toLowerCase() || '';
    const configName = alert.configName?.toLowerCase() || '';
    const ruleId = alert.ruleTypeId || '';
    const eventCode = alert.eventCode?.toLowerCase() || alert.event?.toLowerCase() || '';
    const hasAidKeywords = cleanMsg.includes('aid') || configName.includes('aid') || ruleId.includes('AD') || ruleId.includes('AID') || eventCode.includes('ad') || eventCode.includes('aid');
    return hasAidKeywords || alert.alertDetails?.some((x: any) => 
      x.identifyingValue === 'CE-AD' || 
      x.identifyingType?.toLowerCase() === 'aid'
    );
  }

  get isCameraNeeded(): boolean {
    if (this.data?.hideCamera) {
      return false;
    }
    if (this.selectedAlert) {
      if (this.isTempAlert(this.selectedAlert) || this.isStaffGeoAlert(this.selectedAlert)) {
        return false;
      }
    }
    return true;
  }

  // Map view variables
  mapData: any = null;
  isLoadingMap = false;
  contextOptions = {
    show: {
      navbar: false,
      navMenu: false,
      blockSelect: true,
      floorSelect: true,
      searchBox: true,
      navBlkImg: true,
      navBlkContent: true,
      navBlkList: true,
      filterOption: true,
      mobileView: false,
      editable: true,
      header: true
    }
  };

  // Camera view variables
  cameras: CameraAsset[] = [];
  selectedCamera: CameraAsset | null = null;
  isLoadingCamera = false;
  activeView: 'map' | 'camera' | null = null;
  isSidebarCollapsed = false;
  isBannerCollapsed = false;
  layoutType: 'new' | 'old' = 'new';
  isAlertInfoCollapsed = false;
  isMapExpanded = false;
  isCameraExpanded = false;
  isFitToViewActiveBoolean = false;
  fitToViewType: 'map' | 'camera' | null = null;
  get isFitToViewActive(): boolean {
    return this.fitToViewType !== null;
  }

  triggerResize() {
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.triggerResize();
  }

  toggleAlertInfoCollapse() {
    this.isAlertInfoCollapsed = !this.isAlertInfoCollapsed;
    this.triggerResize();
  }

  toggleMapExpand() {
    this.isMapExpanded = !this.isMapExpanded;
    this.isCameraExpanded = false;
    this.triggerResize();
  }

  toggleCameraExpand() {
    this.isCameraExpanded = !this.isCameraExpanded;
    this.isMapExpanded = false;
    this.triggerResize();
  }

  toggleFitToView(type: 'map' | 'camera' = 'map') {
    if (this.fitToViewType === type) {
      this.fitToViewType = null;
    } else {
      this.fitToViewType = type;
      this.isSidebarCollapsed = true;
    }
    this.triggerResize();
  }

  toggleBanner() {
    this.isBannerCollapsed = !this.isBannerCollapsed;
    this.triggerResize();
  }

  // WebRTC player states
  pc: RTCPeerConnection | null = null;
  isPlaying = false;
  isVolumeMuted = false;
  isFullscreen = false;
  timeDisplay = '0:00 / LIVE';
  errorMessage: string | null = null;

  private progressInterval: any;
  private elapsedSeconds = 0;

  // DVR seek bar / rewind playback states
  @ViewChild('seekTrack') seekTrackEl!: ElementRef<HTMLDivElement>;
  seekLeftBound: Date = new Date(new Date().setHours(0, 0, 0, 0));
  seekRightBound: Date = new Date();
  seekNow: Date = new Date();
  private isRulerLive = false;
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

  // TEMP TEST ONLY: no recordings exist for arbitrary drag times yet, so every
  // rewind drag plays this known-good recorded clip instead of the computed
  // start/end. Set to false (or delete) once real recordings are confirmed working.
  private readonly USE_FIXED_TEST_PLAYBACK_URL = false;
  private readonly FIXED_TEST_PLAYBACK_URL =
    'http://104.43.105.163:8087/B1uIIUD61Qld95FkNaFILjB7lVNOuZ/videos/cA4uycwdt1/Lo11pumwpH?start=2026-07-11T00:25:00.000Z&end=2026-07-11T01:00:59.000Z';

  public size = 20;
  public isMore = false;
  public isLoadingMore = false;
  public parsedDetails: any = null;

  remarksForm!: FormGroup;
  isLoading = false;
  currentUserId: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<NotificationAlertPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { selectedAlert: any; allAlerts: any[]; ruleFilterList: any[]; hideCamera?: boolean; hideSidebar?: boolean; patientDetails?: any },
    private readonly commonService: CommonService,
    private readonly configurationService: ConfigurationService,
    public toastr: AppToastService,
    private readonly fb: FormBuilder
  ) {
    this.selectedAlert = data.selectedAlert;
    if (data.patientDetails) {
      this.patientDetails = data.patientDetails;
    }
    this.updateSeekBoundsForAlert();
    if (this.selectedAlert) {
      this.parsedDetails = this.parseAlertMessage(this.selectedAlert.message, this.selectedAlert);
      const locationDetail = this.selectedAlert.alertDetails?.find((x: any) => x.identifyingType === 'Location' || x.identifyingType === 'HomeLocation');
      this.locationId = locationDetail ? Number(locationDetail.identifyingValue) : null;
      if (!this.locationId && this.parsedDetails?.location && /^\d+$/.test(String(this.parsedDetails.location).trim())) {
        this.locationId = Number(this.parsedDetails.location);
      }
      if (this.locationId) {
        this.resolveLocationName(this.locationId, this.selectedAlert.id);
      }
      if (this.selectedAlert.identifyingId && this.parsedDetails?.isInfant && (!this.parsedDetails.name || /^\d+$/.test(this.parsedDetails.name))) {
        this.commonService.getInfantDets(this.selectedAlert.identifyingId).subscribe({
          next: (res) => {
            if (res.results && res.results.length) {
              const name = this.getInfantName(res.results[0]);
              if (name) {
                this.parsedDetails.name = name;
              }
              const alertsData = res.results[0];
              const tagSerialNumber = alertsData.tagSerialNumber === null ? alertsData?.associatedTagSerialNumber : alertsData.tagSerialNumber;
              if (tagSerialNumber && !this.currentTagId) {
                this.currentTagId = tagSerialNumber;
                this.startRealtimeLocationPolling();
              }
            }
          }
        });
      }
    }
    this.currentTagId = this.parsedDetails?.tagId || this.patientDetails?.tagId || this.patientDetails?.tagSerialNumber;
    this.startRealtimeLocationPolling();
    let alertsList = (data.allAlerts || []).filter((alert: any) =>
      alert.ruleTypeId === 'RU-GO' || this.hasEvent(alert.alertDetails) || this.isTempAlert(alert) || this.isStaffGeoAlert(alert) || this.isSosAlert(alert) || this.isAidAlert(alert)
    );
    if (this.patientDetails) {
      const patientId = this.patientDetails.patientId || this.patientDetails.id;
      const patientTag = this.patientDetails.tagId || this.patientDetails.tagSerialNumber;
      alertsList = alertsList.filter((alert: any) => {
        const matchesPatientId = alert.identifyingId === patientId || 
                                 alert.alertDetails?.some((x: any) => (x.identifyingType === 'Patient' || x.identifyingType === 'Infant') && Number(x.identifyingValue) === Number(patientId));
        const matchesTag = patientTag && (
          alert.alertDetails?.some((x: any) => x.identifyingType === 'Tag' && String(x.identifyingValue) === String(patientTag))
        );
        return matchesPatientId || matchesTag;
      });
    }
    this.allAlerts = alertsList;
    this.ruleFilterList = data.ruleFilterList || [];
    this.size = Math.max(20, (data.allAlerts || []).length);
    this.remarksForm = this.fb.group({ comments: [''] });
    if (this.patientDetails) {
      this.isMore = true;
    }
    this.layoutType = (data as any).layoutType || 'new';
    if (this.layoutType === 'new') {
      this.isSidebarCollapsed = true;
      this.loadNewDesignMedia();
    } else {
      if (!this.isCameraNeeded) {
        this.activeView = 'map';
        if (this.selectedAlert) {
          this.loadAlertDetails(this.selectedAlert);
        }
      }
    }
  }

  ngOnInit(): void {
    this.currentUserId = localStorage.getItem('userId');
    if (!this.ruleFilterList.length) {
      this.getRuleFilter();
    } else {
      this.groupAlerts();
    }
    this.seekClockInterval = setInterval(() => {
      this.seekNow = new Date();
      this.updateSeekBounds();
    }, 1000);
  }

  // Ruler always spans a 1-hour window: 30 minutes on either side of its
  // anchor. In live mode the anchor is "now" (rolling window ending at the
  // live edge). Reviewing an alert anchors on the alert's own timestamp
  // instead, capped so the right edge never shows a time in the future.
  private updateSeekBounds() {
    if (this.isRulerLive) {
      this.seekLeftBound = new Date(this.seekNow.getTime() - 30 * 60 * 1000);
      this.seekRightBound = this.seekNow;
      return;
    }
    const center = this.getAlertTime() || this.seekNow;
    this.seekLeftBound = new Date(center.getTime() - 30 * 60 * 1000);
    const naiveRight = new Date(center.getTime() + 30 * 60 * 1000);
    this.seekRightBound = naiveRight.getTime() > this.seekNow.getTime() ? this.seekNow : naiveRight;
  }

  private updateSeekBoundsForAlert() {
    this.isRulerLive = false;
    this.updateSeekBounds();
  }

  getInfantName(infant: any): string | null {
    if (!infant) return null;
    if (infant.patientName && infant.patientName.trim()) return infant.patientName.trim();
    if (infant.fullName && infant.fullName.trim()) return infant.fullName.trim();
    if (infant.name && infant.name.trim()) return infant.name.trim();
    if (infant.firstName && infant.firstName.trim()) {
      const first = infant.firstName.trim();
      const last = infant.lastName ? infant.lastName.trim() : '';
      return last ? `${first} ${last}` : first;
    }
    return null;
  }

  parseAlertMessage(message: string, alert?: any) {
    if (!message) return null;
    const cleanMsg = message.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const isPatientCare = (alert?.configName === 'Patient Care') || 
                          (alert?.ruleTypeId === 'CE-PC') || 
                          (alert?.identifyingType?.toLowerCase() === 'patient');

    const isStaff = this.isStaffAlert(alert);
    const isTemp = this.isTempAlert(alert);

    const isInfant = !isPatientCare && !isStaff && !isTemp && (/infant/i.test(cleanMsg) ||
      (alert?.identifyingType?.toLowerCase() === 'infant') ||
      (alert?.ruleTypeId === 'RU-GO') ||
      (alert?.ruleTypeId === 'RU-NC') ||
      (alert?.alertDetails?.some((x: any) => (x.identifyingType === 'Event'|| x.identifyingType === 'SensorType') && (x.identifyingValue === 'CE-TAM' || x.identifyingValue === 'CE-WRP'||  x.identifyingValue === 'DVIT-TEMP'))));

    const result: any = {
      name: null,
      tagId: null,
      location: null,
      time: null,
      wrongMotherTag: null,
      eventInfo: null,
      description: null,
      isInfant: isInfant,
      isStaff: isStaff,
      additionalDetails: []
    };

    // Specific parser for "Geo Fence Alert" pattern
    if (/geo\s*fence/i.test(cleanMsg)) {
      const tagMatch = cleanMsg.match(/generated\s+for\s+([A-Za-z0-9_-]+)/i);
      const admittedMatch = cleanMsg.match(/Admitted\s+at\s+(.*?)(?:,Trackerwave|\s+Event\s+at)/i);
      const eventLocMatch = cleanMsg.match(/Event\s+at\s+(.*?)\s+Time:/i);
      const timeMatch = cleanMsg.match(/Time:\s*(.*)/i);

      if (tagMatch) result.tagId = tagMatch[1];
      if (admittedMatch) {
        const admLoc = admittedMatch[1].replace(/,?\s*Trackerwave\s*/gi, '').trim();
        result.additionalDetails.push({
          identifyingType: 'Admission Location',
          identifyingValue: admLoc
        });
      }
      if (eventLocMatch) result.location = eventLocMatch[1].trim();
      if (timeMatch) result.time = timeMatch[1].trim();
      result.description = cleanMsg;

      // Extract patient/staff name from message
      const nameMatch = cleanMsg.match(/geo\s*fence\s+alert\s+(?!generated\s+for)(.*?)(?:\s*\(|\s+with\s+tag)/i);
      if (nameMatch && nameMatch[1].trim()) {
        result.name = nameMatch[1].trim();
      }
    }
    // Specific parser for "Tampered from" / "Infant tamper" pattern
    else if (/tamper/i.test(cleanMsg) || /tampered/i.test(cleanMsg)) {
      const tagMatch = cleanMsg.match(/(?:tampered\s+from|tag)\s+(\d+)/i);
      const nameMatch = cleanMsg.match(/tampered\s+from\s+\d+\s*-\s*(.*?)(?:\s+in\s+location|\s+on\s+\d{4}-\d{2}-\d{2}|\s+Time:|$)/i);
      const locMatch = cleanMsg.match(/in\s+location\s+(.*?)(?:\s+on\s+\d{4}-\d{2}-\d{2}|\s+Time:|$)/i);

      result.tagId = tagMatch ? tagMatch[1].trim() : null;
      result.name = nameMatch ? nameMatch[1].trim() : null;
      result.location = locMatch ? locMatch[1].trim() : null;
      result.description = cleanMsg; // Set description to full message for high visibility
    }
    // Standard key-value extraction for standard labels
    else {
      // Define keys we want to extract
      const keys = [
        { id: 'name', labels: [/patient name:/i, /infant name:/i] },
        { id: 'tagId', labels: [/infant tag id:/i, /tag id:/i] },
        { id: 'location', labels: [/location:/i] },
        { id: 'time', labels: [/alert date & time:/i, /time:/i] },
        { id: 'wrongMotherTag', labels: [/wrong mother tag id:/i] }
      ];

      // Find indices of all keys
      const matches: Array<{ id: string; index: number; length: number }> = [];
      keys.forEach(k => {
        k.labels.forEach(labelRegex => {
          const match = cleanMsg.match(labelRegex);
          if (match && match.index !== undefined) {
            matches.push({
              id: k.id,
              index: match.index,
              length: match[0].length
            });
          }
        });
      });

      // Sort matches by index
      matches.sort((a, b) => a.index - b.index);

      // Extract values between matches
      for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const start = current.index + current.length;
        const end = (i + 1 < matches.length) ? matches[i + 1].index : cleanMsg.length;
        let val = cleanMsg.substring(start, end).trim();

        // Clean trailing punctuation
        val = val.replace(/^[:\s–-]+|[,;.\s–-]+$/g, '').trim();
        result[current.id] = val;
      }

      // Capture the prefix as Event Info
      if (matches.length > 0) {
        let prefix = cleanMsg.substring(0, matches[0].index).trim();
        prefix = prefix.replace(/[,;.\s–-]+$/g, '').trim();
        result['eventInfo'] = prefix;
      }

      // Separate description from time if needed
      if (result['time']) {
        const timeVal = result['time'];
        const ampmMatch = timeVal.match(/(.*?(?:AM|PM))(.*)/i);
        if (ampmMatch) {
          result['time'] = ampmMatch[1].trim();
          result['description'] = ampmMatch[2].replace(/^[\s,;–-]+|[\s,;–-]+$/g, '').trim();
        }
      }

      // Separate description from wrongMotherTag if needed
      if (result['wrongMotherTag']) {
        const wmVal = result['wrongMotherTag'];
        const wmMatch = wmVal.match(/^(\d+)(.*)/);
        if (wmMatch) {
          result['wrongMotherTag'] = wmMatch[1];
          if (!result['description'] || result['description'].length < 5) {
            result['description'] = wmMatch[2].replace(/^[\s,;–-]+|[\s,;–-]+$/g, '').trim();
          }
        } else {
          if (!result['description']) {
            result['description'] = wmVal;
          }
          result['wrongMotherTag'] = null;
        }
      }

      // Fallback if no description was parsed
      if (!result['description'] && matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        const start = lastMatch.index + lastMatch.length;
        const val = cleanMsg.substring(start).trim();
        const lastVal = result[lastMatch.id] || '';
        if (lastVal && val.includes(lastVal)) {
          let suffix = val.substring(val.indexOf(lastVal) + lastVal.length).trim();
          suffix = suffix.replace(/^[:\s,;–-]+|[,;.\s–-]+$/g, '').trim();
          result['description'] = suffix;
        }
      }
    }

    // Fallbacks from alertDetails if parsed fields are missing
    if (alert?.alertDetails) {
      const locDetail = alert.alertDetails.find((x: any) => x.identifyingType === 'Location' || x.identifyingType === 'HomeLocation');
      if (locDetail) {
        if (locDetail.identifyingValueName) {
          result.location = locDetail.identifyingValueName;
        } else if (!result.location || /^\d+$/.test(String(result.location).trim())) {
          result.location = locDetail.identifyingValue;
        }
      }
      if (!result.tagId) {
        const tagDetail = alert.alertDetails.find((x: any) => x.identifyingType === 'Tag');
        if (tagDetail) {
          result.tagId = tagDetail.identifyingValue;
        }
      }
      if (!result.name) {
        const patientDetail = alert.alertDetails.find((x: any) => x.identifyingType === 'Patient' || x.identifyingType === 'Infant');
        if (patientDetail) {
          result.name = patientDetail.identifyingValueName || patientDetail.identifyingValue;
        }
      }
    }

    if (!result.time && alert?.sentDatetime) {
      result.time = alert.sentDatetime;
    }

    if (!result.description) {
      result.description = cleanMsg || alert?.configName || 'Alert Details';
    }

    // Capture additional structured fields
    const primaryTypes = ['Tag', 'Location', 'HomeLocation', 'Patient', 'Infant'];
    const extraDetails = alert?.alertDetails?.filter((x: any) =>
      !primaryTypes.includes(x.identifyingType) &&
      x.identifyingType !== 'Event' &&
      x.identifyingType?.toLowerCase() !== 'sensortype' &&
      x.identifyingType?.toLowerCase() !== 'sensor type'
    ).map((x: any) => ({
      identifyingType: x.identifyingType,
      identifyingValue: x.identifyingValueName || x.identifyingValue
    })) || [];

    result.additionalDetails = [...(result.additionalDetails || []), ...extraDetails];

    return result;
  }

  onScroll(event: any) {
    const el = event.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 15) {
      this.loadMoreAlerts();
    }
  }

  loadMoreAlerts() {
    if (this.isLoadingMore || this.isMore) return;
    this.isLoadingMore = true;

    const userId = parseInt(localStorage.getItem(btoa('userId')) || '0');
    if (!userId) {
      this.isLoadingMore = false;
      return;
    }

    this.size += 20;

    this.commonService.getAllNotifications(userId, 0, this.size, false, null, null, 'AT-AL', null, null).subscribe({
      next: (res: any) => {
        this.isLoadingMore = false;
        if (res?.results) {
          let fetchedAlerts = res.results.filter((alert: any) =>
            alert.ruleTypeId === 'RU-GO' || this.hasEvent(alert.alertDetails) || this.isTempAlert(alert) || this.isStaffGeoAlert(alert) || this.isSosAlert(alert) || this.isAidAlert(alert)
          );

          if (this.patientDetails) {
            const patientId = this.patientDetails.patientId || this.patientDetails.id;
            const patientTag = this.patientDetails.tagId || this.patientDetails.tagSerialNumber;
            fetchedAlerts = fetchedAlerts.filter((alert: any) => {
              const matchesPatientId = alert.identifyingId === patientId || 
                                       alert.alertDetails?.some((x: any) => (x.identifyingType === 'Patient' || x.identifyingType === 'Infant') && Number(x.identifyingValue) === Number(patientId));
              const matchesTag = patientTag && (
                alert.alertDetails?.some((x: any) => x.identifyingType === 'Tag' && String(x.identifyingValue) === String(patientTag))
              );
              return matchesPatientId || matchesTag;
            });
          }

          this.isMore = res.results.length >= res.totalRecords;
          this.allAlerts = fetchedAlerts;
          this.groupAlerts();
        }
      },
      error: () => {
        this.isLoadingMore = false;
      }
    });
  }

  getRuleFilter() {
    this.configurationService.getAllPfRules().subscribe({
      next: (res) => {
        this.ruleFilterList = res.results || [];
        this.groupAlerts();
      },
      error: () => {
        this.groupAlerts();
      }
    });
  }

  groupAlerts() {
    const groups: { [key: string]: any } = {};

    this.allAlerts.forEach(alert => {
      const ruleId = alert.ruleTypeId || 'Others';
      const rule = this.ruleFilterList.find(r => r.ruleTypeId === ruleId);

      let groupName = 'General Alerts';
      if (rule) {
        groupName = rule.ruleName;
      } else if (alert.notiIdentifyingType === 'notification') {
        groupName = 'Messages';
      }

      if (!groups[groupName]) {
        groups[groupName] = {
          name: groupName,
          ruleTypeId: ruleId,
          alerts: [],
          expanded: false
        };
      }
      groups[groupName].alerts.push(alert);
    });

    this.groupedAlerts = Object.values(groups);

    // Expand the group that has the currently selected alert
    const selectedGroup = this.groupedAlerts.find(g => g.alerts.some((a: any) => a.id === this.selectedAlert.id));
    if (selectedGroup) {
      selectedGroup.expanded = true;
    }
  }

  selectAlert(alert: any) {
    if (this.selectedAlert?.id === alert.id) return;
    this.selectedAlert = alert;
    this.updateSeekBoundsForAlert();
    this.parsedDetails = this.parseAlertMessage(alert.message, alert);
    const locationDetail = alert.alertDetails?.find((x: any) => x.identifyingType === 'Location' || x.identifyingType === 'HomeLocation');
    this.locationId = locationDetail ? Number(locationDetail.identifyingValue) : null;
    if (!this.locationId && this.parsedDetails?.location && /^\d+$/.test(String(this.parsedDetails.location).trim())) {
      this.locationId = Number(this.parsedDetails.location);
    }
    if (this.locationId) {
      this.resolveLocationName(this.locationId, alert.id);
    }
    this.isBannerCollapsed = false; // Expand details banner when selecting a new alert
    this.activeView = this.isCameraNeeded ? null : 'map'; // Default to map if camera not needed
    this.mapData = null;
    this.cameras = [];
    this.selectedCamera = null;
    this.destroyStream();
    if (this.remarksForm) {
      this.remarksForm.patchValue({ comments: '' });
    }

    this.stopRealtimeLocationPolling();
    this.realtimeLocation = null;

    if (alert.identifyingId && this.parsedDetails?.isInfant && (!this.parsedDetails.name || /^\d+$/.test(this.parsedDetails.name))) {
      this.commonService.getInfantDets(alert.identifyingId).subscribe({
        next: (res) => {
          if (res.results && res.results.length) {
            const name = this.getInfantName(res.results[0]);
            if (name) {
              this.parsedDetails.name = name;
            }
            const alertsData = res.results[0];
            const tagSerialNumber = alertsData.tagSerialNumber === null ? alertsData?.associatedTagSerialNumber : alertsData.tagSerialNumber;
            if (tagSerialNumber && !this.currentTagId) {
              this.currentTagId = tagSerialNumber;
              this.startRealtimeLocationPolling();
            }
          }
        }
      });
    }
    this.currentTagId = this.parsedDetails?.tagId;
    this.startRealtimeLocationPolling();
    if (this.layoutType === 'new') {
      this.loadNewDesignMedia();
    } else {
      if (this.activeView === 'map') {
        this.loadAlertDetails(alert);
      }
    }
  }

  loadNewDesignMedia() {
    if (this.selectedAlert) {
      this.loadAlertDetails(this.selectedAlert);
      if (this.isCameraNeeded) {
        const locationDetail = this.selectedAlert.alertDetails?.find((x: any) => x.identifyingType === 'Location' || x.identifyingType === 'HomeLocation');
        const locationId = locationDetail ? Number(locationDetail.identifyingValue) : null;
        if (locationId) {
          this.loadCameraDetails(locationId);
        }
      }
    }
  }

  resolveLocationName(locationId: number, alertId: number) {
    this.commonService.getLocationById(locationId).subscribe({
      next: (res: any) => {
        if (res && res.results && this.selectedAlert && this.selectedAlert.id === alertId) {
          const locName = res.results.fullName || res.results.name || res.results.locationName;
          if (locName) {
            if (this.parsedDetails) {
              this.parsedDetails.location = locName;
              this.parsedDetails.locationName = locName;
            }
          }
        }
      }
    });
  }

  loadMapByLocationId(locationId: number, tagId: string | null, tagType: string) {
    this.isLoadingMap = true;
    this.commonService.getLocationById(locationId).subscribe({
      next: (roomRes: any) => {
        if (roomRes?.results) {
          const locType = roomRes.results.locationTypeId;
          if (locType === 3) {
            // It is already a Floor!
            const floorId = locationId;
            const blockId = roomRes.results.parentId || null;
            this.isLoadingMap = false;
            this.mapData = {
              selectedFloor: Number(floorId),
              selectedBlock: Number(blockId) || null,
              tagId: tagId,
              tagType: tagType,
              selectedLoc: null, // No specific room centering is needed
              reqDetail: null,
              reqType: 'globalSearch',
              type: 'popup'
            };
          } else {
            // It is a Room/Zone, so query parent Floor
            const floorId = roomRes.results.parentId;
            if (floorId) {
              this.commonService.getLocationById(floorId).subscribe({
                next: (floorRes: any) => {
                  const blockId = floorRes?.results?.parentId || null;
                  this.isLoadingMap = false;
                  this.mapData = {
                    selectedFloor: Number(floorId),
                    selectedBlock: Number(blockId) || null,
                    tagId: tagId,
                    tagType: tagType,
                    selectedLoc: locationId,
                    reqDetail: null,
                    reqType: 'globalSearch',
                    type: 'popup'
                  };
                },
                error: () => {
                  this.isLoadingMap = false;
                  this.mapData = this.getFallbackMapData(this.selectedAlert, tagId, tagType, locationId);
                }
              });
            } else {
              this.isLoadingMap = false;
              this.mapData = this.getFallbackMapData(this.selectedAlert, tagId, tagType, locationId);
            }
          }
        } else {
          this.isLoadingMap = false;
          this.mapData = this.getFallbackMapData(this.selectedAlert, tagId, tagType, locationId);
        }
      },
      error: () => {
        this.isLoadingMap = false;
        this.mapData = this.getFallbackMapData(this.selectedAlert, tagId, tagType, locationId);
      }
    });
  }

  loadAlertDetails(alert: any) {
    this.isLoadingMap = true;
    this.mapData = null;

    const locationDetail = alert.alertDetails?.find((x: any) => x.identifyingType === 'Location' || x.identifyingType === 'HomeLocation');
    const locationId = locationDetail ? Number(locationDetail.identifyingValue) : null;
    const tagDetail = alert.alertDetails?.find((x: any) => x.identifyingType === 'Tag');
    let tagId = tagDetail ? tagDetail.identifyingValue : null;

    if (this.isTempAlert(alert)) {
      tagId = null;
    } else if (!tagId) {
      tagId = this.currentTagId || this.parsedDetails?.tagId || null;
    }

    // Determine tag type dynamically
    let tagType = 'TAT-PA';
    const idType = alert.identifyingType?.toLowerCase();
    if (this.isStaffAlert(alert)) {
      tagType = 'TAT-US';
    } else if (idType === 'infant' || alert.ruleTypeId === 'RU-GO') {
      tagType = 'TAT-IN';
    } else if (idType === 'asset' || alert.alertDetails?.some((x: any) => x.identifyingType === 'Asset') || this.isTempAlert(alert)) {
      tagType = 'TAT-AS';
    }

    if (tagId) {
      // Use the totaltimebylocv2 report API to get the dynamic current location & floor (like Global Search)
      const param = '/cloc=1';
      this.commonService.getReportData('totaltimebylocv2', param).subscribe({
        next: (res: any) => {
          if (res?.results?.statusCode == 200 && res?.results?.data?.length) {
            const locInfo = res.results.data.find((item: any) => String(item.tagid) === String(tagId) || String(item.tagId) === String(tagId));
            if (locInfo && locInfo.floor_id) {
              this.isLoadingMap = false;
              this.mapData = {
                selectedFloor: parseInt(locInfo.floor_id),
                selectedBlock: locInfo.blockId || locInfo.block_id || null,
                tagId: tagId,
                tagType: tagType,
                selectedLoc: locationId,
                reqDetail: null,
                reqType: 'globalSearch',
                type: 'popup'
              };
              return;
            }
          }
          if (locationId) {
            this.loadMapByLocationId(locationId, tagId, tagType);
          } else {
            if (this.parsedDetails?.isInfant) {
              this.fallbackToInfantDets(alert, tagId, tagType, locationId);
            } else {
              this.isLoadingMap = false;
              this.mapData = this.getFallbackMapData(alert, tagId, tagType, locationId);
            }
          }
        },
        error: () => {
          if (locationId) {
            this.loadMapByLocationId(locationId, tagId, tagType);
          } else {
            if (this.parsedDetails?.isInfant) {
              this.fallbackToInfantDets(alert, tagId, tagType, locationId);
            } else {
              this.isLoadingMap = false;
              this.mapData = this.getFallbackMapData(alert, tagId, tagType, locationId);
            }
          }
        }
      });
    } else if (locationId) {
      this.loadMapByLocationId(locationId, tagId, tagType);
    } else {
      if (this.parsedDetails?.isInfant) {
        this.fallbackToInfantDets(alert, null, tagType, locationId);
      } else {
        this.isLoadingMap = false;
        this.mapData = this.getFallbackMapData(alert, null, tagType, locationId);
      }
    }
  }

  fallbackToInfantDets(alert: any, tagId: string | null, tagType: string, locationId: number | null) {
    if (alert.identifyingId) {
      this.commonService.getInfantDets(alert.identifyingId).subscribe({
        next: (res) => {
          this.isLoadingMap = false;
          if (res.results && res.results.length) {
            const alertsData = res.results[0];
            this.patientDetails = alertsData;
            alertsData['currentLocationId'] = alertsData['currentLocationId'] ? alertsData['currentLocationId'] : locationId;
            alertsData['tagTypeId'] = alertsData?.tagAssociationTypeId;
            alertsData['tagSerialNumber'] = alertsData.tagSerialNumber === null ? alertsData?.associatedTagSerialNumber : alertsData.tagSerialNumber;

            const finalTagId = alertsData.tagSerialNumber || tagId;
            const finalLocationId = alertsData.currentLocationId || alertsData.locationId || locationId;
            if (finalLocationId) {
              this.loadMapByLocationId(finalLocationId, finalTagId, tagType);
            } else if (finalTagId) {
              const param = '/cloc=1';
              this.commonService.getReportData('totaltimebylocv2', param).subscribe({
                next: (reportRes: any) => {
                  this.isLoadingMap = false;
                  if (reportRes?.results?.statusCode == 200 && reportRes?.results?.data?.length) {
                    const locInfo = reportRes.results.data.find((item: any) =>
                      (finalTagId && (String(item.tagid) === String(finalTagId) || String(item.tagId) === String(finalTagId))) ||
                      (alert?.identifyingId && String(item.tag_value) === String(alert.identifyingId))
                    );
                    if (locInfo) {
                      this.mapData = {
                        selectedFloor: parseInt(locInfo.floor_id),
                        selectedBlock: locInfo.blockId || locInfo.block_id || null,
                        tagId: finalTagId,
                        tagType: alertsData.tagAssociationTypeId || tagType,
                        selectedLoc: finalLocationId,
                        reqDetail: null,
                        reqType: 'globalSearch',
                        type: 'popup'
                      };
                    } else {
                      this.mapData = {
                        selectedFloor: parseInt(alertsData.floorId),
                        selectedBlock: alertsData.blockId,
                        tagId: finalTagId,
                        tagType: alertsData.tagAssociationTypeId || tagType,
                        selectedLoc: finalLocationId,
                        reqDetail: null,
                        reqType: 'globalSearch',
                        type: 'popup'
                      };
                    }
                  } else {
                    this.mapData = {
                      selectedFloor: parseInt(alertsData.floorId),
                      selectedBlock: alertsData.blockId,
                      tagId: finalTagId,
                      tagType: alertsData.tagAssociationTypeId || tagType,
                      selectedLoc: finalLocationId,
                      reqDetail: null,
                      reqType: 'globalSearch',
                      type: 'popup'
                    };
                  }
                },
                error: () => {
                  this.isLoadingMap = false;
                  this.mapData = {
                    selectedFloor: parseInt(alertsData.floorId),
                    selectedBlock: alertsData.blockId,
                    tagId: finalTagId,
                    tagType: alertsData.tagAssociationTypeId || tagType,
                    selectedLoc: finalLocationId,
                    reqDetail: null,
                    reqType: 'globalSearch',
                    type: 'popup'
                  };
                }
              });
            } else {
              this.isLoadingMap = false;
              this.mapData = {
                selectedFloor: null,
                selectedBlock: null,
                tagId: null,
                tagType: tagType,
                selectedLoc: alertsData.currentLocationId,
                reqDetail: null,
                reqType: 'globalSearch',
                type: 'popup'
              };
            }
          } else {
            this.isLoadingMap = false;
            this.mapData = this.getFallbackMapData(alert, tagId, tagType, locationId);
          }
        },
        error: () => {
          this.isLoadingMap = false;
          this.mapData = this.getFallbackMapData(alert, tagId, tagType, locationId);
        }
      });
    } else {
      this.isLoadingMap = false;
      this.mapData = this.getFallbackMapData(alert, tagId, tagType, locationId);
    }
  }

  getFallbackMapData(alert: any, tagId: string | null, tagType: string, locationId: number | null) {
    return {
      selectedFloor: null,
      selectedBlock: null,
      tagId: tagId,
      tagType: tagType,
      selectedLoc: locationId,
      reqDetail: null,
      reqType: 'globalSearch',
      type: 'popup'
    };
  }

  loadCameraDetails(locationId: number | null) {
    this.cameras = [];
    this.selectedCamera = null;
    this.destroyStream();
    this.errorMessage = null;

    if (!locationId) return;

    this.isLoadingCamera = true;
    this.commonService.getConnectivityAssets(locationId).subscribe({
      next: (res: any) => {
        this.isLoadingCamera = false;
        const results = res?.results || [];
        const cctvAssets = results.filter((item: any) => item.assetTypeId === 'AT-CCTV');

        this.cameras = cctvAssets.reduce((acc: any[], item: any) => {
          try {
            const outputData = JSON.parse(item.outputDate);
            const streamUrl = outputData?.streamUrl;
            if (streamUrl) {
              acc.push({
                id: item.id,
                name: item.name,
                streamUrl,
                playUrl: outputData?.playUrl,
                streamName: outputData?.streamName || item.name,
                locationName: item.locationName || ''
              });
            }
          } catch (e) {
            // ignore malformed
          }
          return acc;
        }, []);

        if (this.cameras.length > 0) {
          this.selectedCamera = this.cameras[0];
          if (this.activeView === 'camera' || this.layoutType === 'new') {
            setTimeout(() => this.startInitialPlayback(), 100);
          }
        }
      },
      error: () => {
        this.isLoadingCamera = false;
      }
    });
  }

  showDetails() {
    this.activeView = null;
    this.isBannerCollapsed = false;
    this.destroyStream();
  }

  setView(view: 'map' | 'camera') {
    if (this.activeView === view) return;
    this.activeView = view;
    this.isBannerCollapsed = true; // Automatically collapse details banner when map or camera is selected
    if (view === 'map') {
      this.destroyStream();
      if (this.selectedAlert && !this.mapData) {
        this.loadAlertDetails(this.selectedAlert);
      }
      this.triggerResize();
    } else if (view === 'camera') {
      this.destroyStream();
      if (this.selectedAlert && !this.cameras.length) {
        const locationDetail = this.selectedAlert.alertDetails?.find((x: any) => x.identifyingType === 'Location' || x.identifyingType === 'HomeLocation');
        const locationId = locationDetail ? Number(locationDetail.identifyingValue) : null;
        this.loadCameraDetails(locationId);
      } else {
        setTimeout(() => this.startInitialPlayback(), 100);
      }
    }
  }

  selectCamera(camera: CameraAsset) {
    this.destroyStream();
    this.selectedCamera = camera;
    this.errorMessage = null;
    this.elapsedSeconds = 0;
    this.timeDisplay = '0:00 / LIVE';
    this.isPlaying = false;
    setTimeout(() => this.startInitialPlayback(), 100);
  }

  async startStream() {
    if (!this.videoEl || !this.selectedCamera) return;

    this.errorMessage = null;
    const video = this.videoEl.nativeElement;

    try {
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      this.pc.ontrack = (event) => {
        video.srcObject = event.streams[0];
        this.isPlaying = true;
        this.startProgressTimer();
      };

      this.pc.oniceconnectionstatechange = () => {
        if (this.pc?.iceConnectionState === 'failed' || this.pc?.iceConnectionState === 'disconnected') {
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
        throw new Error(result.msg || 'Stream server returned error');
      }

      await this.pc.setRemoteDescription({ type: 'answer', sdp: result.sdp });
    } catch (err: any) {
      this.errorMessage = err?.message || 'Failed to connect to the camera stream.';
    }
  }

  togglePlay() {
    const video = this.videoEl?.nativeElement;
    if (!video) return;
    if (video.paused) {
      video.play();
      this.isPlaying = true;
    } else {
      video.pause();
      this.isPlaying = false;
    }
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

  // True whenever the ruler's right edge is actually tracking real time right
  // now - either because we explicitly went live, or because we're reviewing
  // an alert recent enough that its +30min cap hasn't been reached yet.
  private isRightEdgeLive(): boolean {
    return this.seekNow.getTime() - this.seekRightBound.getTime() < 1000;
  }

  private onSeekRelease() {
    const target = this.dragPreviewTime;
    this.endSeekDrag();
    if (!target) return;

    const nearLiveMs = 15 * 1000;
    if (this.isRightEdgeLive() && this.seekRightBound.getTime() - target.getTime() <= nearLiveMs) {
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

  private getAlertTime(): Date | null {
    const raw = this.selectedAlert?.sentDatetime;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  async startInitialPlayback() {
    const alertTime = this.getAlertTime();
    if (alertTime && this.selectedCamera && (this.USE_FIXED_TEST_PLAYBACK_URL || this.selectedCamera.playUrl)) {
      const start = new Date(alertTime.getTime() - 10 * 60 * 1000);
      const naiveEnd = new Date(start.getTime() + 30 * 60 * 1000);
      const end = naiveEnd.getTime() > this.seekRightBound.getTime() ? this.seekRightBound : naiveEnd;
      await this.playFromTimestamp(start, end);
    } else {
      this.startStream();
    }
  }

  // Reciprocal of goLive(): jump back from the live feed to the recorded
  // clip around this alert's own timestamp - re-anchors the ruler back to
  // the alert window (it drifted to a rolling live window while live).
  async viewAlertRecording() {
    this.updateSeekBoundsForAlert();
    await this.startInitialPlayback();
  }

  async playFromTimestamp(start: Date, end: Date = new Date()): Promise<boolean> {
    const video = this.videoEl?.nativeElement;
    if (!video || !this.selectedCamera) return false;

    if (!this.USE_FIXED_TEST_PLAYBACK_URL && !this.selectedCamera.playUrl) {
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
    const listUrl = this.USE_FIXED_TEST_PLAYBACK_URL
      ? this.FIXED_TEST_PLAYBACK_URL
      : this.buildPlaybackUrl(this.selectedCamera.playUrl!, queryStart, end);

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
      // Reached the end of what we fetched. Only jump to the live feed if
      // we've actually caught up to real time - otherwise (an alert whose
      // window is already fully in the past) just stop on the last frame.
      if (this.isRightEdgeLive()) {
        this.goLive();
      } else {
        this.isPlaying = false;
      }
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
    this.isRulerLive = true;
    this.updateSeekBounds();
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

  closeDialog() {
    this.dialogRef.close();
  }

  stripHtml(html: string): string {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || "").trim();
  }

  hasEvent(alertDetails: any[]): boolean {
    return alertDetails?.some(item => item.identifyingType === 'Event'|| item.identifyingType === 'SensorType' && (item.identifyingValue === 'CE-TAM' || item.identifyingValue === 'CE-WRP' || item.identifyingValue === 'DVIT-TEMP'));
  }

  onCancelAlert() {
    const alertId = this.selectedAlert?.id;
    if (!alertId) { return; }

    this.isLoading = true;
    const payload = {
      ids: [alertId],
      comments: this.remarksForm.value.comments || '',
      closedById: parseInt(this.currentUserId || '0', 10),
    };
    this.commonService.cancelAlert(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.statusCode === 1) {
          this.toastr.success('Success', res.message);
          this.dialogRef.close('confirm');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastr.error('Error', err?.error?.message || 'Something went wrong');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyStream();
    this.stopRealtimeLocationPolling();
    this.triggerResize();
    clearInterval(this.seekClockInterval);
  }

  startRealtimeLocationPolling() {
    this.stopRealtimeLocationPolling();
    if (!this.isPatientCare) {
      return;
    }
    if (!this.currentTagId && (!this.selectedAlert || !this.selectedAlert.identifyingId)) {
      return;
    }

    this.fetchRealtimeLocation();

    this.pollingSubscription = setInterval(() => {
      this.fetchRealtimeLocation();
    }, 10000);
  }

  stopRealtimeLocationPolling() {
    if (this.pollingSubscription) {
      clearInterval(this.pollingSubscription);
      this.pollingSubscription = null;
    }
  }

  fetchRealtimeLocation() {
    const locId = this.locationId || 0;
    const param = '/cloc=1';
    this.commonService.getReportData('totaltimebylocv2', param).subscribe({
      next: (res: any) => {
        if (res?.results?.statusCode == 200 && res?.results?.data?.length) {
          const locInfo = res.results?.data.filter(res => res.location_id === locId);
          // const locInfo = res.results?.data
          if (locInfo) {
            this.realtimeLocation = locInfo;
          }
        }
      },
      error: () => {
        // Safe fail
      }
    });
  }

  formatDuration(seconds: any): string {
    if (!seconds) return '';
    const secs = Number(seconds);
    if (isNaN(secs)) return String(seconds);
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  }
}
