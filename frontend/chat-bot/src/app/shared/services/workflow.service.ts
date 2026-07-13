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
import { UrlBuilderService } from './url-builder-service.service';

@Injectable()
export class WorkflowService {
  public env_key = environment.env_key;

  constructor(private readonly apiService: ApiService , public urlBuilder: UrlBuilderService) { }

  // Component: Asset
  getAssetLocationDetails(name?, pagestart?, pagesize?, isMyAsset?, isMyDepartment?, assetTypeIds?, isOwnedDepartment?, isAssignedDepartment?, departmentIds?,assetCategoryIds?,status?,costType?,isAssociated?) {
    const body: any = {
      paginationDto: {}
    };
    if (name != null) body.name = name;
    if (assetTypeIds != null) body.assetTypeIds = assetTypeIds;
    if (isMyAsset != null) body.isMyAsset = isMyAsset;
    if (isMyDepartment != null) body.isMyDepartment = isMyDepartment;
    if (isOwnedDepartment != null && isMyDepartment != null) body.isOwnedDepartment = isOwnedDepartment;
    if (isAssignedDepartment != null && isMyDepartment != null) body.isAssignedDepartment = isAssignedDepartment;
    if (Array.isArray(departmentIds) && departmentIds.length > 0 && isMyDepartment != null) {
      body.departmentIds = departmentIds;
    }
    if (pagestart != null) body.paginationDto.pageStart = pagestart;
    if (pagesize != null) body.paginationDto.pageSize = pagesize;
    if (assetCategoryIds != null) body.assetCategoryIds = assetCategoryIds;
    if (status != null) body.statusList = status;
    if (costType != null) body.costTypeIds = costType;
    if (isAssociated != null) body.isAssociated = isAssociated;
    return this.apiService.post(environment.base_value.get_asset_location_details, body);
  }

  // Component: Employee
  getEmployeeList(status, fromDate) {
    return this.apiService.get(environment.base_value.employee_controller + '?contactStatus=' + status + '&frmDate=' + fromDate);
  }

  getSalesRepList() {
    return this.apiService.get(environment.base_value.employee_controller);
  }

  // Component: Individual Record
  getPatientTestStatus(patientId) {
    return this.apiService.get('api/patient-visits/get-patient-test-status-list?patientId=' + patientId);
  }
  getHealthCheckupListofPatient(planId, patientId, unix_date) {
    return this.apiService.get(environment.base_value.check_individual_health_plan + '?planId=' + planId + '&patientId=' + patientId
        + '&date=' + unix_date);
  }

  // Component: Health Checkup
  getPatientMergeData() {
    return this.apiService.get(environment.base_value.mergeable_patient_list);
  }
  getAllMergeData(date) {
    return this.apiService.get(environment.base_value.mergeable_list + '?date=' + date);
  }

