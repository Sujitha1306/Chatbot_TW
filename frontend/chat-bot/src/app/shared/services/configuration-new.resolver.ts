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
import { Injectable, inject} from '@angular/core';
import { Resolve } from '@angular/router';
import { forkJoin, Observable  } from 'rxjs';
import { CommonService, ConfigurationService, DashboardService } from '../../shared';
import { DatePipe } from '@angular/common';
/*

Description : Configuration Modules implemented the resolver functionality.
Date        : May 11, 2021
Author      : TrackerWave
Developer   : Venkatesh Raju

*/

// @Injectable()
// export class AssetResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllAssets(null,0,50);
//   }
// }

export const AssetResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllAssets(null,0,50);
};

// @Injectable()
// export class ConfigResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getConfig('true');
//   }
// }

export const ConfigResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getConfig('true');
};

// @Injectable()
// export class GatewayResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllGateways();
//   }
// }

export const GatewayResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllGateways();
};

// @Injectable()
// export class GatewayManagementResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllNewGateways(null);
//   }
// }

export const GatewayManagementResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllNewGateways(null);
};

// @Injectable()
// export class BrokerResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllBrokers();
//   }
// }

export const BrokerResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllBrokers();
};

// @Injectable()
// export class ServerResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllServers();
//   }
// }

export const ServerResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllServers();
};

// @Injectable()
// export class ReaderResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService, private commonService: CommonService) {}

//   resolve(): Observable<any> {
//     return this.commonService.getTagConfi('tag-config'), this.configurationService.getAllNewReaders(null,null,0,20);
//   }
// }

export const ReaderResolver = () => {
  const configurationService = inject(ConfigurationService);
  const commonService = inject(CommonService);

  return forkJoin({
    tagConfig: commonService.getTagConfi('tag-config'),
    readers: configurationService.getAllNewReaders(null, null, 0, 20)
  });
};

@Injectable()
export class DeviceResolver implements Resolve<Observable<any>> {
  constructor(private readonly configurationService: ConfigurationService, private readonly commonService: CommonService ) {}

  resolve(): Observable<any> {
    return this.commonService.getTagConfi('tag-config'), this.configurationService.getAllTag(null,0,50);
  }
}

// @Injectable()
// export class HealthCheckResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllHealthchecks();
//   }
// }

export const HealthCheckResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllHealthchecks();
};


// @Injectable()
// export class RuleResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllPfRules();
//   }
// }

export const RuleResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllPfRules();
};

// @Injectable()
// export class AlertResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllAlerts();
//   }
// }

export const AlertResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllAlerts();
};


// @Injectable()
// export class AppTermResolver implements Resolve<Observable<any>> {
//   constructor(private commonService : CommonService) {}

//   resolve(): Observable<any> {
//     return this.commonService.getAppTermsVerion2('LookupGroup');
//   }
// }

export const AppTermResolver = (): Observable<any> => {
  const commonService = inject(CommonService);
  return commonService.getAppTermsVerion2('LookupGroup');
};

// @Injectable()
// export class layoutsResolver implements Resolve<Observable<any>> {
//   constructor(public dashboardService: DashboardService) {}

//   resolve(): Observable<any> {
//     return this.dashboardService.getDashboardDetailsListLayout('true',localStorage.getItem(btoa('userId')));
//   }
// }

export const LayoutsResolver = (): Observable<any> => {
  const dashboardService = inject(DashboardService);
  return dashboardService.getDashboardDetailsListLayout('true',localStorage.getItem(btoa('userId')));
};

// @Injectable()
// export class formManagementResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService : ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getFormTemplatesV2();
//   }
// }

export const FormManagementResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getFormTemplatesV2();
};


// @Injectable()
// export class dataItemResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService : ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getDataitems();
//   }
// }

export const DataItemResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getDataitems();
};


// @Injectable()
// export class widgetsResolver implements Resolve<Observable<any>> {
//   constructor(public dashboardService: DashboardService) {}

//   resolve(): Observable<any> {
//     return this.dashboardService.getWidgetList(localStorage.getItem('userlevel'));
//   }
// }

export const WidgetsResolver = (): Observable<any> => {
  const dashboardService = inject(DashboardService);
  return dashboardService.getWidgetList(localStorage.getItem('userlevel'));
};

// @Injectable()
// export class widgetNewResolver implements Resolve<Observable<any>> {
//   constructor(public dashboardService: DashboardService) {}

//   resolve(): Observable<any> {
//     return  this.dashboardService.getWidgetList(null);
//   }
// }

export const WidgetNewResolver = (): Observable<any> => {
  const dashboardService = inject(DashboardService);
  return dashboardService.getWidgetList(null);
};

// @Injectable()
// export class ActiviteResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllActivities();
//   }
// }

export const ActiviteResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllActivities();
};

// @Injectable()
// export class RoutineResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllRoutine();
//   }
// }

export const RoutineResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllRoutine();
};

// @Injectable()
// export class PackageResolver implements Resolve<Observable<any>> {
//   constructor(private commonService: CommonService) {}

//   resolve(): Observable<any> {
//     return this.commonService.getPackageHealthPlan();
//   }
// }

export const PackageResolver = (): Observable<any> => {
  const commonService = inject(CommonService);
  return commonService.getPackageHealthPlan();
};

// @Injectable()
// export class LocationMappingResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllHealthchecks('', 0, 50);
//   }
// }

export const LocationMappingResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllHealthchecks('', 0, 50);
};

// @Injectable()
// export class DailyManagementResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllHealthTestsbyFloorwise();
//   }
// }

export const DailyManagementResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllHealthTestsbyFloorwise();
};

// @Injectable()
// export class HealthTestResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllHeathTest('', 0, 50);
//   }
// }

export const HealthTestResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllHeathTest('', 0, 50);
};

// @Injectable()
// export class SocialDistanceResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getConfigFile('sd-tag-config');
//   } 
// }

export const SocialDistanceResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getConfigFile('sd-tag-config');
};

// @Injectable()
// export class PermissionGroupResolver implements Resolve<Observable<any>> {
//   constructor(private configurationService: ConfigurationService) {}

//   resolve(): Observable<any> {
//     return this.configurationService.getAllGroup();
//   } 
// }

export const PermissionGroupResolver = (): Observable<any> => {
  const configurationService = inject(ConfigurationService);
  return configurationService.getAllGroup();
};

// @Injectable()
// export class AlertManagementComponentResolver implements Resolve<Observable<any>> {
//   startDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
//   public loginUserId = localStorage.getItem('dXNlcklk')
//   constructor(public datepipe: DatePipe,private CommonService: CommonService) {}

//   resolve(): Observable<any> {
//     return this.CommonService.getAllNotifications(this.loginUserId, 0, 50, false, null, null, this.startDate);
//   } 
// }

export const AlertManagementComponentResolver = (): Observable<any> => {
  const datepipe = inject(DatePipe);
  const commonService = inject(CommonService);
  const startDate = datepipe.transform(new Date(), 'yyyy-MM-dd');
  const loginUserId = localStorage.getItem('dXNlcklk');

  return commonService.getAllNotifications(loginUserId, 0, 50, false, null, null, startDate);
};