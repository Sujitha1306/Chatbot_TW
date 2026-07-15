
import {throwError as observableThrowError,  Observable, forkJoin } from 'rxjs';

import {catchError, map} from 'rxjs/operators';
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
import { HttpClient } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { UrlBuilderService } from './url-builder-service.service';

@Injectable()

export class ConfigurationService implements Resolve<Observable<any>> {
    constructor(private readonly apiService: ApiService, public http: HttpClient, public urlBuilder: UrlBuilderService) { }

    resolve(route: ActivatedRouteSnapshot): Observable<any> {
        return forkJoin([
            this.getAllGateways(),
            this.getAllReaders().pipe(
                catchError(error => {
                    return observableThrowError(error);
                }))
        ]).pipe(map(result => {
            return {
                gateway: result[0],
                reader: result[1]
            };
        }));
    }

    // Component: Alert Config, Rule
    getAllAlerts() {
        return this.apiService.get(environment.base_value.alert_config_api);
    }
    getAllAlertsById(id, facilityId) {
        return this.apiService.get(environment.base_value.alert_config_api_by_id + '?id=' + id + '&facilityIds=' + facilityId + '&isOnlyActive=false');
    }
    // used in both Alert Config and Rule
    getAllPfRules() {
        return this.apiService.get(environment.base_value.pf_rule_api);
    }
    getUserData(key: string) {
        return this.apiService.get(environment.base_value.search_all_user + '?searchName=' + key);
    }
    getReaderId(type) {
        return this.apiService.get(environment.base_value.get_reader_id + '?readerType=' + type);
    }
    getRecipientName(text, type, roleId?: string, parentCode?: string, isAdmin?: boolean, includeSuperAdmin?: boolean, isTask?: boolean) {
        if (roleId != null) {
            return this.apiService.get(environment.base_value.search_name_by_recipient_type + '?stext=' + text +
            '&recipientTypeId=' + type + '&roleId=' + roleId + (isTask ? '&isTask=true' : ''));
        } else if (parentCode != null) {
            return this.apiService.get(environment.base_value.search_name_by_recipient_type + '?stext=' + text +
            '&recipientTypeId=' + type + '&appTermLinkParentCode=' + parentCode + (isTask ? '&isTask=true' : ''));
        } else if (isAdmin === false) {
            return this.apiService.get(environment.base_value.search_name_by_recipient_type + '?stext=' + text +
            '&recipientTypeId=' + type + (isTask ? '&isTask=true' : ''));
        } else {
            return this.apiService.get(environment.base_value.search_name_by_recipient_type + '?stext=' + text +
            '&recipientTypeId=' + type + (includeSuperAdmin ? '&includeSuperAdmin=true' : '') + (isTask ? '&isTask=true' : ''));
        }
    }
    getRoleUser(text?, roles?, departments?, id?, userType?) {
        let params = '';
        if (roles !== null) {
            params += '?roleIds=' + roles;
        } else {
            params += '?';
        }
        if(departments !== null) {
          params += '&departmentIds=' + departments
        }
        if (text !== null) {
            params += '&sText=' + text
        }
        if(id !== null && id !== undefined){
            params += '&id=' + id
        }
        if(userType !== null && userType !== undefined){
            params += '&userTypeId=' + userType
        }
        return this.apiService.get(environment.base_value.get_role_base_user + params)
    }
    getRoleUserByText(text){
        return this.apiService.get(environment.base_value.get_role_base_user + '?sText=' + text)
    }
    getTicketUser(text,type,departmentId?) {
        let apiUrl = `${environment.base_value.search_name_by_recipient_type}?stext=${text}&recipientTypeId=${type}`;
        if (departmentId) {
          apiUrl += `&departmentId=${departmentId}`;
        }
        return this.apiService.get(apiUrl);
    }
    getRoutineRecipientName(text, type, isTagAssociated?: boolean) {
        return this.apiService.get(environment.base_value.search_name_by_recipient_type + '?stext=' + text +'&recipientTypeId=' + type + '&isTagAssociated=' + isTagAssociated);
    }
    getRecipientById(id) {
        return this.apiService.get(environment.base_value.get_user_by_id + '?userId=' + id);
    }
    getAlertHealthPackage(type){
        return this.apiService.get(environment.base_value.get_alert_health_package + '?planType=' + type);
    }
    getAlertHealthTests(option, id?: number){
        if(id !== null) {
            return this.apiService.get(environment.base_value.get_alert_health_tests + '?healthPlanId=' + id + '&testOption=' + option);
        } else {
            return this.apiService.get(environment.base_value.get_alert_health_tests + '?testOption=' + option);
        }
    }
    getAlertRoutine(type){
        return this.apiService.get(environment.base_value.get_alert_routine + '?routineTypeId=' + type);
    }
    getAlertRoutineActivity(type, id?: number){
        if(id !== null) {
            return this.apiService.get(environment.base_value.get_alert_routine_activity + '?routineId=' + id + '&activityType=' + type);
        } else {
            return this.apiService.get(environment.base_value.get_alert_routine_activity + '?activityType=' + type);
        }
    }
    saveAlert(post_data) {
        return this.apiService.post(environment.base_value.alert_config_api, post_data);
      }
    // saveAlert(post_data) {
    //     return this.apiService.post(environment.base_value.alert_config_api, post_data);
    // }
    updateAlert(id, post_data) {
        return this.apiService.put(environment.base_value.alert_config_api_update + '/' + id, post_data);
    }