  // Component: Infant
  getAllMother(locId,name, includeHierarchy?: boolean, visitStatusId?: string) {
    let param = "?as";
    param = locId != null && locId.length ?  param + '&locationId=' + locId : param;
    param = name != null  ? param + '&name=' + name : param;
    param = includeHierarchy ? param + '&includeHierarchy=' + includeHierarchy : param;
    param = visitStatusId != null ? param + '&visitStatusId=' + visitStatusId : param
    return this.apiService.get(environment.base_value.get_all_mother + param);
  }
  getMonitor() {
    return this.apiService.get(environment.base_value.get_monitor + '?visitTypes=' + 'VT-HC,VT-OP,VT-IP');
  }
  // component : DayCarePatient
  getDayCarepatientList(name, id, visitType?: string, dateFilter?: string, pageStart?: number, pageSize?: number) {
  
    let get_porter_request = environment.base_value.get_ip_patient_list;
    
    if (id !== 'All' && id !== null) {
        get_porter_request += '?locationId=' + id;
    
        if (pageStart !== undefined && pageSize !== undefined) {
            get_porter_request += '&pageStart=' + pageStart + '&pageSize=' + pageSize;
        }
    }
    if (visitType != null && dateFilter != null) {
        get_porter_request += get_porter_request.includes('?') ? '&' : '?'; 
        get_porter_request += 'visitType=' + visitType + '&visitDate=' + dateFilter;
    }
    
    if (name !== null && name !== undefined) {
        get_porter_request += '&name=' + name;
    }
    if (pageStart !== null && pageStart !== undefined) {
        get_porter_request += '&pageStart=' + pageStart;
    }
    if (pageSize !== null && pageSize !== undefined) {
        get_porter_request += '&pageSize=' + pageSize;
    }
    
    return this.apiService.get(get_porter_request);
  }
  // Component: InPatient
  getInpatientList(name, id, visitType?: string, dateFilter?: string, pageStart?: number, pageSize?: number) {
    // if (id !== 'All') {
    //   return this.apiService.get(environment.base_value.get_ip_patient_list + '?name=' + name + '&locationId=' + id);
    // } else if (visitType != null) {
    //   return this.apiService.get(environment.base_value.get_ip_patient_list + '?name=' + name + '&visitType=' + visitType);
    // } else {
    //   return this.apiService.get(environment.base_value.get_ip_patient_list + '?name=' + name);
    // }
    
    if (id !== 'All' && id !== null) {
      if(pageStart !== undefined && pageSize !== undefined) { 
        if(name !== null && name !== undefined && name !== '') {
          let ip_details = '&locationId=' + id + '&pageStart=' + pageStart + '&pageSize=' + pageSize;
          return this.apiService.get(environment.base_value.get_ip_patient_list + '?name=' + name + ip_details);
        } else {
          let ip_details = '?locationId=' + id + '&pageStart=' + pageStart + '&pageSize=' + pageSize;
          return this.apiService.get(environment.base_value.get_ip_patient_list + ip_details);
        }
      } else {
        if(name !== null && name !== undefined && name !== '') {
          return this.apiService.get(environment.base_value.get_ip_patient_list + '?name=' + name + '&locationId=' + id);
        } else {
          return this.apiService.get(environment.base_value.get_ip_patient_list + '?locationId=' + id);
        }
      }
    } else if (visitType != null && dateFilter != null) {
      if(name !== null && name !== undefined && name !== '') {
        let ip_details = '&visitType=' + visitType + '&visitDate=' + dateFilter;
        return this.apiService.get(environment.base_value.get_ip_patient_list + '?name=' + name + ip_details);
      } else {
        let ip_details = '?visitType=' + visitType + '&visitDate=' + dateFilter;
        return this.apiService.get(environment.base_value.get_ip_patient_list + ip_details);
      }
    } else if (visitType != null) {
      if(name !== null && name !== undefined && name !== '') {
        return this.apiService.get(environment.base_value.get_ip_patient_list + '?name=' + name + '&visitType=' + visitType);
      } else {
        return this.apiService.get(environment.base_value.get_ip_patient_list + '?visitType=' + visitType);
      }
    } else {
      if(pageStart !== undefined && pageSize !== undefined) { 
        if(name !== null && name !== undefined && name !== '') {
          let ip_details = '&pageStart=' + pageStart + '&pageSize=' + pageSize;
          return this.apiService.get(environment.base_value.get_ip_patient_list + '?name=' + name + ip_details);
        } else {
          let ip_details = '?pageStart=' + pageStart + '&pageSize=' + pageSize;
          return this.apiService.get(environment.base_value.get_ip_patient_list + ip_details);
        }
      } else {
        if(name !== null && name !== undefined && name !== '') {
          return this.apiService.get(environment.base_value.get_ip_patient_list + '?name=' + name);
        } else {
          return this.apiService.get(environment.base_value.get_ip_patient_list);
        }
      }
    }
  }

