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
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
@Injectable()
export class ReportService {
  public baseUrl = 'api/python-wrapper/reports/';
  public tokenEnrollFlow = JSON.parse(localStorage.getItem(btoa('tokenEnrollFlow')));

  constructor(private readonly apiService: ApiService) { }

  getAllDashboardOP(reportName, id) {
    let url = this.baseUrl + reportName + '/0/0/' + localStorage.getItem(btoa('facilityId'));
    return this.apiService.get(url);
  }
  getHCAverageInTime(fdt, tdt) {
    if (fdt != '' && tdt != '') {
      return this.apiService.get(environment.base_value.hc_average_time_in_location + localStorage.getItem(btoa('facilityId')) + '/fdt=' + fdt + '&tdt=' + tdt + '&freq=1m');
    } else {
      return this.apiService.get(environment.base_value.hc_average_time_in_location + localStorage.getItem(btoa('facilityId')) + '/fdt=' + fdt);
    }

  }
  getHCPatientVisitCount(fdt, tdt) {
    if (fdt != '' && tdt != '') {
      return this.apiService.get(environment.base_value.hc_patient_visit_count_in_location + localStorage.getItem(btoa('facilityId')) + '/fdt=' + fdt + '&tdt=' + tdt + '&freq=1m');
    } else {
      return this.apiService.get(environment.base_value.hc_patient_visit_count_in_location + localStorage.getItem(btoa('facilityId')) + '/fdt=' + fdt);
    }
  }
  getHCLocationUtilization(fdt, tdt) {
    if (fdt != '' && tdt != '') {
      return this.apiService.get(environment.base_value.hc_utilization_in_location + localStorage.getItem(btoa('facilityId')) + '/fdt=' + fdt + '&tdt=' + tdt + '&freq=1m');
    } else {
      return this.apiService.get(environment.base_value.hc_utilization_in_location + localStorage.getItem(btoa('facilityId')) + '/fdt=' + fdt);
    }
  }
  getAssetCount() {
    return this.apiService.get(environment.base_value.asset_report_count);
  }

  // getAllMergeData(date) {
  //   return this.apiService.get(environment.base_value.mergeable_list + '?date=' + date);
  // }

  // getPatientMergeData() {
  //   return this.apiService.get(environment.base_value.mergeable_patient_list);
  // }

  getAssetStats() {
    return this.apiService.get(environment.base_value.asset_type_and_count);
  }

  // getHcPatientList(date) {
  //   if (this.tokenEnrollFlow === true) {
  //     return this.apiService.get(environment.base_value.hc_patientlist_with_billed + localStorage.getItem(btoa('facilityId')) + '/fdt=' + date);
  //   } else {
  //     return this.apiService.get(environment.base_value.hc_patientlist + localStorage.getItem(btoa('facilityId')) + '/fdt=' + date);
  //   }
  // }

//   saveMergeRecord(data) {
//     return this.apiService.post(environment.base_value.save_merge_record, data);
// }

  getHcPackageList(date) {
    return this.apiService.get(environment.base_value.hc_packagelist + localStorage.getItem(btoa('facilityId')) + '/fdt=' + date);
  }
  getHcTestList(date) {
    return this.apiService.get(environment.base_value.hc_testlist + localStorage.getItem(btoa('facilityId')) + '/fdt=' + date);
  }

