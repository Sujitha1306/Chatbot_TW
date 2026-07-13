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
export class HospitalService {
    public env_key = environment.env_key;
    constructor(private readonly apiService: ApiService) { }
    
    // Used in Report >> Asset Report
    getAllAssetDetails() {
        return this.apiService.get(environment.base_value.get_all_asset_stats + localStorage.getItem(btoa('facilityId')));
    }

    // Used in Dashboard Widget >> Floor Plan and Report >> Floor Plan
    getLocationDetail(data) {
        return this.apiService.get(environment.base_value.location_detail + '/' + data);
    }

    // Used in Report >> Patient Report
    getHealthCheckupPatientList(fromDate, toDate) {
        if (fromDate != '' && toDate != '') {
            return this.apiService.get(environment.base_value.get_health_checkup_patient + '?fromDate=' + fromDate + '&toDate=' + toDate);
        } else if (fromDate != '') {
            return this.apiService.get(environment.base_value.get_health_checkup_patient + '?fromDate=' + fromDate);
        }
    }

    // Component: Bill
    getBills() {
        if (this.env_key == 'dev') {
            return [
                {
                    'id': 1,
                    'billId': 'BILL000201',
                    'billType': 'Monthly',
                    'toPay': '20000',
                    'dueDate': '16-02-2019',
                    'status': 'Pending'
                },
                {
                    'id': 2,
                    'billId': 'BILL000202',
                    'billType': 'Monthly',
                    'toPay': '5000',
                    'dueDate': '17-02-2019',
                    'status': 'Pending'
                },
                {
                    'id': 3,
                    'billId': 'BILL000203',
                    'billType': 'Monthly',
                    'toPay': '1000',
                    'dueDate': ' - ',
                    'status': 'Closed'
                },
                {
                    'id': 4,
                    'billId': 'BILL000204',
                    'billType': 'Weekly',
                    'toPay': '20000',
                    'dueDate': '19-02-2019',
                    'status': 'Pending'
                },
                {
                    'id': 5,
                    'billId': 'BILL000207',
                    'billType': 'Weekly',
                    'toPay': '8750',
                    'dueDate': '17-02-2019',
                    'status': 'Pending'
                },
                {
                    'id': 6,
                    'billId': 'BILL000208',
                    'billType': 'Monthly',
                    'toPay': '700',
                    'dueDate': ' - ',
                    'status': 'Closed'
                },
                {
                    'id': 7,
                    'billId': 'BILL000209',
                    'billType': 'Monthly',
                    'toPay': '3000',
                    'dueDate': '27-02-2019',
                    'status': 'Pending'
                }
            ];
        } else {
            return [];
        }
    }

    // Component: Import Setting
    importBulkUser(bulkData) {
        return this.apiService.post(environment.base_value.import_bulk_user, bulkData);
    }
    saveImportTag(importTag) {
        return this.apiService.post(environment.base_value.save_import_tag, importTag);
    }
    importBulkEmployee(bulkData) {
        return this.apiService.post(environment.base_value.import_bulk_employee, bulkData);
    }
    importBulkAsset(bulkData) {
        return this.apiService.post(environment.base_value.import_bulk_asset, bulkData);
    }
    getHealthGroup(){
        return this.apiService.get(environment.base_value.get_health_test)
    }
    importBulkHealthTest(bulkData){
        return this.apiService.post(environment.base_value.import_bulk_healthTest, bulkData);
    }
    importBulkHealthPlan(bulkData){
        return this.apiService.post(environment.base_value.import_bulk_healthPlan, bulkData);
    }
    importBulkReader(data){
        return this.apiService.post(environment.base_value.import_bulk_reader, data);
    }
    importBulkPatient(bulkData){
        return this.apiService.post(environment.base_value.import_bulk_patient, bulkData);  
    }
    importBulkItems(data){
        return this.apiService.post(environment.base_value.import_bulk_item, data);   
    }
    importBulkOTProcedure(data){
        return this.apiService.post(environment.base_value.import_bulk_otprocedure, data);   
    }
    getItemCategory(code){
        return this.apiService.get(environment.base_value.get_item_by_category + '?itemType=' +code)
    }
    importBulkSurgicalSet(data){
        return this.apiService.post(environment.base_value.import_bulk_sterileSet,data)
    }