    // Component: Asset, Health Check, Reader
    // used in both Asset and Reader
    getGateways() {
        return this.apiService.get(environment.base_value.get_gateway_list);
    }
    /*
    Note : Server side pagination functionality removed approved by tilak jan 28, 2021
    getAllAssets(pageStart, pageSize) {
        return this.apiService.get(environment.base_value.get_all_assets + '?pageStart=' + pageStart + '&pageSize=' + pageSize);
    }
    */
    getAllAssets(name?, pagestart?, pagesize?,isIncludeGroup?,entityGroupId?) {
        let param = "?as";
        param = pagestart != null ? param + '&pageStart=' + pagestart : param;
        param = pagesize != null ? param + '&pageSize=' + pagesize : param;
        param = name != null? param + '&name=' + name : param;
        param = isIncludeGroup != null? param + '&isIncludeGroup=' + isIncludeGroup : param;
        param = entityGroupId != null? param + '&entityGroupId=' + entityGroupId : param;
        return this.apiService.get(environment.base_value.get_all_assets + param);
    }
    getDepartmentDetails(id){
        return this.apiService.get(environment.base_value.get_all_department_by_id +id);
    }
    getAssetsById(id) {
        return this.apiService.get(environment.base_value.get_asset_by_id + '/'+id);
    }
    getStaffLocations(fdt, tdt, uid) {
        // 2023-06-01 14:59:50
        const url = 'api/python-wrapper/reports/staff-site-nav/0/0/' + localStorage.getItem(btoa('facilityId')) + '/fdt=' + fdt + '&tdt=' + tdt + '&uid='+ uid + '&lay=h';
        return this.apiService.get(url);
     }
    getAssetMovementHistory(fromDate, toDate, id, type, pageStart?, pageSize?) {
        return this.apiService.get(environment.base_value.asset_loc_history + localStorage.getItem(btoa('facilityId')) + '/fdt=' + fromDate + '&tdt=' + toDate + '&uid=' + id + '&atyp='+type);        
    }    
    getAllMovementHistory(fromDate, toDate, id, type, pageStart?, pageSize?) {
        return this.apiService.get(environment.base_value.asset_loc_history + localStorage.getItem(btoa('facilityId')) + '/fdt=' + fromDate + '&tdt=' + toDate + '&uid=' + id + '&atyp='+type + '&pst=' + pageStart+'&psz=' +pageSize);
        // return this.apiService.get(environment.base_value.get_all_movement_history + '?fromDate=' + fromDate + '&toDate=' + toDate + '&associationId=' + id + '&tagAssociationTypeId=' + type + '&pageStart=' + pageStart + '&pageSize=' + pageSize);
    }
    getPatientReportHistory(visitId) {
        return this.apiService.get(environment.base_value.get_patient_report_history + '/' + visitId);
    }
    getKpi() {
        return this.apiService.get(environment.base_value.get_kpi);
    }

    getApiKey() {
        return this.apiService.get(environment.base_value.get_apikey);
    }

    saveApiKey(data) {
        if (data?.id) {
            return this.apiService.put(environment.base_value.get_apikey + '/' + data.id, data);
        } else {
            return this.apiService.post(environment.base_value.get_apikey, data);
        }
    }

    saveShiftMaster(data) {
        if (data?.id) {
            return this.apiService.put(environment.base_value.save_shift_master + '/' + data.id, data);
        } else {
            return this.apiService.post(environment.base_value.save_shift_master, data);
        }
    }
    // used in both Asset and Health Check
    getLocationData(key: string, isAvailabilityCheck?: boolean, facility?: any) {
        
        if(isAvailabilityCheck != null){
            return this.apiService.get(environment.base_value.get_to_location_search + '/' + key + '?isAvailabilityCheck=' + isAvailabilityCheck);
        } 
        if (facility != null) {
             return this.apiService.get(environment.base_value.get_to_location_search + '/' + key + '?facility=' + facility);
        } else {
            return this.apiService.get(environment.base_value.get_to_location_search + '/' + key);
        }
    }
    getApiSearchData(url: string,key: string){
        if(url.includes('?')){
            return this.apiService.get(url + key);
        } else{
            return this.apiService.get(url + '/' + key);
        }
    }
    saveAsset(assetData) {
        return this.apiService.post(environment.base_value.save_asset, assetData);
    }
    editAsset(assetData, id) {
        return this.apiService.put(environment.base_value.edit_asset + '/' + id, assetData);
    }
    deleteAttachmentTicket(attachmentId) {
        return this.apiService.delete(environment.base_value.delete_attachment_in_ticket + '/' + attachmentId);
    }

    deleteAttachment(attachmentId) {
        return this.apiService.delete(environment.base_value.delete_attachment_in_asset + '?id=' + attachmentId); 
    }

    generateQrBarCode(id,entityType, type) {
        let code;
        code = (type === 'AT-BARC') ? 'BAR_CODE' : 'QR_CODE';
        const param = `?code=${code}&entityId=${id}&entityType=${entityType}`;
        const postBody = {};
        return this.apiService.post(`${environment.base_value.generate_qr_code}${param}`, postBody);
    }

    getAuditSchedule(entityType?,pageStart?,pageSize?,sText?){
        let url = `${environment.base_value.get_audit_schedule}?entityType=${entityType}&pageStart=${pageStart}&pageSize=${pageSize}`;
        if (sText) {
            url += `&sText=${encodeURIComponent(sText)}`;
        }
        return this.apiService.getFile(url);
    }

    getAuditScheduleInfo(scheduleId,isAudit,pageStart,pageSize,sText?, assetTypeId?,assetCategoryId?,ownedDepartment?,assignedDepartment?,ownerId?,assignedId?,locationId?){
            let params = new URLSearchParams();
            params.set('scheduleId', scheduleId);
            params.set('pageStart', pageStart);
            params.set('pageSize', pageSize);
            if (isAudit != null) params.set('isAudit', isAudit);
            const map = [
                ['assetCategoryId', assetCategoryId],
                ['assetTypeId', assetTypeId],
                ['ownerDepartmentId', ownedDepartment],
                ['assignedDepartId', assignedDepartment],
                ['assetOwnerId', ownerId],
                ['assetUserId', assignedId]
            ];
            map.forEach(([key, value]) => {
              if (value) {
                params.set(key,Array.isArray(value) ? value.join(',') : value);
              }
            });
            if (locationId) params.set('locationId', locationId);
            if (sText) params.set('sText', sText);

        const url = `${environment.base_value.get_audit_schedule_info}?${params.toString()}`;
        return this.apiService.getFile(url);
    }

    postAuditInfo(data){
      return this.apiService.post(environment.base_value.get_audit_details,data);
    }

    getOwnerAssignedUserList(departmentId,userId){
        let url = `${environment.base_value.get_owned_assigned_userList}?isOwnedUser=${userId}`;
        if (departmentId) {
            url += `&departmentId=${encodeURIComponent(departmentId)}`;
        }
        return this.apiService.getFile(url);   

    }
    addAuditSchedule(data){
        return this.apiService.post(environment.base_value.add_audit_schedule,data); 
    }
    getAuditScheduleById(id){
        return this.apiService.get(environment.base_value.get_audit_schedule+'?id=' + id)
    }
    updateAuditSchedule(id, data) {
        return this.apiService.put(environment.base_value.update_audit_schedule+ '/' + id, data); 
    }
    
