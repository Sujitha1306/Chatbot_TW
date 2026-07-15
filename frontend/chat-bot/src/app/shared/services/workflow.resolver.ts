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
import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable,  } from 'rxjs';

import { CommonService, ConfigurationService, WorkflowService } from '../../shared';
import { CookieService } from 'ngx-cookie-service';

/*

Description : Workflow Modules implemented the resolver functionality.
Date        : May 13, 2021
Author      : TrackerWave
Developer   : Venkatesh Raju

*/

@Injectable()
export class AssetManagementResolver implements Resolve<Observable<any>> {
    constructor(private readonly workflowService: WorkflowService) {}

    resolve(): Observable<any> {
        return this.workflowService.getAssetLocationDetails(null,0,50,null,null,null,null,null,null,null);
    }
}

@Injectable()
export class ConsumerResolver implements Resolve<Observable<any>> {
    constructor(private readonly workflowService: WorkflowService, private readonly commonService: CommonService) {}

    resolve(): Observable<any> {
        return this.commonService.getAllConsumers();
    }
}

@Injectable()
export class EmployeeResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public fromDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly workflowService: WorkflowService,  public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.workflowService.getEmployeeList('CS-AL', this.fromDate);
    }
}

@Injectable()
export class HealthCheckupResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly workflowService: WorkflowService, private readonly commonService: CommonService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.commonService.getHcPatientList(this.selectedDate);
    }
}

@Injectable()
export class InfantResolver implements Resolve<Observable<any>> {
    constructor(private readonly workflowService: WorkflowService, public commonService: CommonService) {
        this.commonService.validateUserPreference('infantWardFilter');
    }

    resolve(): Observable<any> {
            let includeHierarchy = true;
            if (this.commonService.userPreference !== null && this.commonService.userPreference.hasOwnProperty('infantWardFilter')) {
              const locationId = this.commonService.userPreference.infantWardFilter.value.includes('All') ? '' : JSON.parse(this.commonService.userPreference.infantWardFilter.value);
              return this.workflowService.getAllMother(locationId, null, includeHierarchy);
            }
         else {
            return this.workflowService.getAllMother('', null, includeHierarchy);
        }
    }
}

@Injectable()
export class IPResolver implements Resolve<Observable<any>> {
    constructor(private readonly workflowService: WorkflowService) {}

    resolve(): Observable<any> {
        return this.workflowService.getInpatientList('', 'All', null, null, 0, 50);
    }
}

@Injectable()
export class StaffResolver implements Resolve<Observable<any>> {
    constructor(private readonly workflowService: WorkflowService) {}

    resolve(): Observable<any> {
        return this.workflowService.getStaffRoutineList('UT_STAFF',null,0,50);
    }
}

@Injectable()
export class StudentResolver implements Resolve<Observable<any>> {
    constructor(private readonly workflowService: WorkflowService) {}

    resolve(): Observable<any> {
        return this.workflowService.getStaffRoutineList('UT_STUDENT',null,0,50);
    }
}

@Injectable()
export class ResidentResolver implements Resolve<Observable<any>> {
    constructor(private readonly workflowService: WorkflowService) {}

    resolve(): Observable<any> {
        return this.workflowService.getInpatientList('', 'All', 'VT-RE');
    }
}

@Injectable()
export class MonitorResolver implements Resolve<Observable<any>> {
    constructor(private readonly workflowService: WorkflowService) {}

    resolve(): Observable<any> {
        return this.workflowService.getMonitor();
    }
}

@Injectable()
export class DayCareResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly workflowService: WorkflowService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.workflowService.getInpatientList('', 'All', 'VT-DC', this.selectedDate);
    }
}

@Injectable()
export class MedicalResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly workflowService: WorkflowService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.workflowService.getMedicalRecordList('MR-REQ', null, this.selectedDate, null, null);
    }
}

@Injectable()
export class TaskResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    public statusFilter = null;
    public contexFilter = null;
    public depatmentId = localStorage.getItem('ZGVwYXJ0bWVudElk');
    constructor(private readonly workflowService: WorkflowService, private readonly commonService: CommonService, public datepipe: DatePipe) {
        if (this.commonService.userPreference && this.commonService.userPreference.hasOwnProperty('taskFilter')) {
            let preferenceData = this.commonService.userPreference.taskFilter.value;
            preferenceData = JSON.parse(preferenceData)
            this.statusFilter = preferenceData.status;
            this.contexFilter = preferenceData.context;
        }
    }

    resolve(): Observable<any> {
        if(this.depatmentId === 'null'){
            this.depatmentId = null;
        }
        return this.workflowService.getAllTask(null, this.selectedDate, this.contexFilter, this.statusFilter, this.depatmentId,null, null, 'RQT-TASK', null,null,'0', '50');
    }
}

@Injectable()
export class OPResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly workflowService: WorkflowService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.workflowService.getOpPatientList(this.selectedDate);
    }
}

@Injectable()
export class OTResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly workflowService: WorkflowService, private readonly commonService: CommonService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.commonService.getHcPatientList(this.selectedDate, 'HP-OT',null);
    }
}

@Injectable()
export class EmergencyCareResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly workflowService: WorkflowService, private readonly commonService: CommonService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.commonService.getHcPatientList(this.selectedDate, 'HP-EC');
    }
}