    importBulkInventory(data){
        return this.apiService.put(environment.base_value.import_bulk_inventory,data)
    }

    // Component: Manage Facility, Patient, Support Ticket, User Mannagement
    getAllCustomers() {
        return this.apiService.get(environment.base_value.get_all_customer);
    }
    getAllCustomerRole(){
        return this.apiService.get(environment.base_value.get_all_customer_role);
    }
    saveCustomerRole(cusData){
        return this.apiService.post(environment.base_value.save_customer_role, cusData);
    }
    // used in both Manage Facility, Support Ticket and User Mannagement
    getCustomerList() {
        return this.apiService.get(environment.base_value.get_customer_list);
    }
    // used in both Manage Facility, Support Ticket and User Mannagement
    getRegionList(cust_id) {
        return this.apiService.get(environment.base_value.get_region_list + '/' + cust_id);
    }
    saveCustomer(customerData) {
        return this.apiService.post(environment.base_value.save_customer, customerData);
    }
    updateCustomer(userData) {
        return this.apiService.put(environment.base_value.update_customer + '/' + userData.id, userData);
    }
    deleteCustomer(custId) {
        return this.apiService.delete(environment.base_value.delete_customer + '/' + custId + '/' + 'true');
    }

    // Component: Patient
    getAllPatients() {
        return this.apiService.get(environment.base_value.get_all_details_patients);
    }
    searchPatient(data) {
        return this.apiService.get(environment.base_value.search_patient + '/' + data);
    }
    savePatient(data,id?) {
        if(id){
            return this.apiService.post(environment.base_value.save_patient+'/'+id , data);
        } else{
            return this.apiService.post(environment.base_value.save_patient, data);
        }
    }
    updatePatient(data) {
        return this.apiService.put(environment.base_value.update_patient, data);
        // return this.apiService.put(environment.base_value.update_patient+'/'+data.id, data);
    }
    updateTempPatient(istemppatient_id,data) {
        return this.apiService.put(environment.base_value. update_temporary_patients+ '/' + istemppatient_id, data);
    }
    // Component: Support Ticket, User Mannagement
    getAllTickets() {
        return this.apiService.get(environment.base_value.get_all_tickets);
    }
    getBlockList() {
        return this.apiService.get(environment.base_value.get_all_block_list);
    }
    getBlockWithFloors(){
        return this.apiService.get(environment.base_value.get_blocks_with_floor);
    }
    // used in both Support Ticket and User Mannagement
    getFacilityList(reg_id) {
        return this.apiService.get(environment.base_value.get_facility_list + '/' + reg_id);
    }
    saveTicket(data) {
        return this.apiService.post(environment.base_value.save_ticket, data);
    }
    editTicket(data) {
        return this.apiService.put(environment.base_value.edit_ticket, data);
    }
    deleteAttachmentInTicket(attachmentId) {
        return this.apiService.delete(environment.base_value.delete_attachment_in_ticket + '/' + attachmentId);
    }