  getReaderTemperatureData(data) {
    return [{
      id: '1',
      readerID: 'READ0001',
      readerName: 'Reader1',
      readerLocation: 'ward A',
      readerTemperature: '33.7',
      readerStatus: 'Active'
    }];
  }
  getassetutilsation(id, freq) {
    const url = 'api/python-wrapper/reports/deviceutilisation/0/0/' + localStorage.getItem(btoa('facilityId')) + '/tid=' + id + '&freq=' + freq + '&aid=1';
    return this.apiService.get(url);
  }
  getFloorTagDetails(id) {
    return this.apiService.get(environment.base_value.cur_tag_loc + localStorage.getItem(btoa('facilityId')) + '?cloc=1&flr=' + id);
  }
  getTrackAssetHistory(id) {
    // console.log(id);
    // return this.apiService.get(environment.base_value.track_tag_history + localStorage.
    //   getItem(btoa('facilityId')) + '/ttype=TAT-AS/tid=' + id);

    return this.apiService.get(environment.base_value.track_tag_history + localStorage.
      getItem(btoa('facilityId')) + '/tid=' + id);

  }
  getReaderSensordata(id) {
    return this.apiService.get(environment.base_value.env_sensor + localStorage.getItem(btoa('facilityId')) + '/rid=' + id);
    // return [{"status_code": 200, "message": "Service called successfully", "data": {"label": ["20:52:47", "20:52:45", "20:52:34", "20:52:31", "20:52:17", "20:52:04", "20:52:01", "20:51:47", "20:51:45", "20:51:34", "20:51:31", "20:51:17", "20:51:15", "20:51:04", "20:51:01", "20:50:47", "20:50:45", "20:50:34", "20:50:31", "20:50:17", "20:50:15", "20:50:04", "20:50:01", "20:49:47", "20:49:45", "20:49:34", "20:49:31", "20:49:17", "20:49:15", "20:49:04"], "temperature": [31.4, 31.4, 31.4, 31.4, 31.4, 31.5, 31.5, 31.5, 31.4, 31.5, 31.5, 31.5, 31.5, 31.5, 31.5, 31.5, 31.5, 31.5, 31.5, 31.5, 31.4, 31.4, 31.4, 31.4, 31.4, 31.5, 31.5, 31.5, 31.5, 31.5], "humidity": [33, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34], "pressure": [101496.0, 101503.0, 101495.0, 101507.0, 101503.0, 101504.0, 101503.0, 101502.0, 101499.0, 101500.0, 101502.0, 101501.0, 101502.0, 101508.0, 101500.0, 101509.0, 101504.0, 101495.0, 101496.0, 101502.0, 101504.0, 101505.0, 101503.0, 101500.0, 101501.0, 101499.0, 101499.0, 101506.0, 101492.0, 101496.0]}}];
  }
  getReaderCO2Sensordata(id, groupBy) {
    // console.log(groupBy);
    // return this.apiService.get(environment.base_value.env_sensor + localStorage.getItem(btoa('facilityId')) + '/rid=' + id);
    return this.apiService.get(environment.base_value.gas_sensor + localStorage.getItem(btoa('facilityId')) + '/rid=' + id + '&gby=' + groupBy);
    // return [{"statusCode": 200, "results": {"label": ["13:51:17", "13:45:01", "00:36:33", "00:19:18", "00:18:34", "00:17:48", "00:11:13", "23:52:20", "23:50:33", "23:45:02", "23:42:25", "23:40:32", "23:31:14", "23:25:51", "23:15:11", "23:00:58", "22:57:56", "22:45:49", "15:24:33", "14:40:52", "14:19:47", "14:12:11", "13:25:43", "13:22:24", "13:20:19", "13:19:26", "13:12:43", "13:07:51", "13:06:32", "12:57:14"], "latest": 101, "CO2": ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"]}, "message": "Service called successfully"}];
  }
  getMaintenanceReport(selectedDate) {
    return this.apiService.get(environment.base_value.maintenance_report  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getOpenEncounterReport(selectedDate) {
    return this.apiService.get(environment.base_value.hc_open_encounter  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getEmpGeoFenceViolationDetail(selectedDate){
    return this.apiService.get(environment.base_value.emp_geofence_detail  + localStorage.getItem(btoa('facilityId'))+'/fdt='+selectedDate)      
  }
  getPatientContactDetails(selectedDate, toDate, patientUhid) {
    return this.apiService.get(environment.base_value.patient_contact + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate + '&tdt=' + toDate + '&uid=' + patientUhid);
  }
  getPatientContactDetails1(selectedDate, toDate, patientUhid, xids) {
    return this.apiService.get(environment.base_value.patient_contact1 + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate + '&tdt=' + toDate + '&uid=' + patientUhid + '&xids=' + xids);
  }
  getPatientMovementReport(selectedDate) {
    return this.apiService.get(environment.base_value.patient_move + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getPatientFallReport(selectedDate) {
    return this.apiService.get(environment.base_value.patient_fall + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getNewbornSummary(selectedDate) {
    return this.apiService.get(environment.base_value.newborn_summary + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getAssetMovementReport(selectedDate) {
    return this.apiService.get(environment.base_value.asset_move + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getAssetTransferReport(selectedDate) {
    return this.apiService.get(environment.base_value.asset_transfer + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getNurseCallEfficiencyReport(selectedDate) {
    return this.apiService.get(environment.base_value.nurse_call + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getStaffAttendanceReport(selectedDate) {
    return this.apiService.get(environment.base_value.staff_attendance + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getEmployeeAttendanceReport(selectedDate) {
    return this.apiService.get(environment.base_value.employee_attendance + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getOutPatientReport(selectedDate) {
    return this.apiService.get(environment.base_value.out_patient  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getInPatientReport(selectedDate) {
    return this.apiService.get(environment.base_value.in_patient  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getPatientJourneyDetails(selectedDate, tagValue) {
    return this.apiService.get(environment.base_value.patient_journey  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getsiteNavigationDetails(selectedDate, type, staffId) {
    return this.apiService.get(environment.base_value.visitor_site_navigation + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate +'&ptyp=' + type + '&uid=' + staffId);
  }
  getDayCareReport(selectedDate) {
    return this.apiService.get(environment.base_value.day_care  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getVitalsChart(selectedDate, toDate, patientUhid, param) {
    return this.apiService.get(environment.base_value.vitals_chart  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate + '&tdt=' + toDate + '&uid=' + patientUhid+param);
  }
  getRollCallReport(selectedDate,facId) {
    return this.apiService.get(environment.base_value.roll_call  + facId + '/fdt=' + selectedDate);
  }
  getVisitorSummaryReport(selectedDate) {
    return this.apiService.get(environment.base_value.visitor_summary  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getLocationWiseContact(selectedDate){
    return this.apiService.get(environment.base_value.emp_loc_rep  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getEmployeeAttendance(patientUhid, selectedDate, toDate) {
    return this.apiService.get(environment.base_value.emp_attendance  + localStorage.getItem(btoa('facilityId')) + '/user_id=' + patientUhid + '&fdt=' + selectedDate + '&tdt=' + toDate);
  }
  getEmployeeAttendanceAll(patientUhid, selectedDate, toDate) {
    return this.apiService.get(environment.base_value.emp_attendance_all  + localStorage.getItem(btoa('facilityId')) + '/user_id=' + patientUhid + '&fdt=' + selectedDate + '&tdt=' + toDate);
  }
  getEmployeeAsset(selectedDate) {
    return this.apiService.get(environment.base_value.emp_asset  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getOpTATReport(selectedDate) {
    return this.apiService.get(environment.base_value.op_tat_report  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  getAllFacility(customerId){
    return this.apiService.get(environment.base_value.get_all_facility_by_customerId+ '?customerID=' + customerId);
  }
  getReportData(selectedDate,id){
    let idValue = id;
    return this.apiService.get(environment.base_value[id]  + localStorage.getItem(btoa('facilityId')) + '/fdt=' + selectedDate);
  }
  // LOG
  getAuditLogReport(fromDate, toDate, operation, pageStart, pageSize) {
    return this.apiService.get(environment.base_value.get_audit_log_report + '?frmDate=' + fromDate + ':00' + '&toDate=' + toDate + ':00' 
    + '&operation=' + operation + '&pageStart=' + pageStart + '&pageSize=' + pageSize);
  }
  getErrorLogReport(fromDate, toDate, operation, pageStart, pageSize) {
    return this.apiService.get(environment.base_value.get_error_log_report + '?frmDate=' + fromDate + ':00' + '&toDate=' + toDate + ':00' 
    + '&operation=' + operation + '&pageStart=' + pageStart + '&pageSize=' + pageSize);
  }

  //Schedule
  getAllReportSchedule(){
    return this.apiService.get(environment.base_value.get_all_report_schedule);
  }
  saveReportSchedule(data) {
    return this.apiService.post(environment.base_value.save_report_schedule, data);
  }
  updateReportSchedule(id,data){
    return this.apiService.put(environment.base_value.update_report_schedule + '/' + id,data)
  }
  restartScheduleCron() {
    return this.apiService.post(environment.base_value.schedule_cron_restart, {})
  }

  // rountine
  getTaskByCategory(routineType, activityCategory ?: any) {
    if(activityCategory){
      return this.apiService.get(environment.base_value.get_all_activities + '?routineType=' + routineType + '&activityCategoryIds=' + activityCategory);
    } 
    return this.apiService.get(environment.base_value.get_all_activities + '?routineType=' + routineType);
  }
}