@Injectable()
export class MessageCentreResolver implements Resolve<Observable<any>> {
    constructor(private readonly workflowService: WorkflowService, private readonly commonService: CommonService) {}

    resolve(): Observable<any> {
        return this.commonService.getCoasterMessage();
    }
}

@Injectable()
export class PorterResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    public requestStatus = ['RQ-AR', 'RQ-AS', 'RQ-CA', 'RQ-CR', 'RQ-HLD', 'RQ-IP', 'RQ-NR', 'RQ-NS', 'RQ-PLN', 'RQ-RCR', 'RQ-RJ', 'RQ-RTN', 'RQ-SH', 'RQ-WT'];
    public porterGroup = [];
    constructor(private readonly workflowService: WorkflowService, private readonly commonService: CommonService, public datepipe: DatePipe, private readonly cookieService: CookieService) {}

    resolve(): Observable<any> {
        if(this.cookieService.get('porter_group_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) == null ||
        this.cookieService.get('porter_group_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))) === '') {
            this.commonService.getAppTerms('PoolName').subscribe(res => {
                this.porterGroup = [...res.results.map(item => item.code),0];
            });
        } else {
          this.porterGroup = JSON.parse(this.cookieService.get('porter_group_' + localStorage.getItem(btoa('facilityId')) + '_' + localStorage.getItem(btoa('userId'))));
        }
        return this.commonService.getPorterRequest(this.selectedDate, true, null, this.requestStatus, null, null, this.porterGroup);
    }
}

@Injectable()
export class TempIdCardResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly workflowService: WorkflowService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.workflowService.getTempIdCardList(this.selectedDate);
    }
}

@Injectable()
export class VisitorResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly workflowService: WorkflowService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.workflowService.getVisitorsList(this.selectedDate,0,50,null);
    }
}

@Injectable()
export class AmbulanceResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    public requestStatus = ['RQ-CO', 'RQ-AR', 'RQ-AS', 'RQ-CA', 'RQ-CR', 'RQ-HLD', 'RQ-IP', 'RQ-NR', 'RQ-PLN', 'RQ-RJ', 'RQ-SH', 'RQ-WT'];
    constructor(private readonly commonService: CommonService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.commonService.getPorterRequest(this.selectedDate, false, null, this.requestStatus, 'RQT-AMB', localStorage.getItem('customerId'));
    }
}

@Injectable()
export class FormResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public fromDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly commonService: CommonService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.commonService.getWorkflowFrom(this.fromDate,'All','All');
    }
}

@Injectable()
export class TicketResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly commonService: CommonService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.commonService.getTicketRequest(this.selectedDate, 'RQT-TKT');
    }
}

@Injectable()
export class HazmatTrainingResolver implements Resolve<Observable<any>> {
    public currentDate: any = new Date();
    public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
    constructor(private readonly workflowService: WorkflowService, public datepipe: DatePipe) {}

    resolve(): Observable<any> {
        return this.workflowService.getTaskDetails(this.selectedDate, false, false, false, false,'0','50', 'All', null, null, null, true);
    }
}

@Injectable()
export class ItemMasterResolver implements Resolve<Observable<any>> {
  constructor(private readonly workflowService: WorkflowService) {}
  resolve(): Observable<any> {
    return this.workflowService.getAllIterm();
  }
}

@Injectable()
export class SupplierResolver implements Resolve<Observable<any>> {
    public start = 0;
    public size = 10;
  constructor(private readonly workflowService: WorkflowService) {}
  resolve(): Observable<any> {
    return this.workflowService.getAllSupplier(this.size, this.start, '');
  }
}

@Injectable()
export class InventoryResolver implements Resolve<Observable<any>> {
    public start = 0;
    public size = 10;
  constructor(private readonly workflowService: WorkflowService) {}
  resolve(): Observable<any> {
    return this.workflowService.getAllInventory(this.start, this.size);
  }
}

@Injectable()
export class IntendResolver implements Resolve<Observable<any>> {
    public pageStart = 0;
    public pageSize = 10;
    public departmentId = parseInt(localStorage.getItem('ZGVwYXJ0bWVudElk'))
    public depId: any;
  constructor(private readonly workflowService: WorkflowService) {}
  resolve(): Observable<any> {
    if (!Number.isNaN(this.departmentId)) {
        this.depId = this.departmentId
      } else {
        this.depId = 'All'
      }
    return this.workflowService.getAllDelivery(this.pageStart, this.pageSize, null, null, this.depId);
  }
}

@Injectable()
export class LocationManagementNewResolver implements Resolve<Observable<any>> {
    public pageStart = 0;
    public pageSize = 50;
  constructor(private readonly commonService: CommonService) {}
  resolve(): Observable<any> {
    return this.commonService.getAllLocationList(this.pageStart, this.pageSize, null, ['Active', 'Inactive'], null);
  }
}

@Injectable()
export class FacilityManagementResolver implements Resolve<Observable<any>> {
  public currentDate: any = new Date();
  public selectedDate = this.datepipe.transform(this.currentDate, 'yyyy-MM-dd');
  constructor(private readonly configurationService: ConfigurationService, public datepipe: DatePipe) {}
  resolve(): Observable<any> {
    return this.configurationService.getFacilityTransferDetails(true, false, 0, 10, null, this.selectedDate, null);
  }
}