    generateBulkQrBarcode(ids,entityType,type) {
        const postBody = {entityIds: ids, entityType: entityType,code: type};
        return this.apiService.post(environment.base_value.generate_bulk_qr_code, postBody);
    }

    getAssetDepartment(facilityId?)  {
       let url = environment.base_value.get_asset_department;
       if (facilityId) url += `?facilityId=${facilityId}`;
       return this.apiService.get(url);
    }
      
    // Component: Daily Management, Health Check
    getAllHealthTestsbyFloorwise() {
        return this.apiService.get(environment.base_value.get_all_healthtests_by_floorwise);
    }

    // Component: Gateway
    getAllGateways() {
        if (parseInt(localStorage.getItem('userlevel')) === 1) {
            return this.apiService.get(environment.base_value.get_all_gateways_by_admin);
        } else {
            return this.apiService.get(environment.base_value.get_all_gateways);
        }
    }
    getAllNewGateways(id) {
        if (id) {
            return this.apiService.get(environment.base_value.get_all_new_gateways + '?gatewayId=' + id);
        } else {
            return this.apiService.get(environment.base_value.get_all_new_gateways);
        }
    }
    getGatewayIdByFacility(id) {
        return this.apiService.get(environment.base_value.get_gateway_Id+ '/' + id);
    }
    // old gateway id generate api
    getGwId() {
        return this.apiService.get(environment.base_value.generate_gw_id);
    }
    getGatewayId() {
        return this.apiService.get(environment.base_value.generate_gateway_id);
    }
    getGatewayById(id) {
        return this.apiService.get(environment.base_value.get_gateway_by_id + '/' + id);
    }
    getAllFacilitybyCustomerId(customerID, Id) {
        if (Id != null) {
            return this.apiService.get(environment.base_value.get_all_facility_by_customerId
                + '?customerID=' + customerID + '&id=' + Id);
        } else {
            return this.apiService.get(environment.base_value.get_all_facility_by_customerId
                + '?customerID=' + customerID);
        }
    }
    getAllFacilitybyCustomerIdV3(customerID, gwId) {
        if(gwId){
            return this.apiService.get(environment.base_value.v3_get_all_facility_by_customerId
                + '?customerID=' + customerID + '&gatewayId=' + gwId); 
        }else{
            return this.apiService.get(environment.base_value.v3_get_all_facility_by_customerId
                + '?customerID=' + customerID);
        }
    }
    getNonAssociateFacility() {
        return this.apiService.get(environment.base_value.get_non_associate_facility);
    }
    // gateway V3
    createGatewayFacility(data){
        return this.apiService.post(environment.base_value.gw_facility, data); 
    }
    updateGatewayFacility(id, data){
        return this.apiService.put(environment.base_value.gw_facility + '/' + id, data); 
    }
    createGatewayServer(data){
        return this.apiService.post(environment.base_value.gw_server, data); 
    }
    UpdateGatewayServer(id, data){
        return this.apiService.put(environment.base_value.gw_server + '/' + id, data); 
    }
    createGatewayJob(data){
        return this.apiService.post(environment.base_value.gw_job, data); 
    }
    updateGatewayJob(id,data){
        return this.apiService.put(environment.base_value.gw_job + '/' + id, data); 
    }
    getGatewayJobTaskList(id) {
        return this.apiService.get(environment.base_value.gw_job + '/' + id); 
    }
    createJobConfig(data){
        return this.apiService.post(environment.base_value.pf_configs, data)
    }
    updateJobConfig(id, data){
        return this.apiService.put(environment.base_value.pf_configs+ '/' + id, data)
    }
    getAllPfConfig(id, groupTypeId){
        return this.apiService.get(environment.base_value.pf_configs + '?configType=CFT-JT&identifyingId=' + id + '&identifyingType=CIT-GJ&type=' + groupTypeId);
    }
    getAllgatewayConfig(configType, identifyingId, identifyingType, type){
        return this.apiService.get(environment.base_value.pf_configs + '?configType=' + configType + '&identifyingId=' + identifyingId + '&identifyingType=' + identifyingType + '&type=' + type);
    }
    getAllGatewayMaster(code, parentId){
        let queryParam = '?masterId=' + code;
        if(parentId) {
            queryParam = queryParam + '&parentId=' + parentId;
        }else {
            queryParam = queryParam + '&subTypeId=ATI-GW';
        }
        return this.apiService.get(environment.base_value.get_gw_master + queryParam);
    }
    getAllGatewayBrocker(){
        return this.apiService.get(environment.base_value.get_gw_brocker);
    }

    getAllFloorBlock(id){
        return this.apiService.get(environment.base_value.get_ip_speciality_loc + '?locationTypeIds=' + id);
    }

    getAllSelectServer(id){
      if(id){
        return this.apiService.get(environment.base_value.get_select_server + '?serverId=' + id);
      } else{
        return this.apiService.get(environment.base_value.get_select_server);
      }
    }

    getNonMappedServer() {
        return this.apiService.get(environment.base_value.get_non_mapped_server);
    }

