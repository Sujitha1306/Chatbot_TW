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

export class EntityGroupModel {
    public reader = [
        {'colName': 'select', 'title': null, 'dataName': null},
        {'colName': 'readerName', 'title': 'Reader Name', 'dataName': 'readerName'},
        {'colName': 'readerTypeName', 'title': 'Type', 'dataName': 'readerTypeName'},
        {'colName': 'readerConnectivityTypeName', 'title': 'Connectivity Type', 'dataName': 'readerConnectivityTypeName'},
        {'colName': 'readerAlgoTypeName', 'title': 'Algorithm Type', 'dataName': 'readerAlgoTypeName'},
        {'colName': 'serialNo', 'title': 'Serial Number', 'dataName': 'serialNo'},
        {'colName': 'coordinate', 'title': 'Coordinate', 'dataName': 'coordinate'},
        {'colName': 'version', 'title': 'Version', 'dataName': 'version'},
        {'colName': 'status', 'title': 'Status', 'dataName': 'status'}
    ];
    public tag = [
        {'colName': 'select', 'title': null, 'dataName': null},
        {'colName': 'serialNumber', 'title': 'Serial Number', 'dataName': 'serialNumber'},
        {'colName': 'tagTypeName', 'title': 'Type', 'dataName': 'tagTypeName'},
        {'colName': 'tagAssociationType', 'title': 'Association Type', 'dataName': 'tagAssociationType'},
        {'colName': 'tagAssociationId', 'title': 'Association ID', 'dataName': 'tagAssociationId'},
        {'colName': 'tagAssociationName', 'title': 'Association Name', 'dataName': 'tagAssociationName'},
        {'colName': 'batteryPercentage', 'title': 'Batter Percentage', 'dataName': 'batteryPercentage'},
        {'colName': 'status', 'title': 'status', 'dataName': 'status'}
    ];
    public asset = [
        {'colName': 'select', 'title': null, 'dataName': null},
        {'colName': 'assetSerialNumber', 'title': 'Serial Number', 'dataName': 'assetSerialNumber'},
        {'colName': 'assetName', 'title': 'Asset Name', 'dataName': 'assetName'},
        {'colName': 'assetTypeName', 'title': 'Asset Type', 'dataName': 'assetTypeName'},
        {'colName': 'tagTypeId', 'title': 'Tag ID', 'dataName': 'tagTypeId'},
        {'colName': 'assetAdminEmail', 'title': 'Email', 'dataName': 'assetAdminEmail'},
        {'colName': 'assetAdminContactNo', 'title': 'Contact', 'dataName': 'assetAdminContactNo'},
        {'colName': 'status', 'title': 'Status', 'dataName': 'status'},
        {'colName': 'isTagAssociated', 'title': 'isTagAssociated', 'dataName': 'isTagAssociated'}
    ];
    public patient = [
        {'colName': 'select', 'title': null, 'dataName': null},
        {'colName': 'id', 'title': 'Id', 'dataName': 'id'},
        {'colName': 'type', 'title': 'Type', 'dataName': 'type'},
        {'colName': 'page', 'title': 'Page', 'dataName': 'page'},
        {'colName': 'name', 'title': 'Name', 'dataName': 'name'},
        {'colName': 'status', 'title': 'Status', 'dataName': 'status'}
    ];
    public location = [
        {'colName': 'select', 'title': null, 'dataName': null},
        {'colName': 'name', 'title': 'Name', 'dataName': 'name'},
        {'colName': 'locationTypeName', 'title': 'Location Type Name', 'dataName': 'locationTypeName'},
        {'colName': 'categoryName', 'title': 'Category Name', 'dataName': 'categoryName'},
        {'colName': 'careSettingName', 'title': 'Care Setting Name', 'dataName': 'careSettingName'},
        {'colName': 'status', 'title': 'Status', 'dataName': 'status'}
    ]; 
    public user = [
        {'colName': 'select', 'title': null, 'dataName': null},
        {'colName': 'fullName', 'title': 'User Name', 'dataName': 'fullName'},
        {'colName': 'roleName',  'title':'Role', 'dataName': 'roleName'},
        {'colName': 'userName', 'title': 'Email', 'dataName': 'userName'},
        {'colName': 'phoneNumber', 'title': 'Phone Number', 'dataName': 'phoneNumber'},
        {'colName': 'status', 'title': 'Status', 'dataName': 'status'}
    ];
    public department = [
        {'colName': 'select', 'title': null, 'dataName': null},
        {'colName': 'name', 'title': 'Name', 'dataName': 'name'},
        {'colName': 'departmentType', 'title': 'Department Type', 'dataName': 'departmentType'},
        {'colName': 'sourceId',  'title':'SourceId', 'dataName': 'sourceId'},
        {'colName': 'sourceType', 'title': 'SourceType', 'dataName': 'sourceType'},
    ];
     public grade = [
        {'colName': 'select', 'title': null, 'dataName': null},
        {'colName': 'code', 'title': 'Code', 'dataName': 'code'},
        {'colName': 'value', 'title': 'Value', 'dataName': 'value'},
        {'colName': 'groupName',  'title':'Group Name', 'dataName': 'groupName'},
        {'colName': 'sequence', 'title': 'Sequence', 'dataName': 'sequence'}
    ];
    public columnName = {
        'EGTI-READER' : 'readerName',
        'EGTI-KIT' : 'readerName',
        'EGTI-TAG' : 'serialNumber',
        'EGTI-AS' : 'id',
        'EGTI-PA' : 'id',
        'EGTI-US' : 'id',
        'EGTI-LOC' : 'id',
        'EGT-DEP'  : 'id',
        'EGT-GRA'  : 'code'
    };
    public header = {
        'EGTI-READER' : 'Reader',
        'EGTI-KIT' : 'Kit',
        'EGTI-TAG' : 'Tag',
        'EGTI-AS' : 'Asset',
        'EGTI-PA' : 'Patient',
        'EGTI-US' : 'User',
        'EGTI-LOC' : 'Location',
        'EGT-DEP'  : 'Department',
        'EGT-GRA'  : 'Grade'
    };
}