  // Component: Staff Routine
  getStaffRoutineList(userTypeId?: string,name?: string,pagestart?, pagesize?, departmentIds?, studentGradeIds?, studentGroupIds?, direction?, orderBy?) { 
    let param = userTypeId != null ? '?userTypeId='+ userTypeId:'';
    param = name && name !== null ? param + '&name=' + name : param;
    param = pagestart != null ? param + '&pageStart=' + pagestart : param ;
    param = pagesize != null  ? param + '&pageSize=' + pagesize : param ;
    param = departmentIds != null && departmentIds != "null" ? param + '&departmentIds=' + departmentIds : param;
    // if (studentGradeIds != null){
    //   console.log("grd", param, studentGradeIds)
    // }
    param = studentGradeIds != "null" && studentGradeIds != undefined ? param + '&studentGradeIds=' + studentGradeIds : param;
    param = studentGroupIds != null ? param + '&studentGroupIds=' + studentGroupIds : param;
    param = direction != undefined && direction != null ? param + '&direction=' + direction : param;
    param = orderBy != undefined && orderBy != null ? param + '&orderBy=' + orderBy : param;

    // if (userTypeId != null){
    //   return this.apiService.get(environment.base_value.get_staff_routine_list + '?userTypeId=' + userTypeId); 
    // }
    return this.apiService.get(environment.base_value.get_staff_routine_list+param);
  }
  getHolidays(startDate,endDate){
      return this.apiService.get(environment.base_value.get_all_holidays+"?date="+startDate+"&toDate="+endDate);
  }
  createHoliday(data){
    return this.apiService.put(environment.base_value.update_holidays, data);
  }
  getEntityGroupDetails(startDate?,endDate?){
    if(startDate && endDate){
      return this.apiService.get(environment.base_value.get_all_entity_group_det+"?date="+startDate+"&toDate="+endDate);
    }else{
      return this.apiService.get(environment.base_value.get_all_entity_group_det);
    }
    
  }
  updateEntityGroupDetails(data){
    return this.apiService.post(environment.base_value.update_entity_group_det,data);
  }
  entityGroupDetailsUpdate(id,data){
    return this.apiService.put(environment.base_value.update_entity_group_det+"/"+id,data);
  }
  getEntityExceptionData(id?,startDate?,endDate?){
    if(id){
      return this.apiService.get(environment.base_value.get_entity_exceptions+"?date="+startDate+"&toDate="+endDate+"&groupId="+id);
    } else{
      return this.apiService.get(environment.base_value.get_entity_exceptions);
    }
  }
  getEntityGroup(id, type) {
    return this.apiService.get(environment.base_value.get_entity_group + '?entityId=' + id + '&entityType=' + type);
  }
  getEntityGroupInfo(){
    return this.apiService.get(environment.base_value.get_entity_group_details);
  }
  getPorterRequest(id) {
    return this.apiService.get(environment.base_value.get_porter_request_by_id + '/' + id);
  }
  postEntityScheduleExceptions(data) {
    return this.apiService.post(environment.base_value.schedule_exceptions, data);
  }
  putEntityScheduleExceptions(data) {
    return this.apiService.put(environment.base_value.schedule_exceptions, data);
  }
  getEntityScheduleExceptions(type?: any, id?: number, startDate?: string, endDate?: string) {
    if(id && startDate && endDate) {
      return this.apiService.get(environment.base_value.schedule_exceptions + '?entityType=' + type + '&entityId=' + id + '&startDate=' + startDate + '&endDate=' + endDate);
    } else if(id) {
      return this.apiService.get(environment.base_value.schedule_exceptions + '?entityType=' + type + '&entityId=' + id );
    } else {
      return this.apiService.get(environment.base_value.schedule_exceptions);
    }
  }
  // Component: OutPatient
  getOpPatientList(date) {
    return this.apiService.get(environment.base_value.get_op_patients_list + '?fromDate=' + date);
  }

  // Component: Porter
  updatePorterRequestById(id, status) {
    return this.apiService.put(environment.base_value.porter_request_status_update + id + '/' + status, status);
  }

  // Component: Temporary Id Card
  getTempIdCardList(date) {
    return this.apiService.get(environment.base_value.employee_id_cards + '?fromDate=' + date + '&toDate=' + date);
  }

  // Component: Visitors
  getVisitorsList(date,pageStart,pageSize,status) {
    if(pageStart != null && pageSize != null){
         if(status != null || status != undefined){
            return this.apiService.get(environment.base_value.visitor_controller + '?pageStart=' + pageStart + '&pageSize=' + pageSize+ '&statusList=' + status );
          }
          else{
            return this.apiService.get(environment.base_value.visitor_controller + '?pageStart=' + pageStart + '&pageSize=' + pageSize
            );
          }
    }
  }

  // Component: Medical Record
  getMedicalRecordList(requestStatus, requestDetailStatus, date, pageStart, pageSize) {
    let get_mr_details = '?status=' + requestStatus;
    if (requestDetailStatus != null) {
      get_mr_details = get_mr_details + '&requestDetailStatus=' + requestDetailStatus;
    }
    if (date != null) {
      get_mr_details = get_mr_details + '&reqFrmDate=' + date;
    }
    if (pageStart != null) {
      get_mr_details = get_mr_details + '&pageStart=' + pageStart;
    }
    if (pageSize != null) {
      get_mr_details = get_mr_details + '&pageSize=' + pageSize;
    }
    return this.apiService.get(environment.base_value.get_medical_record + get_mr_details);
  }