    createGateway(data) {
        return this.apiService.post(environment.base_value.create_gateway, data);
    }
    getAllBrokers(id?: number) {
        if(id !== null && id !== undefined) {
            return this.apiService.get(environment.base_value.get_broker + '?brokerId=' + id);
        } else {
            return this.apiService.get(environment.base_value.get_broker);
        }
    }
    createBroker(data) {
        return this.apiService.post(environment.base_value.create_broker, data);
    }
    updateBroker(data, id) {
        return this.apiService.put(environment.base_value.update_broker + '/' + id, data);
    }
    getAllPoeInjectors(id?: number, search?: string, pageStart?: number, pageSize?: number) {
        let params = [];
        if(id !== null && id !== undefined) {
            params.push('id=' + id);
        }
        if(search !== null && search !== undefined && search !== '') {
            params.push('search=' + search);
        }
        if(pageStart !== null && pageStart !== undefined) {
            params.push('pageStart=' + pageStart);
        }
        if(pageSize !== null && pageSize !== undefined) {
            params.push('pageSize=' + pageSize);
        }
        const queryString = params.length > 0 ? '?' + params.join('&') : '';
        return this.apiService.get(environment.base_value.get_poe_injector + queryString);
    }
    createPoeInjector(data) {
        return this.apiService.post(environment.base_value.create_poe_injector, data);
    }
    updatePoeInjector(data, id) {
        return this.apiService.put(environment.base_value.update_poe_injector + '/' + id, data);
    }
    getAllServers(id?: number) {
        if(id !== null && id !== undefined) {
            return this.apiService.get(environment.base_value.get_server + '?brokerId=' + id);
        } else {
            return this.apiService.get(environment.base_value.get_server);
        }
    }
    createServer(data) {
        return this.apiService.post(environment.base_value.get_server, data);
    }
    updateServer(data, id) {
        return this.apiService.put(environment.base_value.get_server + '/' + id, data);
    }
    saveGateway(gatewayData) {
        return this.apiService.post(environment.base_value.save_gateway, gatewayData);
    }
    editGateway(gatewayData) {
        return this.apiService.put(environment.base_value.edit_gateway + '/' + gatewayData.id, gatewayData);
    }
    getGatewayReader(type, facilityId) {
        return this.apiService.get(environment.base_value.get_gateway_reader + '?hardwareType=' + type + '&facilityIds=' + facilityId);
    }
    getHardwareTypeThreshold(readerHardwareType, tagHardwareType, version?: number) {
        if(version !== null) {
            return this.apiService.get(environment.base_value.get_reader_hardware_type + '?readerHardwareType=' + readerHardwareType + '&facilityId=' + localStorage.getItem(btoa('facilityId')) + '&readerVersion=' + version + '&tagHwType=' + tagHardwareType);
        } else {
            return this.apiService.get(environment.base_value.get_reader_hardware_type + '?readerHardwareType=' + readerHardwareType + '&facilityId=' + localStorage.getItem(btoa('facilityId')) + '&tagHwType=' + tagHardwareType);
        }
    }
    getApplicationServer(){
        return this.apiService.get(environment.base_value.get_application_server)
    }

    // Component: Health Test
    getAllHeathTest(searchText?, pageStart?, pageSize?, healthTestOption?, isIgnoreAdmin?) {
        let queryParam = '';
        if(pageSize) {
            queryParam = '?pageStart=' + pageStart + '&pageSize=' + pageSize;
            if(searchText) {
                queryParam = queryParam + '&sText=' + searchText
            }
            if(healthTestOption) {
                queryParam = queryParam + '&healthTestOption=' + healthTestOption
            }
            if(isIgnoreAdmin) {
                queryParam = queryParam + '&isIgnoreAdmin=' + isIgnoreAdmin
            }
        }
        return this.apiService.get(environment.base_value.get_all_health_test + queryParam);
    }
    getAllHealthTestOrGroup(data) {
        return this.apiService.get(environment.base_value.get_health_test_or_group + '?healthTestOption=' + data);
    }
    getAllHealthTestByRules(id, type) {
        return this.apiService.get(environment.base_value.get_all_health_test_rule + '/' + id + '?healthTestOption=' + type);
    }
    createHealthTestRules(data) {
        return this.apiService.post(environment.base_value.get_all_health_test_rule, data);
    }
    deleteHealthTestRules(data) {
        return this.apiService.delete(environment.base_value.get_all_health_test_rule + '/' + data.id);
    }
    createHealthTest(data) {
        return this.apiService.post(environment.base_value.save_health_test_rule, data);
    }
    updateHealthTest(data) {
        return this.apiService.put(environment.base_value.save_health_test_rule + '/' + data.id, data);
    }
    getHeathTests() {
        return this.apiService.get(environment.base_value.save_health_test_rule);
    }

    // Component: Health Check, Location Mapping
    // used in both Health check and Location Mapping
    getAllHealthchecks(searchText?, pageStart?, pageSize?) {
        let queryParam = '';
        if(pageSize) {
            queryParam = '?pageStart=' + pageStart + '&pageSize=' + pageSize;
            if(searchText) {
                queryParam = queryParam + '&sText=' + searchText
            }
        }
        return this.apiService.get(environment.base_value.get_all_healthchecks + queryParam);
    }
    saveHealthcheck(post_data) {
        return this.apiService.post(environment.base_value.save_health_test, post_data);
    }
    // used in both Health check and Location Mapping
    updateHealthcheck(data, id) {
        return this.apiService.put(environment.base_value.update_health_test + '/' + id, data);
    }

    // Component: Package
    getAllTestByPkgId(pkgId) {
        return this.apiService.get(environment.base_value.get_all_health_test_by_pkg_id + '/' + pkgId);
    }
    updatePackage(data) {
        return this.apiService.post(environment.base_value.update_health_plan_detail + '/' + data.healthPlanId
            + '/' + data.healthTestId, data);
    }
    searchTestName(data, name, planTypeId) {
        return this.apiService.get(environment.base_value.get_health_test_or_group + '?healthTestOption=' + data + '&testName=' + name + '&planTypeId=' + planTypeId);
    }
    getPackageTests(id) {
        return this.apiService.get(environment.base_value.health_plan_detail + '?healthPlanId=' + id);
    }
    savePackage(data) {
        return this.apiService.post(environment.base_value.health_plan_detail, data);
    }
    newUpdatePackage(id, data) {
        return this.apiService.put(environment.base_value.health_plan_detail + '/' + id, data);
    }
    checkSourceId(id) {
        return this.apiService.get(environment.base_value.get_health_plan_souceId + '/' + id);
    }

    // Component: Reader
    getReaderVersions() {
        return this.apiService.get(environment.base_value.reader_version);
    }
    getAllReaders() { // Need to Discuss
        return this.apiService.get(environment.base_value.get_all_reader);
    }
    getAllInjectors(pageStart: number = 0, pageSize: number = 100) {
        return this.apiService.get(environment.base_value.get_all_injector + '?pageStart=' + pageStart + '&pageSize=' + pageSize);
    }

