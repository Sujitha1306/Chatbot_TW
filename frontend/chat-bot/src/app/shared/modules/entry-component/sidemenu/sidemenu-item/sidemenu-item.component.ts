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
import { Component,  Input } from '@angular/core';
import { OvitagComponent } from '../../../../../ovitag/ovitag.component';

@Component({
    selector: 'cdk-sidemenu-item',
    templateUrl: './sidemenu-item.component.html',
    styleUrls: ['./sidemenu-item.component.scss']
})
export class SidemenuItemComponent {

    @Input() menu;
    @Input() iconOnly: boolean;
    @Input() secondaryMenu = false;
    @Input() code: any;
    public innerWidth = window.innerWidth;

    constructor(public ovitag: OvitagComponent) {
    }

    getColor(parentId) {
       
          if (parentId === null) {
            return 'white';
          } else {
            return 'black';
          }
       
      }



    openLink() {
        // SONARQUBE-Remove or correct this useless self-assignment.
        const menu_open = this.menu.open;
        this.menu.open = menu_open;
    }

    checkForChildMenu() {
        // SONARQUBE-Simplify the expression.
        if (this.menu && this.menu.subMenus) {
            return true;
        } else {
            return false;
        }
    }

    selectedNav(menuLink) {
        if (menuLink !== '') {
            alert('linked');

        }
    }

    handleImgError(event: Event) {
        // const imgElement = event.target as HTMLImageElement;
        // imgElement.style.display = 'none';
        const target = event.target as HTMLImageElement;
        target.src = '/assets/Menus/transperant.jpg';
    }
    toggleView() {
        this.ovitag.toggleViewClose();
    }
    fixClick() {
        console.log('')
    }
}