  // Component: Task
  getTaskDetails(date, isCurrentUser, isRole, isCurrentTeam, isManageTeam, pageStart, pageSize, entityType?, myTaskfilterType?, sText?, identifyingType?, isHazard?) {
    let get_task_details = '';

    if(date && date !== ''){
      get_task_details = '&startDate=' + date;
    }

    if (isCurrentUser) {
      get_task_details = '?isCurrentUser=' + isCurrentUser + get_task_details;

      if(myTaskfilterType !== undefined && myTaskfilterType) {
        get_task_details = get_task_details + '&status=' + myTaskfilterType
      }
    }
    if (isRole){
      get_task_details = '?isRole=' + isRole + get_task_details;
    }
    if (isCurrentTeam) {
      get_task_details = '?isCurrentTeam=' + isCurrentTeam + get_task_details;
    }
    if (isManageTeam) {
      get_task_details = '?isManageTeam=' + isManageTeam + get_task_details;
    }
    if (entityType) {
      get_task_details = '?entityType=' + entityType + get_task_details;
    }
    if(sText !== null && sText !== undefined){
      get_task_details = get_task_details + '&sText=' + encodeURIComponent(sText);
    }
    if(pageStart !== null && pageStart !== undefined){
      get_task_details = get_task_details + '&pageStart=' + pageStart;
    }
    if(pageSize !== null && pageSize !== undefined){
      get_task_details = get_task_details + '&pageSize=' + pageSize;
    } 
    if (identifyingType !== null && identifyingType !== undefined) {
      get_task_details = get_task_details + '&identifyingType=' + identifyingType;
    } 
    if(isHazard !== undefined) {
      get_task_details = get_task_details + '&isHazard=' + isHazard;
    }
    return this.apiService.get(environment.base_value.task_details + get_task_details);
   }
   getAllTask(toDate, date, context, status, departmentId,myTask, text, type, routine,category, pageStart, pageSize, parentId?){
    let url = '?pageStart=' + pageStart + '&pageSize=' + pageSize;
    if(date !== null){
      url += '&fromDate=' + date;
    }
    if(toDate !== null){
      url += '&toDate=' + toDate;
    }
    if(context !== null){
      url += '&contextId=' + context;
    }
    if(status !== null){
      url += '&statusList=' + status;
    }
    if(text !== null){
      url += '&sText=' + encodeURIComponent(text)
    }
    if(type !== null){
      url += '&requestType=' + type;
    }
    if(type === 'RQT-ROU' && routine !== null){
      url += '&routineTypes=' + routine;
    }
    if(departmentId !== null && departmentId != undefined && departmentId.length > 0 && departmentId != 'all'){
    url += '&departmentIds=' + departmentId;
    }

    if(myTask !== null && myTask != undefined){
      url+= '&includeMyRequest=' + myTask;
    }

    if(parentId !== null && parentId !== undefined){
      url+= '&parentId=' + parentId;
    }
    if(category !== null && category != undefined && category.length > 0 && category != 'all'){
    url += '&activityCategories=' + category;
    }
    
    return this.apiService.get(environment.base_value.get_all_new_task + url)
   }
   getTaskById(id){
    return this.apiService.get(environment.base_value.get_all_new_task + '?requestId=' + id)
   }
   getAllJobs(toDate, date, context,status, isMyRole, isMyDepartment, isAll, text, category, pageStart, pageSize, userId?) {
    let url = '?pageStart=' + pageStart + '&pageSize=' + pageSize;
    if(date !== null){
      url += '&fromDate=' + date
    }
    if(toDate !== null){
      url += '&toDate=' + toDate;
    }
    if(context !== null){
      url += '&contextId=' + context;
    }
    if(status !== null){
      url += '&statusList=' + status;
    }
    if(isMyRole !== false){
      url += '&isMyRole=' + isMyRole;
    }
    if(isMyDepartment !== false){
      url += '&isMyDepartment=' + isMyDepartment;
    }
    if(isAll !== false){
      url +='&all='+ isAll;
    }
    if(text !== null){
      url += '&sText=' + encodeURIComponent(text)
    }
    if(userId !== null &&  userId !== undefined){
      url += '&userId=' + userId;
    }
    if(category !== null && category != undefined && category.length > 0 && category != 'all'){
       url += '&activityCategories=' + category;
    }
    
    return this.apiService.get(environment.base_value.get_all_task_jobs + url)
   }
   assignToTask(data) {
     return this.apiService.post(environment.base_value.assign_to_task, data);
   }
   updateServicePersonDetails(id,data){
    return this.apiService.put(environment.base_value.updateServicePersonDetails +'/'+id,data)
   }
   getTaskServiceNotification(id,type){
    return this.apiService.get(environment.base_value.getcurrentStateTaskNotification +'?id='+id +'&type=' +type)
   }
  //  TOKEN API
   createToken(payload) {
      return this.apiService.post(environment.base_value.save_token, payload);
   }
   updateToken(id, payload) {
    return this.apiService.put(environment.base_value.update_token + '/' + id, payload);
   }
   getLocationToken(date,pagestart,pagesize,name?) {
    let param = "?as";
      param= date != null ?param +'?date=' + date : param;
      param = pagestart != null ? param + '&pageStart=' + pagestart : param;
      param = pagesize != null ? param + '&pageSize=' + pagesize : param;
      param = name != null  ? param + '&name=' + name : param;
    return this.apiService.get(environment.base_value.location_token + param);
   }
   getTokenQueue(locationIds?:any) {
    if(locationIds !== undefined && locationIds !== null) {
      return this.apiService.get(environment.base_value.get_token_queue + '?locationIds=' + locationIds);
    } else {
      return this.apiService.get(environment.base_value.get_token_queue);
    }
   }
  getGroupToken(date, pageStart, pageSize, name?, locationIds?, statusIds?) {
    const params = { date, pageStart, pageSize, name, locationIds, statusIds };
    const url = this.urlBuilder.buildUrl(environment.base_value.group_token, params);
    return this.apiService.get(url);
  }
   getTokenCount(count,tokenTypeId,visitTypeId, date?){
    let param = "?";
    param= count!= null ?param +'count=' + count : param;
    param = tokenTypeId != null ? param + '&tokenTypeId=' + tokenTypeId : param;
    param = visitTypeId != null ? param + '&visitTypeId=' + visitTypeId : param;
    param = date != null && date != undefined ? param + '&date=' + date : param;
    return this.apiService.get(environment.base_value.token_count + param);
   }
   getFloorCount(){
    return this.apiService.get(environment.base_value.floor_count)
   }