    getAllNewReaders( id?: any, sText?: string, pageStart?: number, pageSize?: number, type? : any) {
        let queryParams = '';
                
        if (id !== undefined && id !== null) {
            queryParams = '?readerId=' + id;
        }
        if (pageStart !== undefined) {
            if(queryParams == '') {
                queryParams = queryParams + '?pageStart=' + pageStart;    
            } else {
                queryParams = queryParams + '&pageStart=' + pageStart;
            }
        };
        if (pageSize !== undefined) {
            queryParams = queryParams + '&pageSize=' + pageSize;
        };
        if (sText !== undefined && sText !== null) {
            queryParams = queryParams + '&sText=' + sText;
        };
        if ( type !== undefined && type !== 'All'){
            if(queryParams == '') {
                queryParams = '?readerHardwareTypeId=' + type;  
            } else {
                queryParams = queryParams + '&readerHardwareTypeId=' + type;
            }            
        }
        return this.apiService.get(environment.base_value.get_all_v2_reader + queryParams);
    }
    getHardwareVersions() {
        return this.apiService.get(environment.base_value.get_hardware_versions);
    }
    saveReaderDevices(data) {
        return this.apiService.post(environment.base_value.reader_device, data);
    }
    saveReader(readerData) {
        return this.apiService.post(environment.base_value.save_reader, readerData);
    }
    updateReaderDevices(data, id) {
        return this.apiService.put(environment.base_value.reader_device + '/' + id, data);
    }
    updateBulkReaders(data) {
        return this.apiService.put(environment.base_value.bulk_update_reader, data);
    }
    editReader(readerData) {
        return this.apiService.put(environment.base_value.edit_reader + '/' + readerData.id, readerData);
    }
    getThresholdDetails(id) {
        return this.apiService.get(environment.base_value.get_threshold_details + id);
    }
    putThresholdDetails(id, data) {
        return this.apiService.put(environment.base_value.get_threshold_details + id, data);
    }
    postThresholdDetails(data) {
        return this.apiService.post(environment.base_value.post_threshold_details, data);
    }
    syncReader(type, data){
        return this.apiService.post(environment.base_value.sync_reader+'?identifyingType='+type, data);
    }

    // SOFTWARE VERSION IN READER
    getswVersion(type) {
        return this.apiService.get(environment.base_value.get_software_version + '?hardwareTypeId=' + type);
    }
    UpdateSoftwareVersion(data) {
        return this.apiService.put(environment.base_value.save_software_version + '?readerIds=' + data.id + '&swVersion=' + data.version, null);
    }
    getVersionHistory(id) {
        return this.apiService.get(environment.base_value.get_software_version_history + '?id=' + id);
    }

    // Component: Resource
    getLoginUsers() {
        return this.apiService.get(environment.base_value.get_login_user);
    }
    getAllResource(pageStart?: number, pageSize?: number, text?: string, menuType?) { 
        let url = environment.base_value.get_all_resource
        if(pageStart != null){
            url += '?pageStart=' + pageStart + '&pageSize=' + pageSize
        }
        if(text != null && text != ''){
            url += '&sText=' + text;
        }
        if(menuType != null) {
            url += '&resourceTypeId=' + menuType;
        }
        return this.apiService.get(url);
    }
    getResourcesById(id){
        return this.apiService.get(environment.base_value.get_resources_by_id + '/' + id);
    }
    getAllPermission() {
        return this.apiService.get(environment.base_value.get_all_permission);
    }
    resourceRoleMap(data) {
        return this.apiService.post(environment.base_value.save_resource_role, data);
    }
    saveResource(data) {
        return this.apiService.post(environment.base_value.save_resource, data);
    }
    updateResource(id, data) {
        return this.apiService.put(environment.base_value.update_resource + '/' + id, data);
        // return this.apiService.put(environment.base_value.update_resource, data);
    }

    // Component: Social Distance Config
    getConfigFile(key) {
        return this.apiService.get(environment.base_value.config_file_by_facility_name + '/' + key);
    }
    saveConfigFile(data) {
        return this.apiService.post(environment.base_value.save_config_file, data);
    }

    updateConfigFile(data) {
        return this.apiService.put(environment.base_value.save_config_file, data);
    }
    getAlertdate(startDate: any, isActive?: any, ruleTypeId?: any, direction?: any, isForCurrentUser?: any ) {
        let apiUrl = environment.base_value.alert_api + '?startDate=' + startDate + '&endDate=' + startDate;  
            
        if ((isActive === true || isActive === false) && (isActive !== 'All')) {
            apiUrl += '&isActive=' + isActive;
        }
        if (ruleTypeId && ruleTypeId !== 'All') {
          apiUrl += '&ruleTypeId=' + ruleTypeId;
        } 
        if (direction){
            apiUrl += '&direction=' + direction;
        }
        if (isForCurrentUser){
            apiUrl += '&isForCurrentUser=' + isForCurrentUser;
        }
        return this.apiService.get(apiUrl);
      }

      getAlertHistoryAsset(startDate,endDate,identifyingId,identifyingType,pageStart,pageSize){
        let param ='?as'
        param =startDate!=null?param+'&startDate='+startDate:param;
        param = endDate!=null?param+'&endDate='+endDate:param;
        param = identifyingId!=null?param+'&identifyingId='+identifyingId:param;
        param = identifyingType!=null?param+'&identifyingType='+identifyingType:param;
        param = pageStart!=null?param+'&pageStart='+pageStart:param;
        param = pageSize!=null?param+'&pageSize='+pageSize:param;
        return this.apiService.get(environment.base_value.alert_api+param);
     }

    //component:Config Management
   
    getConfig(isCurrentUser){
        return this.apiService.get(environment.base_value.config_file + '?isCurrentUser=' + isCurrentUser );
    }
    saveConfig(data){
        return this.apiService.post(environment.base_value.config_file,data);
    } 
    updateConfig(id,data){
        return this.apiService.put(environment.base_value.config_file + '/' + id,data);
    }

