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
import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable,  } from 'rxjs';

import { CommonService, ConfigurationService, DashboardService } from '../../shared';
import { DatePipe } from '@angular/common';
/*

Description : Configuration Modules implemented the resolver functionality.
Date        : May 11, 2021
Author      : TrackerWave
Developer   : Venkatesh Raju

*/

@Injectable()
export class AssetResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllAssets(null,0,50);
  }
}

@Injectable()
export class ConfigResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getConfig('true');
  }
}

@Injectable()
export class GatewayResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllGateways();
  }
}

@Injectable()
export class GatewayManagementResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllNewGateways(null);
  }
}

@Injectable()
export class BrokerResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllBrokers();
  }
}

@Injectable()
export class PoeInjectorResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllPoeInjectors(null, null, 0, 10);
  }
}

@Injectable()
export class ServerResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllServers();
  }
}

@Injectable()
export class ReaderResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService, private readonly commonService: CommonService) {}

  resolve(): Observable<any> {
    return this.commonService.getTagConfi('tag-config'), this.configurationService.getAllNewReaders(null,null,0,20);
  }
}

@Injectable()
export class DeviceResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService, private readonly commonService: CommonService ) {}

  resolve(): Observable<any> {
    return this.commonService.getTagConfi('tag-config'), this.configurationService.getAllTag(null,0,50);
  }
}

@Injectable()
export class HealthCheckResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllHealthchecks();
  }
}

@Injectable()
export class RuleResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllPfRules();
  }
}

@Injectable()
export class AlertResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllAlerts();
  }
}

@Injectable()
export class AppTermResolver implements Resolve<Observable<any>> {
  constructor(private readonly commonService : CommonService) {}

  resolve(): Observable<any> {
    return this.commonService.getAppTermsVerion2('LookupGroup');
  }
}

@Injectable()
export class LayoutsResolver implements Resolve<Observable<any>> {
  constructor(public dashboardService: DashboardService) {}

  resolve(): Observable<any> {
    return this.dashboardService.getDashboardDetailsListLayout('true',localStorage.getItem(btoa('userId')));
  }
}

@Injectable()
export class FormManagementResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService : ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getFormTemplatesV2();
  }
}

@Injectable()
export class DataItemResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService : ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getDataitems();
  }
}

@Injectable()
export class WidgetsResolver implements Resolve<Observable<any>> {
  constructor(public dashboardService: DashboardService) {}

  resolve(): Observable<any> {
    return this.dashboardService.getWidgetList(localStorage.getItem('userlevel'));
  }
}

@Injectable()
export class WidgetNewResolver implements Resolve<Observable<any>> {
  constructor(public dashboardService: DashboardService) {}

  resolve(): Observable<any> {
    return  this.dashboardService.getWidgetList(null);
  }
}

@Injectable()
export class ActiviteResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    let pageStart = 0;
    let pageSize = 50;
    return this.configurationService.getAllActivities(pageStart, pageSize);
  }
}

@Injectable()
export class RoutineResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllRoutine();
  }
}

@Injectable()
export class PackageResolver implements Resolve<Observable<any>> {
  constructor(private readonly commonService: CommonService) {}

  resolve(): Observable<any> {
    return this.commonService.getPackageHealthPlan(null, null, 0, 50);
  }
}

@Injectable()
export class LocationMappingResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllHealthchecks('', 0, 50);
  }
}

@Injectable()
export class DailyManagementResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllHealthTestsbyFloorwise();
  }
}

@Injectable()
export class HealthTestResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllHeathTest('', 0, 50);
  }
}

@Injectable()
export class SocialDistanceResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getConfigFile('sd-tag-config');
  } 
}

@Injectable()
export class PermissionGroupResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService) {}

  resolve(): Observable<any> {
    return this.configurationService.getAllGroup();
  } 
}


@Injectable()
export class AlertManagementComponentResolver implements Resolve<Observable<any>> {
  startDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
  public loginUserId = localStorage.getItem('dXNlcklk')
  constructor(public datepipe: DatePipe,private readonly CommonService: CommonService) {}

  resolve(): Observable<any> {
    return this.CommonService.getAllNotifications(this.loginUserId, 0, 50, false, null, null, this.startDate);
  } 
}