   // supplier

   getAllSupplier(pageSize, pageStart, name?){
    let url = environment.base_value.get_supplier + '?pageSize=' + pageSize + '&pageStart=' + pageStart
    if(name !== null && name !== undefined && name !== ""){
        url += '&name=' + name;
    }
    return this.apiService.get(url)
   }

   // Item-master
  getAllItemMaster(itemMasterTypeId?: any, itemCategoryId?: any) {
    if (itemMasterTypeId != null && itemMasterTypeId != undefined && itemMasterTypeId != '' &&
      itemCategoryId != null && itemCategoryId != undefined && itemCategoryId != '') {
      return this.apiService.get(environment.base_value.get_all_items + '?itemMasterTypeId=' + itemMasterTypeId + '&itemCategoryId=' + itemCategoryId)
    }
    if (itemMasterTypeId != null && itemMasterTypeId != undefined && itemMasterTypeId != '') {
      return this.apiService.get(environment.base_value.get_all_items + '?itemMasterTypeId=' + itemMasterTypeId)
    }
    return this.apiService.get(environment.base_value.get_all_items)
  }

   getAllIterm(id?, name?, pageStart?, pageSize?){
    let url = environment.base_value.get_all_items
    if(id != null && id != undefined && id != ''){
      url += '?id=' + id;
    }
    if(name != null && name != undefined && name != ''){
      url += '?name=' + name;
    }
    if(pageStart != null && pageStart != undefined && pageStart != ''){
      url += '&pageStart=' + pageStart;
    }
    if(pageSize != null && pageSize != undefined && pageSize != ''){
      url += '?pageSize=' + pageSize;
    }
    return this.apiService.get(url);
   }

   getAssetLinkInv(itemId){
    return this.apiService.get(environment.base_value.item_link_asset + '?itemMasterId=' + itemId)
   }

   createItemMaster(postData){
    return this.apiService.put(environment.base_value.create_item_master, postData)
   }
   