    //Component: Tag
    getAllTag(name?, pagestart?, pagesize?, tagAssociationTypes?, tagTypes?,status? ,tagStatus?) {
        let param = "?as";
        param = pagestart != null ? param + '&pageStart=' + pagestart : param;
        param = pagesize != null  ? param + '&pageSize=' + pagesize : param;
        param = name != null  ? param + '&name=' + name : param;
        param = tagAssociationTypes != null ? param + '&tagAssociationTypes=' + tagAssociationTypes : param;
        param = tagTypes != null ? param + '&tagTypes=' + tagTypes: param;
        param = status != null ? param + '&status=' + status : param;
        param = tagStatus != null ? param + '&tagStatus=' + tagStatus: param;
        return this.apiService.get(environment.base_value.get_all_tag + param);
    }
    getAllAssetv2(serialNumber) {
        let params = serialNumber ? '?assetSerialNumber=' + serialNumber : '';
        return this.apiService.get(environment.base_value. get_all_assets + params);
    }
    getAllAsset(id?) {
        let params = id ? '?assetId=' + id : '';
        return this.apiService.get(environment.base_value. get_all_assets + params);
    }
        searchNonAssociate(tagType, serachName) {
        // return this.apiService.get(environment.base_value.search_non_associate + '?tagTypeId=' + tagType + '&facilityId=' + localStorage.getItem(btoa('facilityId')) + '&name=' + serachName);
        return this.apiService.get(environment.base_value.search_non_associate + '?tagTypeId=' + tagType + '&name=' + serachName);
    }
    getAllAssociatedTags(type){
        return this.apiService.get(environment.base_value.get_all_associated_tags + '?tagAssociationType=' + type );
    }
    getTagHistory(serialNumber) {
        return this.apiService.get(environment.base_value.tag_history + '/' + serialNumber);
    }
    getTagAssociationHistory(associationId, associationTypeId) {
        return this.apiService.get(environment.base_value.tag_association_history + '?associationId=' + associationId + '&associationTypeId=' + associationTypeId);
    }
    getTagDetailById(serialNumber) {
        return this.apiService.get(environment.base_value.get_tag_detail_by_serial + '/' + serialNumber);
    }
    associateTag(data) {
        return this.apiService.post(environment.base_value.associate_tag, data);
    }
    saveTag(tagData) {
        return this.apiService.post(environment.base_value.save_tag, tagData);
    }
    replaceAssociateTag(data) {
        return this.apiService.post(environment.base_value.replace_associate_tag, data);
    }
    replaceMultipleAssociateTag(data) {
        return this.apiService.post(environment.base_value.replace_multiple_associate_tag, data);
    }
    MRAssociateTag(data) {
        return this.apiService.post(environment.base_value.MR_associate_tag, data);
    }
    disassociateTag(data) {
        return this.apiService.post(environment.base_value.disassociate_tag, data);
    }
    MRdisassociateTag(data) {
        return this.apiService.post(environment.base_value.MR_disassociate_tag, data);
    }
    editTag(tagData) {
        return this.apiService.put(environment.base_value.edit_tag + '/' + tagData.serialNumber, tagData);
    }
    saveInfant(data) {
        return this.apiService.post(environment.base_value.registered_patients, data);
    }
    updateInfant(data) {
        return this.apiService.put(environment.base_value.update_infant + '/' + data.id, data);
      }
    //Component: Activities
    getTaskActivities(routineType, activityCategory) {
        return this.apiService.get(environment.base_value.get_all_activities + '?routineType=' + routineType + '&activityCategoryIds=' + activityCategory);
    }
    getAllSafetyActivities(type){
          return this.apiService.get(environment.base_value.get_all_taskactivities + '?routineType=' + type)  
    }
    getMusteringHistory(date,pageStart?, pageSize?){
        return this.apiService.get(environment.base_value.get_mustering_history + '?date='+date+'&pageSize=' + pageSize +'&pageStart=' + pageStart)
    }
    getAllActivities(pageStart?, pageSize?, routineType?,searchText?) {
        let url = environment.base_value.get_all_activities

        if (pageStart !== null && pageStart !== undefined) {
            url += '?pageStart=' + pageStart
        }

        if (pageSize !== null && pageSize !== undefined) {
            url += '&pageSize=' + pageSize
        }
        if (searchText !== null && searchText !== '' && searchText !== undefined) {
           url +=  '&searchText=' + searchText;
        };
        
        if(routineType !== null && routineType !== undefined) {
            url += (pageStart !== null ? '&routineType=' : '?routineType=') + routineType;
        }

        return this.apiService.get(url)
    }
    saveActivities(data){
        return this.apiService.post(environment.base_value.get_all_activities, data);
    }
    updateActivities(data) {
        return this.apiService.put(environment.base_value.get_all_activities + '/' + data.id, data);
    }
    // Component: Routine Management
    getActivity(){
        return this.apiService.get(environment.base_value.get_activity);
    }
    searchActivities(text, type, routineType ?: string, activityCategoryId?:string, activitySubTypeId?:string) {
        let param = '?searchText=' + text + '&activityType=' + type;
        if (routineType !== null) {
            param = param + '&routineType=' + routineType;
        }
        if (activityCategoryId != undefined && activityCategoryId !== null) {
            param = param + '&activityCategoryIds=' + activityCategoryId;
        }
        if (activitySubTypeId != undefined && activitySubTypeId !== null) {
            param = param + '&activitySubTypeId=' + activitySubTypeId;
        }
        return this.apiService.get(environment.base_value.get_all_activities + param);
    }
    getActivitiesById(id){
        return this.apiService.get(environment.base_value.get_all_activities + '?id=' + id);
    }
    getAllRoutine(){
        return this.apiService.get(environment.base_value.get_all_routine);
    }
    getRoutine(type){
        return this.apiService.get(environment.base_value.get_all_routine +'?type='+ type);
    }
    getRoutineActivities(id){
        return this.apiService.get(environment.base_value.get_routine_activities + '/' + id);
    }
    getMusteringActivities(id,date,pageSize,pageStart,type ){
        return this.apiService.get(environment.base_value.get_all_ticket_request + "?activityCategoryId=" + id + "&date=" + date +"&pageSize=" + pageSize +"&pageStart="+ pageStart + "&requestType=" + type)
    }
    getHistoryActivities(id,date,pageSize,pageStart,type ){
        return this.apiService.get(environment.base_value.get_all_ticket_request + "?requestId=" + id + "&date=" + date +"&pageSize=" + pageSize +"&pageStart="+ pageStart + "&requestType=" + type)
    }
    getRoutineName(text, type){
        return this.apiService.get(environment.base_value.get_routine_name + '?stext=' + text + '&routineTypeId=' + type);
    }
    getActivitiesList(type){
        return this.apiService.get(environment.base_value.get_routine_list + '?routineTypeId=' + type);
    }
    addRoutine(data){
        return this.apiService.post(environment.base_value.add_routine, data);
    }
    createRoutine(data){
        return this.apiService.post(environment.base_value.create_routine, data)
    }
    multipleRoutine(data){
        return this.apiService.post(environment.base_value.multiple_entity_routine, data);
    }
    UpdateEntityRoutine(id, data){
        return this.apiService.put(environment.base_value.add_routine + '/' + id, data);
    }
    createEntityRoutActivity(data){
        return this.apiService.post(environment.base_value.entity_activity_save, data)
    }
    updateEntityRoutActivity(id, data){
        return this.apiService.put(environment.base_value.entity_activity_save + '/' + id, data)
    }
    activateEntityRoutine(data){
        return this.apiService.put(environment.base_value.activate_routine + '/' + data.entityRoutineEventId, data);
    }
    getEntityRoutineActivity(routineId){
        return this.apiService.get(environment.base_value.get_role_routine + '?entityRoutineId=' + routineId);
    }
    getMultipleRoutine(entityType, entityId, patientVisitId) {
        if (entityType === 'Patient') {
            return this.apiService.get(environment.base_value.get_multiple_routine + '?entityId=' + entityId + '&patientVisitId=' + patientVisitId + '&entityType=' + entityType);
        } else {
            return this.apiService.get(environment.base_value.get_multiple_routine + '?entityId=' + entityId + '&entityType=' + entityType);
        }
    }
    saveRoleRoutineActivities(data){
        return this.apiService.post(environment.base_value.get_role_routine, data);
    }
    updateRoleRoutineActivities(data){
        return this.apiService.put(environment.base_value.get_role_routine + '/' + data.entityRoutineId, data);
    }
    deleteRoleRoutine(id){
        return this.apiService.put(environment.base_value.end_routine + '/' + id, id);
    }
    cancelRoleRoutine(id){
        return this.apiService.put(environment.base_value.cancel_routine + '/' + id, id);
    }
    deleteRoleRoutineActivities(routineActivityId){
        return this.apiService.delete(environment.base_value.get_role_routine + '/' + routineActivityId);
    }
    saveRoutine(data){
        return this.apiService.post(environment.base_value.get_all_routine, data);
    }
    updateRoutine(id, data){
        return this.apiService.put(environment.base_value.get_all_routine + '/' + id, data);
    }
    saveRoutineActivities(data){
        return this.apiService.post(environment.base_value.get_routine_activities, data);
    }
    updateRoutineActivities(data){
        return this.apiService.put(environment.base_value.get_routine_activities + '/' + data.routineId, data);
    }
    deleteRoutineActivities(routineActivityId){
        return this.apiService.delete(environment.base_value.get_routine_activities + '/' + routineActivityId);
    }
    getEntityRoutinById(entityId, entityType){
        if(entityType === null){
            return this.apiService.get(environment.base_value.get_rouitine_by_entity + '?entityRoutineId=' + entityId)
        } else{
            return this.apiService.get(environment.base_value.get_rouitine_by_entity + '?entityRoutineId=' + entityId + '&entityType=' + entityType)
        }
    }
    getFormTemplates(formTemplateId?, entityId = null, entityType = null, parentId = null, parentType = null){
        if(formTemplateId){
            let params = new URLSearchParams();
            if (entityId != null) params.append('entityId', entityId);
            if (entityType != null) params.append('entityType', entityType);
            if (parentId != null) params.append('parentId', parentId);
            if (parentType != null) params.append('parentType', parentType);
            if (formTemplateId != null) params.append('id', formTemplateId);
            const queryString = params.toString();
            return this.apiService.get(environment.base_value.get_form_templates+ (queryString ? '?' + queryString : ''));
        } else{
            return this.apiService.get(environment.base_value.get_form_templates);
        }
    }    
    updateEntiryFormTemplates(formTemplateId,data){
        return this.apiService.put(environment.base_value.entity_form+ '/'+formTemplateId,data);
    }
    getEntityform(id?, entityType?, qualifier?) {
        let params = new URLSearchParams();
        if (id) {
            let filteredIds = '';
            if (Array.isArray(id)) {
                filteredIds = id.map(i => String(i).trim()).filter(Boolean).join(',');
            } else {
                filteredIds = String(id).split(',').map(i => i.trim()).filter(Boolean).join(',');
            }
            const key = filteredIds.includes(',') ? 'entityIds' : 'entityId';
            params.append(key, filteredIds);
        }
        if (entityType) params.append('entityType', entityType);
        if (qualifier) params.append('qualifiers', qualifier);
        const queryString = params && params.toString() ? params.toString() : null;
        if (queryString) {
            return this.apiService.get(environment.base_value.get_entity_association + '?' + queryString);
        } else {
            return this.apiService.get(environment.base_value.get_entity_association);
        }
    }
    createEntityAssociation(data){
        return this.apiService.post(environment.base_value.save_entity_association, data);
    }
    updateEntityAssociation(data){
        return this.apiService.put(environment.base_value.save_entity_association, data);
    }   
    getFormTemplatesV2(depId?){
        if(depId !== null && depId !== undefined && depId !== 'All'){
            return this.apiService.get(environment.base_value.get_form_templates_v2 + '?departmentIds=' + depId + '&isMyDepartments=true')
        } else {
            return this.apiService.get(environment.base_value.get_form_templates_v2);
        }
    }
    getEntityForm(entityFormId?){
        return this.apiService.get(environment.base_value.entity_form +'/'+ entityFormId);
    }
    saveEntityForm(data){
        return this.apiService.post(environment.base_value.entity_form, data);
    }
    updateEntityForm(data){
        return this.apiService.put(environment.base_value.entity_form + '/' + data.id, data);
    }
    savePfFormTemplate(data){
        return this.apiService.post(environment.base_value.save_form_template, data);
    }
    getDataitems(sText?: any, pageStart?: any, pageSize?: any) {
        const params = { sText, pageStart, pageSize};
        const url = this.urlBuilder.buildUrl(environment.base_value.get_dataitem, params);
        return this.apiService.get(url);
    }
    saveDataitems(data){
        return this.apiService.post(environment.base_value.get_dataitem, data);
    }
    updateDataitems(data){
        return this.apiService.put(environment.base_value.get_dataitem + '/' + data.id, data);
    }
    getRuleLinkActivity(id, type){
        return this.apiService.get(environment.base_value. get_mapped_activity + '?identifyingId=' + id + '&identifyingType=' + type)
    }
    getAllActivityRule(id) {
        return this.apiService.get(environment.base_value. get_mapped_activity + '?entityRoutineId=' + id)
    }
    // Not in Use
    // getTag() {
    //     return this.apiService.get(environment.base_value.get_all_tag + '/CUST002');
    // }
    // getAllDetailAssets() {
    //     return this.apiService.get(environment.base_value.get_all_assets);
    // }