    // Component: User Management
    getAllUsers(isMyTeamUsers?, roleCode?, name?, pagestart?, pagesize?, gender?, poolId?, poolLoc?, isIncludeGroup?, entityGroupId?) {
        let param = "?as=loc";
        param = pagestart != null ? param + '&pageStart=' + pagestart : param;
        param = pagesize != null  ? param + '&pageSize=' + pagesize : param;
        param = isMyTeamUsers != null  ? param + '&isMyTeamUsers=' + isMyTeamUsers : param;
        param = roleCode != null  ? param + '&roleTypeId=' + roleCode : param;
        param = name != null ? param + '&name=' + encodeURIComponent(name) : param;
        param = gender != null && gender != 0 ? param + '&gender=' + gender : param;
        param = poolId != null && poolId != 0 ? param + '&poolId=' + poolId : param;
        param = poolLoc != null && poolLoc != 0 ? param + '&poolLocationId=' + poolLoc : param;
        param = isIncludeGroup != null? param + '&isIncludeGroup=' + isIncludeGroup : param;
        param = entityGroupId != null? param + '&entityGroupId=' + entityGroupId : param;
        return this.apiService.get(environment.base_value.get_user_list + param);
    }
    searchPhoneNo(data) {
        return this.apiService.get(environment.base_value.search_by_phoneno + '/' + data);
    }
    searchEmail(data) {
        return this.apiService.get(environment.base_value.search_by_email + '/' + data);
    }
    searchUserName(data) {
        return this.apiService.get(environment.base_value.search_by_username + '/' + data);
    }
    saveUser(userData) {
        return this.apiService.post(environment.base_value.save_user, userData);
    }
    editUser(userData) {
        return this.apiService.put(environment.base_value.edit_user + '/' + userData.id, userData);
    }
    updateUserPool(data, id) {
        return this.apiService.put(environment.base_value.edit_user + '/' + id, data);
    }
    saveShift(shiftData) {
        return this.apiService.post(environment.base_value.get_shift, shiftData);
    }
    updateShift(id, shiftData) {
        return this.apiService.put(environment.base_value.get_shift + '/' + id, shiftData);
    }
    getAllShift() {
        return this.apiService.get(environment.base_value.get_all_shift);
    }
    getShiftHistory(id, type) {
        return this.apiService.get(environment.base_value.get_shift + '?entityId=' + id + '&entityType=' + type);
    }

    // Component: Location Management
    getAllReaders() {
        return this.apiService.get(environment.base_value.get_all_reader);
    }
    getExitNodes() {
        return this.apiService.get(environment.base_value.get_exit);
    }
    getType() {
        return this.apiService.get(environment.base_value.get_type);
    }
    getAllLocationType() {
        return this.apiService.get(environment.base_value.get_all_location_type);
    }
    getAllLogicalLocationType(id) {
        const key = id == null ? '' : '?locationId=' + id;
        return this.apiService.get(environment.base_value.get_all_logical_location_type + key);
    }
    getNodePoints(data?) {
        let url = environment.base_value.get_node
        if(data) {
            url = url + '?floorId=' + data
        }
        return this.apiService.get(url);
        // return this.apiService.get(environment.base_value.get_node+'{floorId}');
        //return [{"id":1,"x":3.1446875,"y":8.09578125,"type":"normal","floor_id":17939,"location_id":17944,'links':[{"link_node_id":2,"degree":90,"weight":1}]},{"id":2,"x":6.3046875,"y":7.81578125,"type":"normal","floor_id":17939,"location_id":17944,'links':[{"link_node_id":1,"degree":90,"weight":1},{"link_node_id":3,"degree":90,"weight":1}]},{"id":3,"x":10.1046875,"y":8.25578125,"type":"normal","floor_id":17939,"location_id":17944,'links':[{"link_node_id":2,"degree":90,"weight":1}]}];
    }
    getFacilityById(id) {
        return this.apiService.get(environment.base_value.get_facility_by_id + '/' + id);
    }
    getLocationWithChildren(data) {
        return this.apiService.get(environment.base_value.location_with_children + '/' + data);
    }
    getLogicalLocationById(id) {
        return this.apiService.get(environment.base_value.logical_location_by_id + '?id=' + id);
    }
    getLogicalLocationWithChildren(data) {
        return this.apiService.get(environment.base_value.logical_location_with_children + '/' + data);
    }
    getsafelocation(data){
        return this.apiService.get(environment.base_value.getsafetyevents + '?routineTypeId=' +data)
    }
    getsafedata(data){
        return this.apiService.get(environment.base_value.getsafetyevents + '/'+ data)
    }
    saveNodePoints(data) {
        return this.apiService.post(environment.base_value.save_node, data);
    }
    saveLocation(data) {
        return this.apiService.post(environment.base_value.save_location, data);
    }
    updateFloorDirection(locationData) {
        return this.apiService.put(environment.base_value.update_floor_direction, locationData);    
    }
    editLocation(locationData) {
        return this.apiService.put(environment.base_value.update_location + '/' + locationData.id, locationData);
    }
    locationApplyAll(data) {
        return this.apiService.put(environment.base_value.location_apply_all + '?parentId='+data.parentId, data);
    }
    locationApplyAllNew(parentId,locType,category,data) {
        let params ='?parentIds='+parentId+'&locationTypeIds='+locType
        if(category && category.length){
            params = params + '&locationCategoryIds='+category
        }
        return this.apiService.put(environment.base_value.location_apply_all + params, data)
        // return this.apiService.put(environment.base_value.location_apply_all + '?parentIds='+parentId+'&locationTypeIds='+locType+'&locationCategoryIds='+category, data);
    }
    deleteNodePoint(id) {
        return this.apiService.delete(environment.base_value.delete_node + id);
    }
    deleteAllNodePoints(param) {
        return this.apiService.delete(environment.base_value.delete_all_node + param);
    }
    deleteLocation(locId) {
        return this.apiService.delete(environment.base_value.delete_location + '/' + locId);
    }
    getHomeLocationData(key: string) {
        return this.apiService.get(environment.base_value.get_to_location_search + '/' + key);
    }