   getAssetCatalogs(){
    return this.apiService.get(environment.base_value.get_asset_catalogs);
   }

   getAssetModelNo(){
    return this.apiService.get(environment.base_value.get_asset_model_no);
   }

   // Inventory
   getAllInventory(start?, size?, id?){
    let url = environment.base_value.get_inventory;

    if(start !== null && start !== undefined){
      url += '?pageStart=' + start
    }
    if(size !== null && size !== undefined){
      url += '&pageSize=' + size
    }
    if(id !== null && id !== undefined){
      url += '?itemMasterId=' + id;
    }
    return this.apiService.get(url)
   }

   createInventory(postData){
    return this.apiService.put(environment.base_value.create_inventory, postData)
   }

   // Intend
   getAllDelivery(pageStart?, pageSize?, id?, masterId?, dep? ,sText?){
    let url = environment.base_value.get_all_intend
    if(pageStart !== null && pageStart !== undefined){
      url += '?pageStart=' + pageStart
    }
    if(pageSize !== null && pageSize !== undefined){
      url += '&pageSize=' + pageSize
    }
    if(id !== null && id !== undefined){
      url += '?id=' + id
    }
    if(masterId !== null && masterId !== undefined){
      url += '?itemMasterId=' + masterId
    }
    if(dep !== null && dep !== undefined && dep !== 'All' && !Number.isNaN(dep)){
      url += '&departmentIds=' + dep
    }
     if(sText !== null && sText !== undefined){
      url += '&sText=' + sText
    }
    return this.apiService.get(url)
   }

   getAllDeliveryById(id){
    return this.apiService.get(environment.base_value.get_all_intend + '/' + id)
   }

   updateDeliveryDetail(id, data) {
    return this.apiService.put(environment.base_value.get_inventory_details_assetId + '/' + id, data)
   }

   //Sales Order
   createItemMasterLink(postData){
    return this.apiService.put(environment.base_value. item_master_link, postData)
   }
  
   getSubOrderById(masterId){
    return this.apiService.get(environment.base_value.item_master_link + '?itemMasterId=' + masterId)
   }

   endroutine(id){
    return this.apiService.put(environment.base_value.end_Routine +'/'+id,id)
   }

  getSalesOrderRoutine(deliveryDetailId?, pageStart?, pageSize?, departmentId?, statusId?, roleId?, locationId?, sText?) {
    let url = environment.base_value.get_sales_routine_order

    if (pageStart !== null && pageStart !== undefined) {
      url += '?pageStart=' + pageStart
    }

    if (pageSize !== null && pageSize !== undefined) {
      url += '&pageSize=' + pageSize
    }
    
    if (deliveryDetailId !== null && deliveryDetailId !== undefined) {
      url += '?deliveryDetailId=' + deliveryDetailId
    }

    if (departmentId !== undefined && departmentId !== null) {
      url += '&departmentIds=' + departmentId;
    }

    if (statusId !== null && statusId !== undefined) {
      url += '&statusIds=' + statusId;
    }

    if (roleId !== null && roleId !== undefined) {
      url += '&roleIds=' + roleId
    }

    if(locationId !== null && locationId !== undefined && locationId !== 'All') {
      url += '&locationId=' + locationId
    }
    
    if (sText != null && sText !== undefined && sText !== '') {
      url += '&sText=' + sText
    }

    return this.apiService.get(url)
  }
   
   getEntityTaskHistory(id, type, requestType, status) {
    const params = new URLSearchParams({
      contextId: type,
      contextValue: id,
      requestType: requestType
    });
    if (status !== null) {
      params.set('statusList', status);
    }

    const url = `${environment.base_value.get_all_new_task}?${params.toString()}`;
    return this.apiService.get(url);
  }
  getEntityTaskNestedView(id,type,requestType,pageStart?,pageSize?,status?){
    const params = new URLSearchParams({
      entityId: id,
      entityType: type,
      requestType: requestType,
    });
    if (pageStart !== null) {
      params.set('pageStart', pageStart);
    }
    if (pageSize !== null) {
      params.set('pageSize', pageSize);
    }
    if (status !== null) {
      params.set('statusList', status);
    }
    const url = `${environment.base_value.get_task_by_hierachy}?${params.toString()}`;
    return this.apiService.get(url);
  }

  validateItemId(id){
    return this.apiService.get(environment.base_value.existing_item + '?code=' +id);
  }
}