    //mobile Api PWA
    getMobileApiPwa(payload){
        return this.apiService.get(environment.base_value.get_mobile_items+'?'+payload);
    }
    
    //Entity Forms based on entityAssociation
    getEntityAssociatedForms(status, type, deptQualifier?, departmentId?, identifyingType?, identifyingValue?) {
        let params = new URLSearchParams();
        if (status != null) params.append('status', status);
        if (type != null) params.append('type', type);
        if (departmentId != null && deptQualifier != null) {
            params.append('departmentId', departmentId);
            params.append('deptQualifier', deptQualifier);
        }
        if (identifyingType != null && identifyingValue != null) {
            params.append('identifyingType', identifyingType);
            params.append('identifyingValue', identifyingValue);
        }
    
        const queryString = params.toString();
        return this.apiService.get(environment.base_value.get_entity_associated_forms + (queryString ? '?' + queryString : ''));
    }     
    
    //WarrantyRoutine
    getWarrantyRoutine(activityCategoryId,routineTypeId){
         const params = new URLSearchParams();
        if (activityCategoryId) {
            params.append('activityCategoryId', activityCategoryId);
        }
        if (routineTypeId) {
            params.append('routineTypeId', routineTypeId);
        }
        const url = `${environment.base_value.get_warranty_routines}?${params.toString()}`;
        return this.apiService.get(url);
    }

