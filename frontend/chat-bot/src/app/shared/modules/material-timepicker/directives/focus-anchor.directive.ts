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
import {AfterViewInit, Directive, ElementRef, Inject, OnDestroy, Optional} from '@angular/core';
import {DOCUMENT} from '@angular/common';

@Directive({
    selector: '[focusAnchor]'
})
export class FocusAnchorDirective implements AfterViewInit, OnDestroy {

    private activeElement: HTMLElement;
    private readonly element: HTMLElement;

    constructor(@Optional() @Inject(DOCUMENT) private readonly document: any,
                elementRef: ElementRef) {
        this.element = elementRef.nativeElement;
    }

    ngAfterViewInit() {
        this.activeElement = <HTMLElement>this.document.activeElement;
        // To avoid an error ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => this.element.focus());
    }

    ngOnDestroy() {
        // To avoid an error ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => this.activeElement.focus());
    }
}
