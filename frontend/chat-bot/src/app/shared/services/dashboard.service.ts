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
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { DatePipe } from '@angular/common';
import { UrlBuilderService } from './url-builder-service.service';

@Injectable()
export class DashboardService {
   public baseUrl = 'api/python-wrapper/reports/';
   public facilityId = '';
   lastDay: string;
   lastWeek: string;
   lastMonth: string;
   constructor(private readonly apiService: ApiService, public datepipe: DatePipe, public urlBuilder: UrlBuilderService) {
      this.facilityId = localStorage.getItem(btoa('facilityId'));
      const date: any = new Date();
      date.setDate(date.getDate() - 1);
      this.lastDay = this.datepipe.transform(date, 'yyyy-MM-dd');
      const date1: any = new Date();
      date1.setDate(date1.getDate() - 7);
      this.lastWeek = this.datepipe.transform(date1, 'yyyy-MM-dd');
      const date2: any = new Date();
      date2.setDate(date2.getDate() - 30);
      this.lastMonth = this.datepipe.transform(date2, 'yyyy-MM-dd');

   }
   //for dashboard management - Python
   getDashboardManagement(userId){
      return this.apiService.get(environment.base_value.dashboard_management + localStorage.getItem(btoa('facilityId'))+'/user_id='+ userId)
   }
   getDashboardUpdate(userId, firstSave, widgetId, paramType, paramValue, widgetTypeId){
      return this.apiService.get(environment.base_value.dashboard_update + localStorage.getItem(btoa('facilityId'))+'/user_id='+ userId + '&firstSave=' + firstSave + '&widgetId='+ widgetId + '&paramType='+ paramType + '&paramValue='+ paramValue + '&widgetTypeId='+ widgetTypeId)
   }
   getDashboardLayout(userId){
      return this.apiService.get(environment.base_value.user_layout + localStorage.getItem(btoa('facilityId'))+'/user_id='+ userId)
   }
   getLayoutUpdate(dashboardId, widgetId, x, y, rowid, colid){
      return this.apiService.get(environment.base_value.layout_update + localStorage.getItem(btoa('facilityId'))+'/dashboardId='+ dashboardId + '&widgetId='+ widgetId + '&x='+ x + '&y='+ y + '&rowid='+ rowid + '&colid='+ colid)
   }
   //for dashboard management - JAVA
   // new 
   getCurrentDashboard(userId, roleId, resourceCode?:any) {
      let param = '?userId='+ userId +'&roleId='+ roleId
      if(resourceCode){
         param = param + '&linkedResourceCode='+ resourceCode
      }
      return this.apiService.get(environment.base_value.current_dashboard + param);
   }
   saveCurrentDashboard(postData) {
      return this.apiService.post(environment.base_value.current_dashboard, postData);
   }
   getDashboardbyIds(dashboardId, userId, resourceCode?: any) {
      if(resourceCode){
         return this.apiService.get(environment.base_value.dahsboard_by_id +'?dashboardIds='+ dashboardId +'&userId='+userId+'&linkedResourceCode='+resourceCode);
      } else{
         return this.apiService.get(environment.base_value.dahsboard_by_id +'?dashboardIds='+ dashboardId +'&userId='+userId);
      }
   }
   getDashboardUserWidget(userId){
      return this.apiService.get(environment.base_value.dashboard_user_widget +'?userId='+ userId);
   }
   getDashboardDetailsList(userId){
      return this.apiService.get(environment.base_value.dashboard_details_list +'?userId='+ userId);
   }
   getDashboardDetailsListLayout(isPermitAll,userId){
      return this.apiService.get(environment.base_value.dashboard_details_list +'?isPermitAll='+ isPermitAll +'&userId='+ userId);
   }
   getDashboardWidgetData(widgetId, widgetParam){
      if(widgetParam == null){
         return this.apiService.get(environment.base_value.dashboard_widget_data + '?widgetIds=' + widgetId);
      } else{
         return this.apiService.get(environment.base_value.dashboard_widget_data + '?widgetIds=' + widgetId + '&widgetInputParams=' + encodeURIComponent(widgetParam));
      }
   }
   getDashboardWidgetDatav2(widgetId, widgetParam){
      widgetId = widgetId.toString()
      let payload = { 
         "widgetIds" : widgetId.split(','), 
         "widgetInputParams" : null
      }
      if(widgetParam != null){
         payload["widgetInputParams"] = widgetParam
      }
      return this.apiService.post(environment.base_value.dashboard_widget_data, payload);
   }
   deleteDashboardLayoutById(id){
      return this.apiService.delete(environment.base_value.dashboard_layout_delete_by_id + '/' + "id" + '?ids=' + id);
   }
   deleteDashboardLayoutByIds(ids){
      return this.apiService.delete(environment.base_value.dashboard_layout_delete_by_id +'/' + "id" + '?ids=' + ids);
   }
   // old
   getAllDashboardWidgetDetails(userId){
      return this.apiService.get(environment.base_value.dashboard_all_details +'/'+ userId)
   }
   postDashboardLayoutSave(jsonLayout){
      return this.apiService.post(environment.base_value.dashboard_layout_save , jsonLayout)
   }
   putDashboardLayoutUpdate(jsonLayout){
      return this.apiService.put(environment.base_value.dashboard_layout_update , jsonLayout)
   }
   // Widget management 
   getWidgetList(roleId, sText?: any, pageStart?: any, pageSize?: any){
      const params = {roleId, sText, pageStart, pageSize};
      const url = this.urlBuilder.buildUrl(environment.base_value.get_widget_list, params);
      return this.apiService.get(url);
   }
   getAllModals() {
      return this.apiService.get(environment.base_value.get_pf_models);
   }
   getWidgetTemplates(widgetIds){
      return this.apiService.get(environment.base_value.get_widget_templates + '?widgetIds=' + widgetIds);
   }
   getWidgetTemplatesByCode(code){
      return this.apiService.get(environment.base_value.get_widget_templates + '?code=' + code);
   }
   updateWidgetDetailById(data){
      return this.apiService.put(environment.base_value.save_widget_detail_by_id + '/'+ data['id'] , data);
   }
   updateWidgetModelById(data){
      return this.apiService.put(environment.base_value.save_widget_model + '/' + data['id'] , data);
   }
   saveWidgetDetailById(data){
      return this.apiService.put(environment.base_value.save_widget_detail + '/'+ data['id'] , data);
   }
   saveNewWidget(data) {
      return this.apiService.post(environment.base_value.save_widget_detail, data);
   }
   saveNewModel(data) {
      return this.apiService.post(environment.base_value.save_widget_model, data);
   }
   saveupdatedModel(data){
      return this.apiService.put(environment.base_value.save_widget_model + '/'+ data['id'] , data);
   }
   // Health checkup dashboard and report services
   getMaintenanceReport(selectedDate){
      return this.apiService.get(environment.base_value.maintenance_report  + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate)
   }
   getHCPatientStatus() {
      return this.apiService.get(environment.base_value.hc_patient_status + localStorage.getItem(btoa('facilityId')));
   }
   getHCAverageInTime() {
      return this.apiService.get(environment.base_value.hc_average_time_in_location + localStorage.getItem(btoa('facilityId'))+'/cloc=1');
   }
   getHCPatientCount() {
      return this.apiService.get(environment.base_value.hc_patient_count_in_location + localStorage.getItem(btoa('facilityId')));
   }
   getHCPatientVisitCount() {
      return this.apiService.get(environment.base_value.hc_patient_visit_count_in_location + localStorage.getItem(btoa('facilityId')));
   }
  getHCLocationUtilization() {
      return this.apiService.get(environment.base_value.hc_utilization_in_location + localStorage.getItem(btoa('facilityId')));
    }
   getHCAvgWaitTime(data) {
      let src = data.floc;
      let dest = data.tloc;
      return this.apiService.get(environment.base_value.hc_average_time_between_location + localStorage.getItem(btoa('facilityId')) + '/slid=' + src + '&dlid=' + dest);
   }
   getPatientSummary() {
      return this.apiService.get(environment.base_value.patient_summary + localStorage.getItem(btoa('facilityId')));
   }
   getHcPatientSummary(){
      return this.apiService.get(environment.base_value.hc_patient_summary+ localStorage.getItem(btoa('facilityId')))
   }
   getHcSummaryStatusWise(){
      return this.apiService.get(environment.base_value.hc_queue_status+ localStorage.getItem(btoa('facilityId')))
   }