    //permission group
    getAllGroup(pageStart?, pageSize?, name?) {
        let param = "?as=loc";
        if (pageSize !== null && pageSize !== undefined) {
            param = param + '&pageSize=' + pageSize;
        }
        if (pageStart !== null && pageStart !== undefined) {
            param = param + '&pageStart=' + pageStart;
        }
        if (name !== null && name !== undefined) {
            param = param + '&sText=' + name;
        }    
        return this.apiService.get(environment.base_value.get_group + param)
    }
    getAllOtProcedure( pageStart?, pageSize? , name?) {
        let param = '?as'
        if(name !== null && name !== undefined){
            param = param + '&name=' + name;
          }
          if(pageStart !== null && pageStart !== undefined){
            param = param + '&pageStart=' + pageStart;
          }
          if(pageSize !== null && pageSize !== undefined){
            param = param + '&pageSize=' + pageSize;
          } 
        return this.apiService.get(environment.base_value.get_ot_procedure + param);
    }
    saveOtProcedure(data){
        return this.apiService.post(environment.base_value.get_ot_procedure, data);
    }
    updatOtProcedure(data){
        return this.apiService.put(environment.base_value.get_ot_procedure + '/' + data.id, data);
    }
    getspecialty(){
        return this.apiService.get(environment.base_value.get_ot_specialty);
    }
    saveRole(data) {
        return this.apiService.put(environment.base_value.save_role, data);
    }
    getRoleCode(data) {
        return this.apiService.get(environment.base_value.get_roleCode + '?code=' + data);
    }
    getAlertDetails(id?: any, isForCurrentUser?: boolean, pageSize?: any, pageStart?: any) {
        let apiUrl = environment.base_value.get_alert_details + '/' + id;
        if (isForCurrentUser) {
            apiUrl = apiUrl + '?isForCurrentUser=' + isForCurrentUser;
        }
        if (pageSize != null && pageSize != undefined) {
            apiUrl = apiUrl + '&pageSize=' + pageSize;
        }
        if (pageStart != null && pageStart != undefined) {
            apiUrl = apiUrl + '&pageStart=' + pageStart;
        }
        return this.apiService.get(apiUrl);
    }
    getEntityBooking(fromDate? : string ){
        return this.apiService.get(environment.base_value.get_entity_booking + '?fromDate=' + fromDate);
    }
    checkEntityBooking(data) { 
        return this.apiService.post(environment.base_value.check_entity_booking, data);
    }
    getAllManageRoutine(pageSize?, pageStart?, entityType?, entityId?, sText?) {
        const params = { pageSize, pageStart, entityType, entityId, sText };
        const url = this.urlBuilder.buildUrl(environment.base_value.get_all_manage_routine, params);
        return this.apiService.get(url);
    }
    saveSlaReminder(postData){
        return this.apiService.post(environment.base_value.sla_notification, postData)
    }

    updateSlaReminder(id, putData){
        return this.apiService.put(environment.base_value.sla_notification + '/' + id, putData)
    }


    getDoorControllerDetails(configGroupType,identifyType,configType){
        if(configType != null){
            return this.apiService.get(environment.base_value.get_door_controller_details + '?configTypes='+configType+'&identifyType='+identifyType)
        }else{
        return this.apiService.get(environment.base_value.get_door_controller_details + '?configGroupType='+configGroupType+'&identifyType='+identifyType)
        }
    }

    updateDoorControllerDetails(id,data){
        return this.apiService.put(environment.base_value.update_door_controller_details + id , data)
    }

    getDoorHistory(fid,id,pageSize,pageStart){
        return this.apiService.get(environment.base_value.get_door_history+"?direction=DESC&facilityIds="+ fid +"&identifyingId="+id+"&identifyingType=PfConfig&pageSize="+ pageSize +"&pageStart="+pageStart)
    }

    getModel(type){
        return this.apiService.get(environment.base_value.get_pf_models+"?actionType="+type);
    }

    getSlaReminder(id, type){
        let queryParam  = '?identifyingType=' + type
        if(id !== null){
            queryParam = '?identifyingId='+ id +'&identifyingType=' + type
        }
        return this.apiService.get(environment.base_value.sla_notification + queryParam)
    }

    getformTemplatesByEntityFilter(data){
       return this.apiService.post(environment.base_value.get_formTemplate_entityfilter, data);
    }

    getFacilityTransferDetails(isFromFacility,isToFacility,pageStart?,pageSize?,sText?,fromDate?,toDate?){
        const params = { isFromFacility, isToFacility, pageStart, pageSize, sText, fromDate, toDate };
        const url = this.urlBuilder.buildUrl(environment.base_value.get_facility_transfer_details, params);
        return this.apiService.get(url);
    }
}