    // Not In Use

    // getLocationImageById(id) { // 
    //     return this.apiService.get(environment.base_value.get_image_location_by_id + id);
    // }
    // saveAllTicket(data) { // 
    //     return this.apiService.post(environment.base_value.save_all_ticket, data); // w/o Login - - - this API will call
    // }

    // getPatientInfoWithDate(id, date) { // 
    //     return this.apiService.get(environment.base_value.get_patient_info + '?patientId=' + id + '&date=' + date);
    // }
    // getTag() { // 
    //     return this.apiService.get(environment.base_value.get_all_tag + '/CUST002');
    // }

    // getAllConsumable() { // 
    //     if (this.env_key === 'dev') {
    //         return [
    //             {
    //                 id: 1,
    //                 itemName: 'Disposable Syringe',
    //                 requestedQuantity: '50',
    //                 suppliedQuantity: 20,
    //                 price: 10,
    //                 totalPrice: 1000
    //             },
    //             {
    //                 id: 2,
    //                 itemName: 'Surgical Tape',
    //                 requestedQuantity: '10',
    //                 suppliedQuantity: 5,
    //                 price: 400,
    //                 totalPrice: 2000
    //             },
    //             {
    //                 id: 3,
    //                 itemName: 'Elastic Crepe Bandage ',
    //                 requestedQuantity: '50',
    //                 suppliedQuantity: 20,
    //                 price: 10,
    //                 totalPrice: 1000
    //             },
    //             {
    //                 id: 4,
    //                 itemName: 'Gauze',
    //                 requestedQuantity: '10',
    //                 suppliedQuantity: 5,
    //                 price: 400,
    //                 totalPrice: 2000
    //             },
    //             {
    //                 id: 5,
    //                 itemName: 'Laproscopy Veress Needle',
    //                 requestedQuantity: '10',
    //                 suppliedQuantity: 4,
    //                 price: 1000,
    //                 totalPrice: 4000
    //             },
    //             {
    //                 id: 6,
    //                 itemName: 'Disposable Glove',
    //                 requestedQuantity: '100',
    //                 suppliedQuantity: 70,
    //                 price: 100,
    //                 totalPrice: 7000
    //             }
    //         ];
    //     } else {
    //         return [];
    //     }
    // }
    // getOutpatientList() {
    //     if (this.env_key == 'dev') {
    //         return [{
    //             'id': 1,
    //             'tagId': 'TAG30023',
    //             'patientId': 'PAT003222',
    //             'name': 'Janaki',
    //             'age': 25,
    //             'sex': 'Female',
    //             'clinicName': 'Apollo Clinic',
    //             'speciality': 'General',
    //             'AdmittedDr': 'Dr. Joseph',
    //             'currentlocation': 'Reception',
    //             'inTime': '10-02-19 09:23',
    //             'outTime': '11-02-19 09:23',
    //             'status': 'Active'
    //         },
    //         {
    //             'id': 2,
    //             'tagId': 'TAG30024',
    //             'patientId': 'PAT003224',
    //             'name': 'Raman',
    //             'age': 28,
    //             'sex': 'Male',
    //             'clinicName': 'Apollo Clinic',
    //             'speciality': 'Ortho',
    //             'AdmittedDr': 'Dr. Joseph',
    //             'currentlocation': 'Reception',
    //             'inTime': '09-02-19 09:23',
    //             'outTime': '09-02-19 09:23',
    //             'status': 'Active'
    //         },
    //         {
    //             'id': 3,
    //             'tagId': 'TAG30025',
    //             'patientId': 'PAT003225',
    //             'name': 'Mohammed',
    //             'age': 24,
    //             'sex': 'Male',
    //             'clinicName': 'Apollo Clinic',
    //             'speciality': 'General',
    //             'AdmittedDr': 'Dr. Joseph',
    //             'currentlocation': 'Reception',
    //             'inTime': '10-02-19 09:23',
    //             'outTime': '11-02-19 09:23',
    //             'status': 'Active'
    //         },
    //         {
    //             'id': 4,
    //             'tagId': 'TAG30026',
    //             'patientId': 'PAT003226',
    //             'name': 'Rahul',
    //             'age': 23,
    //             'sex': 'Male',
    //             'clinicName': 'Apollo Med',
    //             'speciality': 'Ortho',
    //             'AdmittedDr': 'Dr. Kumar',
    //             'currentlocation': 'Reception',
    //             'inTime': '09-02-19 09:23',
    //             'outTime': '09-02-19 09:23',
    //             'status': 'Active'
    //         },
    //         {
    //             'id': 5,
    //             'tagId': 'TAG30027',
    //             'patientId': 'PAT003227',
    //             'name': 'Meenachi',
    //             'age': 25,
    //             'sex': 'Female',
    //             'clinicName': 'Apollo Clinic',
    //             'speciality': 'General',
    //             'AdmittedDr': 'Dr. Joseph',
    //             'currentlocation': 'Reception',
    //             'inTime': '10-02-19 09:23',
    //             'outTime': '11-02-19 09:23',
    //             'status': 'Active'
    //         },
    //         {
    //             'id': 6,
    //             'tagId': 'TAG30028',
    //             'patientId': 'PAT003228',
    //             'name': 'Kamal',
    //             'age': 58,
    //             'sex': 'Male',
    //             'clinicName': 'Apollo Med',
    //             'speciality': 'Ortho',
    //             'AdmittedDr': 'Dr. Kumar',
    //             'currentlocation': 'Reception',
    //             'inTime': '09-02-19 09:23',
    //             'outTime': '09-02-19 09:23',
    //             'status': 'Active'
    //         },
    //         {
    //             'id': 7,
    //             'tagId': 'TAG30029',
    //             'patientId': 'PAT003229',
    //             'name': 'Kannan',
    //             'age': 25,
    //             'sex': 'Male',
    //             'clinicName': 'Apollo Clinic',
    //             'speciality': 'General',
    //             'AdmittedDr': 'Dr. Joseph',
    //             'currentlocation': 'Reception',
    //             'inTime': '10-02-19 09:23',
    //             'outTime': '11-02-19 09:23',
    //             'status': 'Active'
    //         },
    //         {
    //             'id': 8,
    //             'tagId': 'TAG30030',
    //             'patientId': 'PAT003230',
    //             'name': 'Sunder',
    //             'age': 28,
    //             'sex': 'Male',
    //             'clinicName': 'Apollo Med',
    //             'speciality': 'Ortho',
    //             'AdmittedDr': 'Dr. Kumar',
    //             'currentlocation': 'Reception',
    //             'inTime': '09-02-19 09:23',
    //             'outTime': '09-02-19 09:23',
    //             'status': 'Active'
    //         }
    //         ];
    //     } else {
    //         return [];
    //     }
    // }

}