   getHcPatientList(selectedDate) {
      return this.apiService.get(environment.base_value.hc_patientlist + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate)
   }
   getHcPlanSummary(selectedDate){
      return this.apiService.get(environment.base_value.hc_plan_summary + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate)
   }
   getHcTestSummary(selectedDate){
      return this.apiService.get(environment.base_value.hc_test_summary  + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate)
   }
   getHcPatientStatus2(selectedDate){
      return this.apiService.get(environment.base_value.hc_patient_status2 + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate)
   }
   getHcPatientList2(selectedDate) {
      return this.apiService.get(environment.base_value.hc_patientlist2 + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate)
   }
   getHcPlanSummary2(selectedDate, toDate){
      return this.apiService.get(environment.base_value.hc_plan_summary2 + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate + '&tdt='+toDate)
   }
   getHcTestSummary2(from_date,to_date){
      return this.apiService.get(environment.base_value.hc_test_summary2  + localStorage.getItem(btoa('facilityId'))+'/fdt='+from_date+'&tdt='+to_date)
   }
   getCoasterDetail(selectedDate){
      // selectedDate = '2019-12-20'
      return this.apiService.get(environment.base_value.get_coaster_detail  + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate)
   }
   getOtUtilization(from_date,to_date){
      return this.apiService.get(environment.base_value.ot_complex_utilization  + localStorage.getItem(btoa('facilityId'))+'/fdt='+from_date+'&tdt='+to_date)
   }
   getGeoFenceViolationDetail(selectedDate){
      return this.apiService.get(environment.base_value.get_geofence_detail  + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate)      
   }
   getHcEmployeeSummary(selectedDate) {
      return this.apiService.get(environment.base_value.employee_summary + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate);
   }
   getHcPatientReport(selectedDate,report){
      // selectedDate = '2019-12-20'
      return this.apiService.get(environment.base_value.hc_patient_report  + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate+'&prpt='+report)
   }
   getPatientSampleCollection(selectedDate) {
      return this.apiService.get(environment.base_value.patient_sample_coll + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate);
   }
   getForecastedReport(selectedDate){
      return this.apiService.get(environment.base_value.get_forecasted_report  + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate)
   }
   getHcLocationUtilization(){
     return this.apiService.get(environment.base_value.hc_location_utilization + localStorage.getItem(btoa('facilityId')))
   }

