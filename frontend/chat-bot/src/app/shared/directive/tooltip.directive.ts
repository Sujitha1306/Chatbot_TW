/*******************************************************************************
 * ======================================================================================================
 *                                     Copyright (C) 2019 Trackerwave Pvt Ltd.
 *                                             All rights reserved
 * ======================================================================================================
 * Notice:  All Rights Reserved.
 * This material contains the trade secrets and confidential business information of Trackerwave Pvt Ltd,
 * which embody substantial creative effort, design, ideas and expressions.  No part of this material may
 * be reproduced or transmitted in any form or by any means, electronic, mechanical, optical or otherwise
 * ,including photocopying and recording, or in connection with any information storage or retrieval
 * system, without written permission.
 *
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System}
 * ======================================================================================================
 ******************************************************************************/
import {
  Directive,
  HostListener,
  Input,
  OnDestroy,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { CommonService } from '../services';

@Directive({
  selector: '[appTooltip]',
})

export class TooltipDirective implements OnDestroy {
  @Input() tooltipType: 'default' | 'sidebar' = 'default';
  @Input() tooltipText = '';
  @Input() placement = 'bottom';
  tooltip: HTMLElement;
  offset = 10;
  public isMouseover = false;
  public isTouchStart = false;
  public isMouseEventType = null;
  public delay = 10;
  public isTouchScreen = ('ontouchstart' in window);

  constructor(private readonly el: ElementRef, private readonly renderer: Renderer2, private commonService: CommonService) {}

  @HostListener('mouseover')
  mouseover() {
    if(!this.isTouchScreen)
    {
      if (this.isMouseEventType === null) {
        this.isMouseover = true;
        this.checkMouseEvent();
      } else {
        this.hideTooltip();
        return;
      }
    }
  }

  @HostListener('mouseout')
  mouseout() {
    if(!this.isTouchScreen)
    {
      this.hideTooltip();
    }
  }

  @HostListener('touchstart.passive')
  touchstart() {
    if (!this.tooltipText) return;
    if(this.isTouchScreen){
      if (this.isMouseEventType === null) {
        this.isTouchStart = true;
        this.checkMouseEvent();
      } else {
        this.hideTooltip();
        this.isTouchStart = true;
        this.checkMouseEvent();
        return;
      }
    }
  }

  
  @HostListener('touchcancel', ['$event'])
  @HostListener('touchend', ['$event'])
  touchend(event: any) {
    if(this.isTouchScreen){
      this.hideTooltip();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: any): void {
    this.checkMouseEvent(event);
  }

  checkMouseEvent(event?: any) {
    if (event) { this.isMouseEventType = event.type; this.hideTooltip() } else { this.isMouseEventType = null; }

    if (this.isMouseover || this.isTouchStart) { this.showTooltip(); return; }
  }

  ngOnDestroy() {
    if (this.tooltip) {
      this.hideTooltip();
      return;
    }
  }

  private showTooltip() {
      if (this.tooltip) {
    return;
  }
    if(this.tooltipText !== '' && this.tooltipText !== null && this.tooltipText !== undefined) {
      this.isMouseover = false;
      this.isTouchStart = false;
      this.tooltip = this.renderer.createElement('span');

      this.renderer.appendChild(
        this.tooltip,
        this.renderer.createText(this.tooltipText)
      );
      this.renderer.appendChild(document.body, this.tooltip);
      const tooltipClass = this.commonService.facilityConfig?.hasOwnProperty('sidebarmenuVersion') && 
      this.commonService.facilityConfig?.sidebarmenuVersion === 2 && this.tooltipType === "sidebar" ? 'tw-new-tooltip': 'tw-tooltip';
      const placementClass =  this.commonService.facilityConfig?.hasOwnProperty('sidebarmenuVersion') && 
      this.commonService.facilityConfig?.sidebarmenuVersion === 2 && this.tooltipType === "sidebar"? `tw-new-tooltip-${this.placement}` : `tw-tooltip-${this.placement}`;
      this.renderer.addClass(this.tooltip, tooltipClass);
      this.renderer.addClass(this.tooltip, placementClass);
      const hostPos = this.el.nativeElement.getBoundingClientRect();
      const tooltipPos = this.tooltip.getBoundingClientRect();
      const scrollPos =
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      let top, left;

      if (this.placement === 'top') {
        top = hostPos.top - tooltipPos.height - this.offset;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
      }

      if (this.placement === 'bottom') {
        top = hostPos.bottom + this.offset;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
      }

      if (this.placement === 'left') {
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.left - tooltipPos.width - this.offset;
      }

      if (this.placement === 'right') {
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.right + this.offset;
      }

      if (this.placement === 'bottom-right'){
        top = hostPos.bottom + this.offset;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 4;
      }

      if (left < 4) {
        left = 4;
      } else if (left + tooltipPos.width > window.innerWidth - 4) {
        left = window.innerWidth - tooltipPos.width - 4;
      }

      this.renderer.setStyle(this.tooltip, 'top', `${top + scrollPos}px`);
      this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
    }
  }

  private hideTooltip() {
    if (!this.tooltip) {
      return;
    }
    this.renderer.removeChild(document.body, this.tooltip);
    this.tooltip = null;
      // this.isMouseover = true;
      this.isMouseEventType = null;
  }
}