   public getAllLocationCategory(appTermsId) {
      return this.apiService.get(environment.base_value.get_app_terms + '/' + appTermsId);
   }
   // getAllAlert() {
   //    return this.apiService.get(environment.alert_api);
   // }

   getAllAlert(pageStart, pageSize, ruleTypeId?: string) {
      if (ruleTypeId !== 'All' && ruleTypeId != null) {
         return this.apiService.get(environment.base_value.alert_api+'?isForCurrentUser=true&pageStart='+pageStart+'&pageSize='+pageSize+'&ruleTypeId='+ruleTypeId);
      } else {
         return this.apiService.get(environment.base_value.alert_api+'?isForCurrentUser=true&pageStart='+pageStart+'&pageSize='+pageSize);
      }
   }

   getEmployeeSummary() {
      return this.apiService.get(environment.base_value.get_employee_summary+localStorage.getItem(btoa('facilityId')));
   }

   getEmployeeSDSummary(selectedDate) {
      return this.apiService.get(environment.base_value.get_employee_socialDistancing+localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate);
   }

   filterByTypeandDate(fromDate, toDate, ruleTypeId) {
      return this.apiService.get(environment.base_value.alert_api+'?isForCurrentUser=true&fromDate='+fromDate+'&toDate='+toDate+'&ruleTypeId='+ruleTypeId);
   }

   getAllAssets(pageStart, pageSize){
      return this.apiService.get(environment.base_value.get_all_assets+'?pageStart='+pageStart+'&pageSize='+pageSize);
  }
   getAllDashboardOP(reportName, id) {
      let url = null;
      if (id === 1) {
         url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId'));
      } else if (id === 2) {
         url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId')) + '/fdt=' + this.lastDay;
      } else if (id === 3) {
         url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId')) + '/fdt=' + this.lastWeek
            + '&tdt=' + this.lastDay + '&freq=1M';
      } else if (id === 4) {
         url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId')) + '/fdt=' + this.lastMonth
            + '&tdt=' + this.lastDay + '&freq=1M';
      } else {
         url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId'));
      }
      //  console.log(url, reportName, id, this.lastDay, this.lastWeek, this.lastMonth);
      return this.apiService.get(url);
   }
   getAllDashboardOP1(reportName, id) {
      let url = null;
      if (id == 1) {
         url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId'));
      } else if (id == 2) {
         url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId')) + '/fdt=' + this.lastDay;
      } else if (id == 3) {
         url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId')) + '/fdt=' + this.lastWeek + '&tdt=' + this.lastDay + '&freq=1M';
      } else if (id == 4) {
         url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId')) + '/fdt=' + this.lastMonth + '&tdt=' + this.lastDay + '&freq=1M';
      } else {
         url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId'));
      }
      // console.log(url, reportName, id, this.lastDay, this.lastWeek, this.lastMonth);
      return this.apiService.get(url);
   }
   getAvgContactTime() {
      const url = 'api/python-wrapper/reports/avgtimeinloc/0/0/' + localStorage.getItem(btoa('facilityId'));
      return this.apiService.get(url);
   }
   getAvgWaitTime(src, dest) {
      const url = 'api/python-wrapper/reports/avgtimebtwloc/0/0/' + localStorage.getItem(btoa('facilityId')) +
         '/scat=' + src + '&dcat=' + dest;
      return this.apiService.get(url);
   }
   getCountActiveTaginLoc() {
      const url = 'api/python-wrapper/reports/countactivetaginloc/0/0/' + localStorage.getItem(btoa('facilityId'));
      return this.apiService.get(url);
   }
   getAvgTimeinCareArea() {
      const url = 'api/python-wrapper/reports/avgtimeinca/0/0/' + localStorage.getItem(btoa('facilityId'));
      return this.apiService.get(url);
   }
   getAllLocPatientVisit() {
      const url = 'api/python-wrapper/reports/counttaginloc/0/0/' + localStorage.getItem(btoa('facilityId'));
      return this.apiService.get(url);
   }
   getAvgLengthofStay() {
      const url = 'api/python-wrapper/reports/avgtimeinfacility/0/0/' + localStorage.getItem(btoa('facilityId'));
      return this.apiService.get(url);
   }
   getAvgTimeToBoard() {
      const url = 'api/python-wrapper/reports/avgtimetoboard/0/0/' + localStorage.getItem(btoa('facilityId')) + '/fdt=2019-03-13';
      return this.apiService.get(url);
   }
   getAvgTimeToDischarge() {
      const url = 'api/python-wrapper/reports/avgtimetodischarge/0/0/' + localStorage.getItem(btoa('facilityId')) + '/fdt=2019-03-13';
      return this.apiService.get(url);
   }
   getInpatientStatus() {
      const url = 'api/python-wrapper/reports/assetstatus/0/0/' + localStorage.getItem(btoa('facilityId')) + '/fdt=2019-03-13';
      return this.apiService.get(url);
   }
   getTagLoc(id) {
      const url = 'api/python-wrapper/reports/totaltimebyloc/0/0/' + localStorage.getItem(btoa('facilityId')) + '/tid=' + id + '&cloc=1';
      return this.apiService.get(url);
   }
   getDigitalQueueSummary() {
      const url = 'api/patient/patient-digital-queues-summary';
      return this.apiService.get(url);
   }
   getHealthPlanLocations(category?: any) {
      if(category != null && category != undefined) {
         return this.apiService.get(environment.base_value.get_all_health_test_locations + '?' + category?.key + '=' + category?.value);
      } else {
         return this.apiService.get(environment.base_value.get_all_health_test_locations);
      }
   }
   getFloorList() {
      return this.apiService.get(environment.base_value.get_floor_list);
   }
   getPatientByFloorId(id) {
      return this.apiService.get(environment.base_value.get_dq_patient_by_floor + '?floorId=' + id);
   }
   getHpLocationDetailbyId(locId, searchText?: string, includeToken?: boolean, floorIds?:any, visitTypes?: any) {
      let params = '?locationIds=' + locId ;
      if(searchText !== null && searchText !== undefined) {
        params = params + '&searchText=' + searchText;
      }
      if(includeToken !== null && includeToken !== undefined) {
         params = params + '&includeToken=' + includeToken;
      }
      if(floorIds !== null && floorIds !== undefined) {
         params = params + '&floorIds=' + floorIds;
      }
      if(visitTypes !== null && visitTypes !== undefined && visitTypes?.length !== 0) {
         params = params + '&visitTypes=' + visitTypes;
      }
      return this.apiService.get(environment.base_value.get_dq_patient_by_location + params);
   }
   getHpLocationDetailbyIds(data, floorIds?: any, visitTypes?: any) {
      let params = '?locationIds=' + data ;
      if(floorIds !== null && floorIds !== undefined) {
         params = params + '&floorIds=' + floorIds;
      }
      if(floorIds !== null && floorIds !== undefined && visitTypes?.length !== 0) {
         params = params + '&visitTypes=' + visitTypes;
      }
      return this.apiService.get(environment.base_value.get_dq_patient_by_worklist + params);
   }
   getAllHpLocationDetails() {
      return this.apiService.get(environment.base_value.get_dq_patient_by_worklist);
   }
   getAllmultipleLocationDQ(type, visitTypes?){
      let params = new URLSearchParams();
      if (type != null) params.append('type', type);
      const queryString = params.toString();
      if(visitTypes !== undefined && visitTypes !== null && visitTypes?.length > 0) {
         return this.apiService.get(environment.base_value.get_multi_dq_patient_by_worklist + '?' + queryString + '&visitTypes=' + visitTypes);
      } else {
         return this.apiService.get(environment.base_value.get_multi_dq_patient_by_worklist + '?' + queryString);
      }
   }
   updatePatientQueueStatus(id, status) {
      return this.apiService.put(environment.base_value.update_patient_queue_status + '/' + id, status);
   }

   // getRegisteredPatients(id) {
   //    return this.apiService.get(environment.base_value.registered_patients + '/' + id);
   // }

   // saveRegisteredPatients(data) {
   //    return this.apiService.post(environment.base_value.registered_patients, data);
   // }
   validatePatientToken(token) {
      return this.apiService.get(environment.base_value.token_validate+token);
   }

   patientStatusValue = ['2', '1', '1', '1'];
   patientStatusLabel = ['Pending', 'Waiting', 'Inprogress', 'Completed'];
   patientUtilizationValue = ['6', '4', '2'];
   patientUtilizationLabel = ['ICU', 'Staff Room', 'General Ward'];
   patientVisitCountLabel = ['X-Ray', 'General Ward', 'Blood Collection'];
   patientVisitCountValue = ['3', '3', '7'];
   patientCountLabel = ['Staff Room', 'ICU', 'X-Ray'];
   patientCountValue = ['1', '3', '5'];
   averageContactTimeValue = ['1', '3', '5'];
   averageContactTimeLabel = ['X-Ray', 'ICU', 'Room 6'];
   avgWaitTimeValue = ['40', '10', '20', '35', '25'];


}
