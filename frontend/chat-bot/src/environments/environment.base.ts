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
export const base_value = {
  geminiApiKey : 'AIzaSyD499v-A4T5LV8pdu1v597eEti-uJvlIXw',
  topic_sw_update: 'tw/web/ota',
  topic_gw_cache: 'tw/reader/location',

  lockingTimeout: 10000, /* <----- locking Timeout  (10 seconds) */
  idle_time_out: 14400, /* <----- Idle Time Out  (default : 14400 = 4 hours) */
  server_time_out: 180000, /* Server timeout (default : 30000 = 30 seconds) */
  server_time_out_error_msg: 'Looks like the server is taking to long to respond, Please try again in sometime',
  auth_card_error_msg: 'Automatically logged out due to inactivity!',
  set_interval: 60 * 1000,
  set_amb_interval : 30 * 1000,
  set_geo_loc_interval: 10000,
  set_monitor_interval: 30000,
  layout_autorefresh_time: 1 * 60 * 1000,
  lk : "TEAzMEFubWJVVCRwSzhUTQ==",

  get_app_terms: 'api/lookup-terms/get-app-terms',
  get_bulk_app_terms: 'api/lookup-terms/v2/get-bulk-app-terms',
  get_app_terms_data: 'api/lookup-terms/app-terms',
  get_app_terms_filter_data: 'api/lookup-terms/app-terms-filter',
  validate_app_terms_code: 'api/lookup-terms/validate',
  get_reader_type: 'api/lookup-terms/app-terms-link',
  enum_terms: 'api/lookup-terms/enum-terms',
  get_hardware_versions: 'api/hw/hardware-versions',
  get_app_terms_v2: 'api/lookup-terms/v2/get-app-terms',
  get_app_term_facility: 'api/lookup-terms/v3/get-app-terms-facility',
  get_form_template: 'api/pf-form-template/form-templates',

  // // GATEWAY SERVICE

  // get_all_gateways: 'api/gateway/get-all-gateways',
  get_gateway_Id: 'api/pf-gateway/generate-gateway-id',
  get_all_gateways: 'api/gateway/v3/get-all-gateways',
  get_all_new_gateways: 'api/pf-gateway/tw-gateway/records',
  get_all_gateways_by_admin: 'api/gateway/customer-gateways',
  get_gateway_list: 'api/gateway/gateways-list',
  mqtt_gateway_broker: 'api/gateway/broker-details',
  get_gateway_by_id: 'api/gateway/v2/get-gateway-by-id',
  // save_gateway: 'api/gateway/create-gateway',
  save_gateway: 'api/gateway/v2/create-gateway',
  // edit_gateway: 'api/gateway/update-gateway',
  edit_gateway: 'api/gateway/update-gateway/v2',
  generate_gw_id: 'api/gateway/generate-gateway-id',
  generate_gateway_id: 'api/pf-gateway/generate-gateway-id',
  create_gateway: 'api/pf-gateway/create-gateway',
  get_broker: 'api/pf-gateway/gw-mqtt-broker',
  create_broker: 'api/pf-gateway/create-broker',
  update_broker: 'api/pf-gateway/update-broker',
  create_server: 'api/pf-gateway/create-server',
  publish_mqtt:'api/all/utility/publish-mqtt',
  get_gateway_reader: 'api/pf-gateway/gateway-reader-filter',
  get_reader_hardware_type: 'api/reader/hardware-type-thresholds',
  gw_facility: 'api/pf-gateway/tw-gateway',
  gw_server: 'api/pf-gateway/gw-server',
  gw_job: 'api/pf-gateway/job-mapping',
  get_gw_master: 'api/pf-gateway/gw-master',
  get_gw_brocker: 'api/pf-gateway/gw-mqtt-broker',
  get_select_server: 'api/pf-gateway/tw-server',
  get_non_mapped_server: 'api/pf-gateway/non-mapped-servers',
  get_server: 'api/pf-gateway/tw-server',
  get_all_license: 'api/all/tw-license/tw-license',
  get_app_version: 'api/pf-gateway/app-version',
  pf_configs: 'api/pf-config/pf-configs',
  get_application_server: 'api/pf-gateway/application-with-jobs-and-tasks',

  //Entity Group
  entity_group:'api/all/pf-entity-groups',
  pf_entity_group: 'api/all/pf-entity-group-mappings',
  
  // HEALTH CHECK

  get_all_healthchecks: 'api/health-plan/get-all-health-tests',
  get_all_health_test_by_pkg_id: 'api/health-plan/get-all-health-tests-package',
  save_health_test: 'api/health-plan/save-health-test',
  update_health_test: 'api/health-plan/update-health-test',
  get_all_healthtests_by_floorwise: 'api/health-plan/get-all-health-tests/floor-wise',
  get_all_health_test: 'api/health-plan/get-all-health-tests-details',
  update_health_plan_detail: 'api/health-plan/update-health-plan-detail',
  update_health_test_location_availability: 'api/health-plan/update-health-test-location-availability',
  update_bulk_location_status: 'api/health-plan/bulk-location-status-updates',
  get_all_test_by_location: 'api/health-plan/get-all-test-by-location-id',
  get_health_test_group: 'api/health-plan/get-health-test-group',
  get_health_test_or_group: 'api/health-plan/health-test-or-groups',
  get_health_test_available_locations: 'api/health-plan/available-locations',
  manage_patient_test: 'api/health-plan/manage-patient-tests',
  get_available_location_by_loc_id: 'api/health-plan/location-id',
  get_ot_health_plan: 'api/health-plan/health-plans',
  get_search_ot_procedure:'api/health-plan/search-by-procedure-names',
  save_resource : 'api/permission/create-resource',
  save_resource_role : 'api/permission/create-resource-role-map',
  update_resource : 'api/permission/update-resource',
  get_all_resource: 'api/permission/get-all-resources',
  get_all_permission: 'api/permission/get-all-resource-role-map',
  permission_by_id : 'api/permission/permissions',
  get_blocks_with_floor: 'api/location/get-all-blocks-with-floors',
  get_health_test:'api/health-test/health-test-groups',
  import_bulk_healthTest:'api/health-test/health-test-bulk',
  import_bulk_healthPlan:'api/health-plan/health-plan-bulk',
  get_custom_facility: 'api/customer/facility-list',
  get_follow_up: 'api/patient-visits/health-check-followup',
  get_resources_by_id: 'api/permission/permission-resources',
  customer_info: 'api/customer/get-customer-list-by-id',

  // resources map
  get_group: 'api/resource/resource-groups',
  get_map_resource: 'api/resource-map/resource-group-maps',
  get_mapped_role_resource: 'api/permission/resources-and-resource-groups',
  group_resource: 'api/resource-map/resource-group-maps',
  map_group: 'api/permission/resource-role-map',
  get_resource: 'api/permission/resources',
  
  // // TAG
  tag_track: 'api/public/customer/track/track-tag/',
  get_all_tag: 'api/tag/v2/tags',
  // get_all_tag: 'api/tag/get-all-tags',
  get_tag_detail_by_serial: 'api/tag/tags-by-serial-number',
  tag_history: 'api/tag/get-all-tags-link-history',
  tag_association_history: 'api/tag/tag-association-histories',
  save_import_tag: 'api/tag/create-bulk-tags',
  save_tag: 'api/tag/create-tag',
  edit_tag: 'api/tag/update-tag',
  associate_tag: 'api/tag/associate-tag',
  disassociate_tag: 'api/tag/disassociate-tag',
  MR_disassociate_tag: 'api/asset/asset-patient-disassociation',
  replace_associate_tag: 'api/tag/replace',
  replace_multiple_associate_tag: 'api/tag/associate-multiple-tags',
  MR_associate_tag: 'api/asset/asset-patient-association',
  search_all_details: 'api/tag/search-all-tag-mapping-details',
  search_non_associate: 'api/tag/search-non-associate',
  search_non_associate_tag: 'api/tag/v1/non-associated-tags',
  get_all_associated_tags :'api/tag/all-associated-tags',
  search_mother: 'api/patient/search-patients',
  disengage: 'api/tag/disengage',
  get_basic_info:'api/tag/tag-by-serial-number/',

  // // READERS

  get_all_reader: 'api/reader/reader-devices',
  get_all_v2_reader : 'api/reader/v2/reader-devices',
  save_reader: 'api/reader/reader-devices',
  edit_reader: 'api/reader/reader-devices',
  get_threshold_details :'api/reader/reader-threshold/',
  post_threshold_details: 'api/reader/reader-thresholds',
  reader_device: 'api/reader/reader-devices',
  bulk_update_reader: 'api/reader/bulk-update-reader-devices',
  reader_version: 'api/reader/reader-versions',
  sync_reader: 'api/reader/sync-reader-cache',
  clear_cache: 'api/all/utility/clear-all-caches',
  get_reader_by_location: 'api/reader/readers-by-location-id',
  import_bulk_reader :'api/reader/save-readers-bulk',
  
  // // SOCIAL DISTANCE

  save_config_file: 'api/all/config-file',
  config_file_by_facility_name: 'api/all/config-file',
  schedule_info: 'api/audit-schedule/audit-schedule',

   // // Config Management
   config_file:'api/all/config',
  
  // // ASSET
  get_all_asset_stats: 'api/python-wrapper/reports/asset-summary/0/0/',
  get_all_assets: 'api/asset/v2/get-all-assets',
  get_asset_by_id: 'api/asset/get-asset',
  save_asset: 'api/asset/create-asset',
  edit_asset: 'api/asset/update-assets',
  get_asset_location_details: 'api/asset/get-asset-location-details',
  asset_report_count: 'api/asset/get-asset-count',
  asset_with_alerts : 'api/asset/asset-location-and-alert-details',
  asset_type_and_count: 'api/asset/get-asset-type-wise-count',
  mergeable_list: 'api/patient/patients-mergeable-list',
  save_merge_record: 'api/patient/merge-patient',
  mergeable_patient_list: 'api/patient/mergeable-patients-list',
  search_asset_by_categoryId: 'api/asset/assets-by-asset-type',
  search_assey_by_name: 'api/asset/get-all-search-assets',
  delete_attachment_in_asset: 'api/asset/del-asset-attachment',
  get_all_asset_maintance: 'api/asset/asset-maintenance-summary',
  get_all_asset_maintence_calendar: 'api/routine-management/entity-maintenance-calander',
  get_all_asset_maintenance_count: 'api/routine-management/maintenance-count',
  // save_asset_transfer: 'api/asset/transfer',
  save_asset_transfer:'api/asset/bulk-asset-transfer',
  get_asset_identifier: 'api/asset/asset-identifiers',
  get_asset_attach_file: 'api/asset/asset-attach-files',
  get_linked_asset:'api/asset/asset-link/',
  get_all_movement_history: 'api/location/movement-history',
  asset_loc_history : 'api/python-wrapper/reports/movement-history/0/0/',
  get_all_ambulance: 'api/asset/ambulance',
  get_linen: 'api/asset/linen',
  get_geo_location: 'api/python-wrapper/reports/totaltimebygeoloc/0/0/',
  get_geo_ambulance_location: 'api/asset/ambulance-locations',
  associate_asset_by_user: 'api/asset/associate-asset-user',
  disassociate_asset_by_user: 'api/asset/disassociate-asset-user',
  sensor_summary: 'api/asset/home-asset',
  get_asset_user_details: 'api/asset/asset-users',
  get_geo_path: 'api/python-wrapper/reports/geo-path-by-time-id/0/0/',
  get_all_department_by_id:'api/asset/asset-department/',
  get_all_transfered_linked_assets :'api/asset/linked-asset-transfer/',
  get_qr_code : 'api/asset/qr-code',
  get_bar_code :'api/asset/bar-code',
  generate_qr_code:'api/asset/generate-qr-bar-code',
  generate_bulk_qr_code:'api/asset/create-bulk-qr-bar-code',
  import_bulk_asset:'api/asset/create-bulk-assets',  
  get_category_id:'api/asset/serial-number',
  get_asset_search:'api/asset/asset-name',
  get_asset_department:'api/asset/department',
  get_audit_details:'api/asset-audit/audit',
  get_audit_schedule:'api/audit-schedule/audit-schedule',
  add_audit_schedule:'api/audit-schedule/audit-schedule',
  update_audit_schedule:'api/audit-schedule/audit-schedule',
  get_item_search:'api/item-master/v2/item-masters',
  get_inventory_details_assetId:'api/item-master/delivery-details',
  get_inventory_details_ticketId:'api/item-master/delivery-requests',
  get_item_details_assetId:'api/item-master/asset-associated-items',
  get_vendor_details:'api/asset/vendor-and-service-providers',
  get_asset_transfer_events:'api/asset/asset-transfers',
  additional_cost:'api/asset/asset-additional-cost',
  get_depreciation_schedule : 'api/asset/depreciation-schedule',
  get_additional_cost : 'api/asset/additional-cost',
  import_bulk_patient:'api/patient/ot-patients',
  get_audit_schedule_info:'api/asset/asset-audit-info',
  get_owned_assigned_userList:'api/asset/asset-owned-used-users',
  import_bulk_item:'api/item-master/item-bulk-enrolls',
  import_bulk_otprocedure:'api/health-plan/procedure-bulk-import',
  get_item_by_category:'api/item-master/item-type-link-by-categories',
  import_bulk_sterileSet:'api/health-plan/sterile-set-bulk-imports',
  get_formTemplate_entityfilter:'api/entity/entity-associations/filter',
  get_asset_connectivity : 'api/asset/asset-connectives',
  get_connectivity_assets : 'api/asset/connectivity-assets',
  get_entity_items : 'api/entity/entity-items',
  get_warranty_routines:'api/routine-management/warranty-routines',
  get_asset_Overview:'api/asset/asset-overview',
  import_bulk_inventory:'api/item-master/inventories',

  // entity WorkFlows
  get_entity_workFlows:'api/entity/entity-workflows',

  // // PATIENT

  get_all_details_patients: 'api/patient/get-all-patients',
  save_patient: 'api/patient/create-patient',
  update_patient: 'api/patient/update-patient',
  update_temporary_patients:'api/patient/temporary-patients',
  update_clinical_details: 'api/patient/update-clinical-details',
  send_patient_welcome_message: 'api/patient-visits/resend-welcome-message',
  update_patient_diabetic: 'api/patient/update-patient-diabetic',
  search_patient: 'api/patient/get-all-search-patient',
  search_inpatient : 'api/patient/search-inpatient',
  search_patients: 'api/patient/search-patients',
  get_all_mother: 'api/patient/get-all-mothers',
  update_infant: 'api/patient/update-infant-details',
  get_bed_by_mother_id: 'api/patient/patient-bed',
  // get_dq_patient_by_floor : 'api/patient/patient-digital-queues-summary/floor-wise',
  get_dq_patient_by_floor : 'api/patient/patient-digital-queues-summary',
  get_dq_patient_by_location : 'api/patient/patient-digital-queues-summary/location',
  get_dq_patient_by_worklist : 'api/patient/patient-digital-queues-summary/worklist',
  registered_patients: 'api/patient/registered-patient',
  assign_default_floor: 'api/patient/assign-default-floor',
  token_validate : 'api/patient/validate-token?tokenNo=',
  get_hc_patient_by_wait_time: 'api/patient/health-checkup-work-list',
  get_enroll_visit_option: 'api/patient/register-patient',
  save_token : 'api/token/tokens',
  update_token:'api/token/token',
  location_token : 'api/token/location-token',
  get_token_queue: 'api/token/current-token',
  group_token: 'api/token/group-location-tokens',
  token_by_location : 'api/token/locations',
  token_count:'api/token/latest-token',
  search_token : 'api/token/tokens/',
  phone_validate: 'api/all/utility/phone-validate', 
  get_ot_card: 'api/patient/ot-patient-queues',
  floor_count:'api/token/floor-count',
  get_multi_dq_patient_by_worklist: 'api/patient/token-queue-detail',
  get_patient_report_history: 'api/patient/visit-report',

  // //PATIENT VISIT

  check_health_plan: 'api/patient-visits/get-health-plan-patients',
  update_patient_queue_status: 'api/patient-visits/update-queue-status',
  get_health_checkup_patient: 'api/patient-visits/get-health-checkup-patients',
  check_individual_health_plan: 'api/patient-visits/get-plan-info',
  save_quick_registration: 'api/patient-visits/quick-patient-register',
  get_all_health_plan: 'api/patient-visits/get-all-health-plans',
  get_patient_info: 'api/patient-visits/get-patient-test-status-list',
  get_all_health_test_locations: 'api/location/get-all-locations-by-id',
  get_patient_by_location: 'api/patient/location-patient',
  update_queue_status_location: 'api/patient-visits/update-queue-status-location',
  publish_test_status: 'api/patient-visits/publish-test-status',
  cancel_billing: 'api/patient-visits/cancellation',
  hc_patientlist_with_billed: 'api/patient-visits/hc-patientlist-with-billed',
  ip_discharge_patient: 'api/patient-visits/discharge-patient',
  day_care_check_in: 'api/patient-visits/day-care-check-in',
  // visit_history: 'api/patient-visits/patient-visits',
  visit_history: 'api/patient-visits/v2/patient-visits',
  healthcheck_visit_update: 'api/patient-visits/patient-visit',
  queue_status_count:'api/patient/queue-status-counts',
  get_ot_patient_queue: 'api/patient/ot-patient-queue-summary',
  get_ec_patient_queue: 'api/patient/emergency-care-patient-queue-summary',
  get_booked_entities: 'api/patient-visits/booked-entities',

  // PORTER
  get_all_created_request: 'api/porter/get-all-porter-requests',
  porter_request_subject: 'api/porter/patients-or-assets-by-porter-req-type',
  get_porter_request_details: 'api/porter/get-porter-request-by-request-id',
  get_porter_history: 'api/porter/request-events',
  porter_request_status_update: 'api/porter/update-porter-request-status/',
  get_waitlist_reason: 'api/request/waitlist-reason/',
  //  New services for porter request

  get_all_porter_request: 'api/porter/porter-requests',
  get_request_detail : 'api/request/req-det-performer',
  request_detail_ack : 'api/request/detail-ack',
  get_tag_request : 'api/tag/requests',
  search_available_porter: 'api/porter/available-porters',
  save_porter_request: 'api/porter/porter-requests',
  pwa_porter_request: 'api/all/external/pwa-request',
  update_porter_request_status: 'api/porter/porter-request-status',
  save_entity_booking_patinet : 'api/booking/entity-booking/asset',
  get_entity_booking_patinet: 'api/booking/entity-booking/asset',
  // porter_request_subject: 'api/porter/patient-by-porter-req-type', # old name may 28 2019 by Rahul

  // Ambulance
  search_available_amb: 'api/porter/available-ambulance',
  amb_request: 'api/porter/ambulance-requests', 
  update_amb_request_status: 'api/porter/ambulance-request-status',
  
  // Ticket 
  save_ticket_request: 'api/all/ticket/ticket-request',
  update_ticket_request: 'api/all/ticket/ticket-requests',
  get_all_ticket_request: 'api/all/ticket/ticket-requests',
  get_all_attachment: 'api/all/ticket/ticket-url',

  // // CUSTOMER
  save_customer: 'api/customer/create-customer',
  update_customer: 'api/customer/update-customer',
  get_customer_logo: 'api/customer/get-customer-logo-image',
  get_customer_bg_image: 'api/customer/get-customer-bg-image',
  get_all_customer: 'api/customer/get-all-customers',
  get_customer_list: 'api/customer/get-all-customers-list',
  get_region_list: 'api/customer/get-all-region-list',
  get_facility_list: 'api/customer/get-all-facility-list',
  get_all_facility_by_customerId: 'api/customer/get-all-facility',
  v3_get_all_facility_by_customerId: 'api/pf-gateway/get-all-facility',
  get_non_associate_facility: 'api/customer/non-associate-facilities',
  delete_customer: 'api/customer/delete-customer',
  get_facility_by_id: 'api/customer/get-facility-by-id',
  get_all_customer_role: 'api/customer/customer-roles',
  save_customer_role: 'api/customer/assign-customer-role',
  // // LOCATION

  get_location_by_id: 'api/location/get-location-by-id',
  logical_location_by_id: 'api/location/location-by-id',
  get_all_location: 'api/location/get-all-locations', // only floor and its location
  get_all_logical_location: 'api/location/get-all-logical-locations',
  get_logical_location: 'api/location/location', // floor with logical and its location
  get_all_floor_locations: 'api/location/get-location-by-location-type',
  get_all_location_by_id: 'api/location/get-all-locations-by-location-id',
  get_all_location_type: 'api/location/get-all-locations-type',
  get_image_location_by_id: 'api/location/get-location-image/',
  save_location: 'api/location/create-location',
  get_all_block_list: 'api/location/get-all-blocks',
  update_location: 'api/location/update-location',
  update_floor_direction : 'api/location/update-coordinates-location-by-id',
  get_from_location_id: 'api/location/get-location-by-id',
  get_to_location_search: 'api/location/get-search-locations',
  get_uhid: 'api/patient/patient-details',
  get_tag_costers: 'api/tag/coasters',
  asset_alert : 'api/asset/asset-alerts',
  get_all_tag_by_type: 'api/tag/v2/non-associated-tags',
  get_MR_tag: 'api/asset/non-mapped-assets',
  location_detail: 'api/location/get-all-locations-with-children',
  location_with_children: 'api/location/locations',
  logical_location_with_children: 'api/location/v2/locations',
  delete_location: 'api/location/delete-location',
  get_floor_list : 'api/location/all-floors',
  get_bed_location_search: 'api/location/bed-search-locations',
  location_track : 'api/location/tracking-master',
  get_all_logical_location_type: 'api/location/get-all-logical-location-types',
  location_apply_all: 'api/location/apply-all',
  get_ambulance_location: 'api/customer/facilities',
  get_nearest_amb_facility: 'api/porter/facility-ambulance',
  get_all_location_list: 'api/location/location-list',
  // Node
  save_node: 'api/node/create-node',
  get_node: 'api/node/get-all-nodes',
  delete_node: 'api/node/delete-node/',
  delete_all_node: 'api/node/v2/delete-node',
  get_exit: 'api/node/get-all-exit',
  get_type: 'api/lookup-terms/v2/get-app-terms/NodeType',

  // TICKET

  get_all_tickets: 'api/all/ticket/tickets',
  save_ticket: 'api/all/ticket/tickets',
  save_all_ticket: 'api/all/ticket/tickets',
  edit_ticket: 'api/all/ticket/tickets',
  delete_attachment_in_ticket: 'api/all/ticket/ticket-attachments',

  // USER
  updated_by_mail:'api/all/message/send-report',
  get_user_locations: 'api/user/user-locations',
  get_user: 'api/user/get-all-users',
  get_user_v2: 'api/user/v2/get-all-users',
  get_user_list: 'api/user/users-list',
  get_user_count:'api/request/mustering/user-counts',
  get_login_user: 'api/login/login-users',
  user_logout: 'api/user/logout',  
  import_bulk_user: 'api/user/save-bulk-users',
  search_by_email: 'api/user/check-email',
  search_by_phoneno: 'api/user/check-phoneNumber',
  search_by_username: 'api/user/check-userName',
  search_all_user: 'api/user/get-all-users-by-filter',
  search_doctor: 'api/user/staffs',
  createuser : 'api/all/createuser', 
  get_entity_availablity_list: 'api/entity/entity-availability-list',
  // roleid:'api/all/auth/get-all-roles',
  search_name_by_recipient_type: 'api/user/user-list-or-role-list',
  get_user_by_id: 'api/user/get-userDetails-by-Id',
  get_staff_routine_list : 'api/user/staffs-routine-list',
  get_all_shift: 'api/booking/shift-master-details',
  get_shift: 'api/booking/entity-schedule',
  assign_to_task: 'api/booking/assign',
  add_break: 'api/booking/break-event',
  cancel_break: 'api/booking/entity-event',
  get_all_departments: 'api/user/departments',
  get_user_department_links: 'api/entity/department-links',
  get_attendance_event: 'api/attendance-event/events',
  schedule_user: 'api/user/schedule-users',
  scheduled_user: 'api/user/scheduled-users',
  get_activity_performer: 'api/request/performers-by-activity-id',
  post_department: 'api/department/departments',
  put_departemnt: 'api/department/departments',
  schedule_exceptions: 'api/calendar/entity-schedule-exceptions',
  get_role_base_user: 'api/user/users-filter',
  cencel_patient_visits:'api/patient-visits/cancel-ot-visit',
  get_patient_user: 'api/user/patient-users',
  // Task
  get_user_detail_by_locId: 'api/user/users-by-location-id',
  save_task: 'api/porter/task',
  task_history: 'api/porter/task-history',
  update_task_routine_status: 'api/routine-management/update-entity-event-status',
  undo_task_routine: 'api/routine-management/activity-undo',
  updateServicePersonDetails:'api/request/notify',
  getcurrentStateTaskNotification:'api/notification/notification-by-identifier',
  getsafetyevents : "api/routine-management/safety-events",
  categoryBased_event_task_history: 'api/porter/n8n-work-flows',

  // RULE ALERT
  pf_rule_api: 'api/rule-alert/pf-rules',
  alert_config_api: 'api/rule-alert/pfalert-configs',
  alert_config_api_by_id: 'api/rule-alert/pfalert-configs-by-id',
  alert_config_api_update: 'api/rule-alert/pfalert-configs',
  alert_api: 'api/rule-alert/iot-alert',
  get_mother_infant_alerts: 'api/patient/mother-infant-alerts',
  close_alert_api: 'api/rule-alert/close-alert',
  ack_alert : 'api/rule-alert/is-acknowledge',
  assign_alert: 'api/request/inpatient-request',
  ip_alert_history: 'api/rule-alert/alert-history',
  get_reader_id: 'api/reader/details-by-floorId-and-readerType',
  get_alert_health_package: 'api/health-plan/health-packages',
  get_alert_health_tests: 'api/health-test/health-plan-tests',
  get_alert_routine: 'api/routine-management/routine-list',
  get_alert_routine_activity: 'api/routine-management/routine-activity-list',
  get_tag_id: 'api/tag/v2/tag-filters',
  get_tag_filter: 'api/tag/v2/tag-filters',
  get_alert_task_count : 'api/ip-patient/alert-and-task-counts',
  get_alert_rule_template: 'api/channel/channel-templates',
  get_alert_details: 'api/rule-alert/notifications',

  // Health Test Rule

  get_all_health_test_rule: 'api/health-test-rule/health-test-rules',
  save_health_test_rule: 'api/health-test/health-tests',
  get_all_health_test_location: 'api/health-test/location-health-tests',
  get_all_unmapped_test : 'api/health-test/unmapped-health-tests',

  // SSE
  sse_api: 'api/rule-alert/noti',

  // AUTH
  
  // user_login: 'api/all/auth/login' //old user login api
  user_login: 'api/all/auth/login/v2',
  login_token: 'api/all/auth/token-login',
  qr_login: 'api/all/auth/qr-login',
  save_user: 'api/all/auth/signup-user',
  get_role: 'api/all/auth/get-all-roles',
  get_renew_token: 'api/all/auth/renew-token',
  forget_password: 'api/all/auth/forget-password',
  reset_password: 'api/all/auth/reset-password',
  change_password: 'api/auth/change-password',
  get_current_user: 'api/auth/get-current-user',
  edit_user: 'api/auth/updateuser',
  basic_login: 'api/all/auth/basic-login',
  infant_event: 'api/infant-event/infant-events',
  user_resetpassword: 'api/all/auth/reset-password',

  // PYTHON
  // For Dynamo DB
  // hc_patient_status: 'api/python-wrapper/reports/patientstatus-hc/0/0/',
  // hc_average_time_in_location: 'api/python-wrapper/reports/avgtimeinloc-hc/0/0/',
  // hc_average_time_between_location: 'api/python-wrapper/reports/avgtimebtwloc-hc/0/0/',
  // hc_utilization_in_location: 'api/python-wrapper/reports/patientintime-hc/0/0/',
  // hc_patient_count_in_location: 'api/python-wrapper/reports/countactivetaginloc/0/0/',
  // hc_patient_visit_count_in_location: 'api/python-wrapper/reports/counttaginloc/0/0/',
  // get_shortestpath: 'api/python-wrapper/reports/shortestpath/0/0/',
  // cur_tag_loc: 'api/python-wrapper/reports/totaltimebyloc/0/0/',
  // For Click House Database

  //for dashboard management
  //Python
  dashboard_management : 'api/python-wrapper/reports/dashboard-management/0/0/',
  dashboard_update : 'api/python-wrapper/reports/dashboard-update/0/0/',
  layout_update : 'api/python-wrapper/reports/dashboard-layout/0/0/',
  user_layout : 'api/python-wrapper/reports/user-layout/0/0/',
  //JAVA
  //new 
  current_dashboard : 'api/all/dashboard/current-dashboard',
  dahsboard_by_id : 'api/all/dashboard/dashboards-by-ids',
  dashboard_user_widget: 'api/all/dashboard/user-widgets',
  dashboard_details_list: 'api/all/dashboard/dashboard-list',
  dashboard_widget_data: 'api/widget/widget-data',
  dashboard_layout_delete_by_id: 'api/all/dashboard/dashboards',
  
  // old
  dashboard_all_details : 'api/all/dashboard/get-all-widgets-by-user',
  dashboard_layout_save : 'api/all/dashboard/save-dashboard-widget-layouts',
  dashboard_layout_update : 'api/all/dashboard/update-dashboard-widget-layouts',

  // Widget management
  get_widget_list : 'api/widget/pf-widgets',
  get_pf_models : 'api/pf-model/pf-models',
  get_widget_templates : 'api/widget/widget-templates',
  save_widget_detail_by_id: 'api/widget/pf-widget-details',
  save_widget_detail: 'api/widget/pf-widgets',
  save_widget_model: 'api/widget/pf-models',
  get_pf_mode_data: 'api/pf-model/model-data',

  // Form mangement
  get_form_templates : 'api/pf-form-template/pf-form-templates',
  get_form_templates_v2 : 'api/pf-form-template/v2/pf-form-templates',
  get_dataitem : 'api/widget/dataitem',
  save_form_template : 'api/pf-form-template/pf-form-templates',
  entity_form : 'api/entity-form/entity-forms',
  entity_detail_by_form : 'api/entity-form/entity-forms-details',
  asset_transfer_history : 'api/asset/asset-transfer',
  get_entity_form_history : 'api/entity-form/entity-form-histories',
  latest_transfer_detail:'api/asset/asset-recent-transfer/',
  get_entity_association: 'api/entity/entity-association-by-entity-types',
  get_unique_entity_associations: 'api/entity/unique-entity-associations',
  save_entity_association: 'api/entity/entity-associations',

  // For maintenance report
  maintenance_report : 'api/python-wrapper/reports/maintenancerep/0/0/',
  // staff attendance report
  emp_attendance : 'api/python-wrapper/reports/emp-attendance/0/0/',
  emp_attendance_all : 'api/python-wrapper/reports/emp-attendance-all/0/0/',
  emp_asset : 'api/python-wrapper/reports/emp-asset/0/0/',

  //health check reports
  out_patient : 'api/python-wrapper/reports/patient-status-op/0/0/',
  patient_contact: 'api/python-wrapper/reports/pat-contact/0/0/',
  patient_contact1: 'api/python-wrapper/reports/pat-contact/0/0/',
  patient_move: 'api/python-wrapper/reports/patientmove/0/0/',
  patient_fall: 'api/python-wrapper/reports/patientfall/0/0/',
  newborn_summary: 'api/python-wrapper/reports/newborn-summary/0/0/',
  asset_move: 'api/python-wrapper/reports/asset-move/0/0/',
  asset_transfer: 'api/python-wrapper/reports/asset-transfer/0/0/',
  nurse_call: 'api/python-wrapper/reports/nurse-call/0/0/',
  staff_attendance: 'api/python-wrapper/reports/staff-attendance/0/0/',
  employee_attendance: 'api/python-wrapper/reports/emp-summary-rep/0/0/',
  patient_journey : 'api/python-wrapper/reports/pat-journey/0/0/',
  visitor_site_navigation : 'api/python-wrapper/reports/site-nav/0/0/',
  in_patient : 'api/python-wrapper/reports/patient-status-ip/0/0/',
  day_care : 'api/python-wrapper/reports/patient-status-dc/0/0/',
  roll_call : 'api/python-wrapper/reports/roll-call/0/0/',
  vitals_chart : 'api/python-wrapper/reports/vitals-chart/0/0/',
  hc_patientlist : 'api/python-wrapper/reports/hc_patientlist/0/0/',
  // hc_patientlist_with_billed: 'api/python-wrapper/reports/hc_patientlist_with_billed/0/0/',
  hc_packagelist : 'api/python-wrapper/reports/hc_packagelist/0/0/',
  hc_testlist : 'api/python-wrapper/reports/hc_testlist/0/0/',
  hc_patient_summary : 'api/python-wrapper/reports/hc_patient_summary/0/0/',
  patient_summary : 'api/python-wrapper/reports/pat-summary/0/0/',
  employee_summary : 'api/python-wrapper/reports/emp-summary/0/0/',
  hc_queue_status: 'api/python-wrapper/reports/hc_queue_status/0/0/',
  hc_patient_status2 : 'api/python-wrapper/reports/patient-status/0/0/',
  hc_plan_summary: 'api/python-wrapper/reports/hc_plan_summary/0/0/',
  hc_test_summary: 'api/python-wrapper/reports/hc_test_summary/0/0/',
  ot_complex_utilization : 'api/python-wrapper/reports/OT-Rep/0/0/',      //for ot utilization
  hc_patientlist2 : 'api/python-wrapper/reports/hc_patientlist2/0/0/',
  hc_plan_summary2: 'api/python-wrapper/reports/hc_plan_summary2/0/0/',
  hc_test_summary2: 'api/python-wrapper/reports/hc_test_summary2/0/0/',
  get_coaster_detail: 'api/python-wrapper/reports/coaster-details/0/0/',
  get_geofence_detail : 'api/python-wrapper/reports/geofencevio/0/0/',
  emp_geofence_detail : 'api/python-wrapper/reports/emp-geofencevio/0/0/',
  visitor_summary : 'api/python-wrapper/reports/visitor-summary/0/0/',
  temp_id_summary: 'api/python-wrapper/reports/temp-id-summary/0/0/',
  temporary_staff_summary : 'api/python-wrapper/reports/temporary-staff-summary/0/0/',

  hc_open_encounter : 'api/python-wrapper/reports/open-encounter/0/0/',
  hc_patient_report: 'api/python-wrapper/reports/patientreport/0/0/',
  patient_sample_coll: 'api/python-wrapper/reports/pat-sample-coll/0/0/',
  get_forecasted_report: 'api/python-wrapper/reports/forecastedreport/0/0/',
  hc_location_utilization: 'api/python-wrapper/reports/hc_location_utilization/0/0/',
  op_tat_report: 'api/python-wrapper/reports/TAT-OP/0/0/',
  emp_loc_rep : 'api/python-wrapper/reports/emp-loc-rep/0/0/',
  sensor_details : 'api/python-wrapper/reports/sensr-raw/0/0/',


  hc_patient_status: 'api/python-wrapper/reports/patientstatus-hc/0/0/',
  hc_average_time_in_location: 'api/python-wrapper/reports/avgtimeinfacility/0/0/',
  hc_average_time_between_location: 'api/python-wrapper/reports/avgtimebtwloc/0/0/',
  hc_utilization_in_location: 'api/python-wrapper/reports/patientintime-hc/0/0/',
  hc_patient_count_in_location: 'api/python-wrapper/reports/counttag/0/0/',
  hc_patient_visit_count_in_location: 'api/python-wrapper/reports/counttag/0/0/',
  get_shortestpath: 'api/python-wrapper/reports/shortestpath/0/0/',
  cur_tag_loc: 'api/python-wrapper/reports/totaltimebyloc/0/0/',
  env_sensor: 'api/python-wrapper/reports/env-sensor/0/0/',
  gas_sensor: 'api/python-wrapper/reports/gas-sensor/0/0/',
  track_tag_history: 'api/python-wrapper/reports/taghistory/0/0/',
  get_bed_occupency: 'api/python-wrapper/reports/bed-occupency/0/0/',
  get_employee_summary : 'api/python-wrapper/reports/emp-summary-db/0/0/',
  get_employee_socialDistancing : 'api/python-wrapper/reports/emp-sd-agg/0/0/',
  get_hazard_reader_config: 'api/python-wrapper/reports/hazard-reader-config/0/0/',
  // OAuth token key
  oauth_login_token : 'twapp:TWClient@2020',

  // menu items list
  menu_item_list: 'api/menu-item/menus',

  // config file
  config_url : 'api/all/config-file',
  user_random_code : 'api/all/utility/random-code',

  //msgcnter for portermanagement
  send_Message:'api/notification/notifications',
  get_Message:'api/notification/notification-history',

  // global search today based filter
  global_search_today: 'api/global-search/search-patient-details',
  global_search_by_key: 'api/search/global-search',
  global_search_v2: 'api/global-search/global-search',

  // Outpatient Modules URL list
  get_op_patients_list: 'api/patient/op-patients-list',
  get_outpatient_info: 'api/patient-visits/op-patient-test-status-list',
  get_ippatient_info: 'api/patient-visits/patient-test-status-list',

  get_ip_patient_list: 'api/ip-patient/ip-patients',
  get_ip_patient_info: 'api/ip-patient/ip-patient-summary',
  get_ip_patient_info_by_id: 'api/ip-patient/ip-patient-visits',
  get_ip_speciality_loc: 'api/location/locations-by-location-category',
  get_porter_request_by_id: 'api/porter/porter-requests',
  get_monitor: 'api/patient-visits/patient-display-visits',
  locations_by_readerType:'api/reader/locations-by-readerType',
  sound_sensor : 'api/raw-data/sound-sensor',

 //get all patient data
  get_all_patient_details:'api/patient/patient',    
  get_entity_detail :'api/patient/entity-details',
  update_all_patient_details: 'api/patient/patient-details',
  get_health_Plan_templates: 'api/health-plan/page-templates',

  // Medical Record
  get_medical_record: 'api/patient-file/mr-file-requests',
  generate_volume: 'api/patient-file/generate-volume',
  get_volume: 'api/patient-file/volume-list',
  get_all_volume: 'api/patient-file/dispatched-file-details',
  dispatch_volume: 'api/patient-file/dispatch-mr-files',
  receive_volume: 'api/patient-file/receive-mr-files',

  // Chat-bot
  chat_conversation: 'api/chat/conversations',
  chat_message: 'api/chat/messages',
  sse_chat : 'api/sse/connect',
  chat_user_conversations: 'api/chat/user/conversations',

  // COASTER MESSAGE CENTRE
  tag_management_filter1: 'api/tag/tag-management-filter1',
  get_coaster_response: 'api/lookup-terms/v2/get-app-terms',
  save_message: 'api/rule-alert/v1/broadcast-message',
  get_coaster_message: 'api/rule-alert/iot-broadcast-alert',
  get_location_list: 'api/public/customer/track/track-tag-location/',
  get_role_list1: 'api/all/auth/get-all-roles',
  get_role_list: 'api/all/auth/get-all-depts',

  // SCHEDULE
  get_all_report_schedule: 'api/schedule/report',
  save_report_schedule: 'api/schedule/report',
  update_report_schedule: 'api/schedule/report',
  schedule_cron_restart : 'api/all/utility/reconfigure-scheduler',

  // calender
  get_all_holidays : 'api/calendar/holidays',
  update_holidays : 'api/calendar/holiday',
  get_all_entity_group_det : 'api/calendar/entity-groups',
  update_entity_group_det : 'api/calendar/entity-group',
  get_entity_exceptions : 'api/calendar/entity-group-exceptions',
  get_entity_group_details : 'api/calendar/entity-group-details',
  get_entity_group : 'api/calendar/entity-group-mappings',
  get_entity_shifts : 'api/calendar/entity-shifts',
  update_shifts: 'api/calendar/entity-shifts',
  get_date_wish_shifts: 'api/calendar/date-wise-shifts',
  // LOG
  get_audit_log_report: 'api/logging/audit-data',
  get_error_log_report: 'api/logging/application-errors',

  // EMPLOYEE
  employee_controller: 'api/employee/employees',
  import_bulk_employee: 'api/employee/employees/bulk-load',

  // VISITORS
  visitor_controller: 'api/visitor/visitors',
  schedule_visitor:'api/visitor/visitor-schedule',
  visitor_Events: 'api/visitor/visitor-events-status',
  visitor_EventList: 'api/visitor/visitor-events',

  //KPI
  get_kpi: 'api/kpi-master/kpi-masters',

  // TEMPORARY ID CARD
  employee_id_cards: 'api/employee/employee-id-cards',
  search_by_mainidentifer: 'api/employee/employees/search-by-mainidentifer',

  // SOFTWARE VERSION IN READER
  get_software_version: 'api/reader/reader-versions',
  save_software_version: 'api/reader/reader-version',
  get_software_version_history: 'api/reader/reader-version-history',

  // ACTIVITIES
  get_all_activities: 'api/routine-management/activities',
  get_all_taskactivities: 'api/routine-management/activities',

  // ROUTINE-MANAGEMENT
  get_activity: 'api/routine-management/activity-names',
  get_all_routine: 'api/routine-management/routines',
  get_routine_activities: 'api/routine-management/routine-activities',
  get_routine_name: 'api/routine-management/search-routines',
  get_routine_list: 'api/routine-management/activity-list',
  add_routine: 'api/routine-management/entity-routine',
  activate_routine: 'api/routine-management/activate-routine',
  get_role_routine: 'api/routine-management/v2/entity-routine-activities',
  get_ip_routine: 'api/ip-patient/ip-routine-activity',
  end_routine: 'api/routine-management/end-routine',
  cancel_routine: 'api/routine-management/cancel-routine',
  ip_routine_history: 'api/ip-patient/patient-routine-activity-history',
  routine_event_details: 'api/routine-management/entity-routine-activity-events',
  get_multiple_routine: 'api/routine-management/v2/entity-routine-activities',
  get_all_manage_routine: 'api/routine-management/entity-routines',
  create_routine: 'api/routine-management/v1/entity-routine',
  entity_activity_save: 'api/routine-management/entity-routine-activity',
  get_rouitine_by_entity: 'api/routine-management/events-and-requests',
  end_Routine : 'api/routine-management/v1/end-routine' ,
  get_mapped_activity: 'api/routine-management/applicable-activity-rule',
  multiple_entity_routine: 'api/routine-management/entity-routine/batch',
  get_mustering_history : 'api/request/mustering-histories',
  //ACTIVITY-RULE
  all_activity_rule: 'api/routine-management/pf-activity-rule',
  get_all_activity_rule: 'api/routine-management/activity-rule',

  // TW TABLE
  get_tag_associated_details: 'api/public/customer/track/track-associate',
  get_tag_battery_status: 'api/tag/tags/battery-status/Tag',
  get_reader_status: 'api/tag/tags/battery-status/Reader',
  get_mother_infant_alert_count: 'api/patient/mother-infant-alert-count',

  // CONSUMERS
  consumer_details: 'api/consumer/consumer',
  consumer_device_history: 'api/tag/tag-association-link-history',

  // PACKAGE
  health_plan_detail: 'api/health-plan/health-plan-detail',
  get_health_plan_souceId: 'api/health-plan/check-health-plan',

  // User Preference
  user_preferences: 'api/user/preferences',

  // Medical Records
  // mr_create_request: 'api/all/external/mr-request',
  mr_create_request: 'api/patient-file/mr-file-requests',

  // Task
  task_details: 'api/booking/entity',
  get_task_report: 'api/python-wrapper/reports/staff-tracking-req/0/0/',
  get_activity_task_details: 'api/request/porter-requests',
  get_all_new_task: 'api/request/all-tasks',
  get_all_task_jobs: 'api/request/my-jobs',
  get_task_by_hierachy:'api/request/tasks-and-workOders',
  //Advertisement
  create_order_Entry: 'api/release/v1/order',
  edit_order_entry: 'api/release/v1/orders',
  create_RO_Activity: 'api/release/v1/campaign/activities',
  edit_RO_Activity: 'api/release/v1/campaign/activities',
  get_all_RO: 'api/release/release-orders',
  get_all_campaign: 'api/release/order-campaign',
  get_all_RO_activity: 'api/release/activities',
  creat_agent: 'api/client-detail/client',
  update_agent: 'api/client-detail/client',
  createAgent_address: 'api/entity-address/address',
  editAgent_address: 'api/entity-address/address',
  get_all_agent: 'api/client-detail/clients',
  get_all_agent_address: 'api/entity-address/address',
  get_pf_workflow: 'api/pf-form-template/pf-workflows',

  //supplier
  manage_supplier: 'api/consumable/suppliers',
  get_supplier: 'api/consumable/suppliers',

  //item-master
  get_all_items: 'api/item-master/item-masters',
  create_item_master: 'api/item-master/item-masters',
  get_asset_catalogs:"api/asset/asset-catalogs",
  get_asset_model_no: 'api/asset/asset-ids',
  get_item_master_attachment:"api/all/file/file-url",
  delete_item_attachment:"api/all/file/attachments",
  item_link_asset: "api/item-master/item-asset-links",
  item_master_link :"api/item-master/item-master-links",
  existing_item :"api/item-master/validate-batch-and-purchase-order-ids/",
  search_manufacturer:"api/asset/manufacturers",
  search_modelNo:'api/asset/identifiers',

  //inventory
  get_inventory: 'api/item-master/inventories',
  create_inventory: 'api/item-master/inventories',
  // intend
  get_all_intend: 'api/item-master/delivery-requests',
  delivery_request: 'api/item-master/delivery-requests',
  get_by_batch_Id: 'api/item-master/batch-ids',
  get_sales_routine_order: 'api/routine-management/sales-order',
   //mobile Api
   get_mobile_items: 'api/entity/entity-associations', 
   
   //entity Association based forms 
   get_entity_associated_forms:'api/entity/entity-associations/forms',

   //pwa login
  send_Otp :'api/all/auth/send-otp-patient',
  verify_Otp :'api/all/auth/verify-otp-login',
  guest_user : 'api/all/auth/guest',
  
  //OT-PROCEDURE
  get_ot_procedure :'api/health-plan/ot-procedures',
  get_ot_specialty : 'api/health-plan/specialty',

  //Role
   save_role : 'api/auth/roles',
   get_roleCode : 'api/auth/role-code-exists',

  // notifications 
  get_notifications: 'api/rule-alert/user-notification',
  notification_update: 'api/rule-alert/alerts/noti-tran-history',
  notification_count: 'api/rule-alert/alert-count',

  //taskcount
  get_task_count :'api/request/task-count',

  //getUserDetails for pharamcy Acknowledge
  get_user_details_name:'api/user/mobile-users',

  // Calandar 
  get_entity_booking:'api/entity/booking',
  get_entity_timeLine:'api/entity/timeline',
  check_entity_booking: 'api/booking/entity-bookings',
  get_request_booking: 'api/booking/booked-entities',
  // resource template 
  save_resource_tamplate: 'api/health-plan/page-templates',

  // Sterlie Set
  get_sterlieset_list : 'api/health-plan/v1/sterile-sets',
  save_sterlieset_list : 'api/health-plan/sterile-sets',

  // Cssd Request
  get_set_resquest_list : 'api/request/sterile-set-requests',
  
  // config Roll 
  get_roll_list: 'api/all/auth/get-all-roles',

  // attachment_Visitor
  save_attach_file : 'api/all/file/file-attachment',
  baseUrl : 'api/python-wrapper/reports/',
  nodeWrapperBaseUrl : 'api/nodejs-wrapper/',

  //meeting 
  push_notification:'api/agora-video/agora-video-call',
  userList : 'api/agora-video/channel',
  userStatus : 'api/agora-video/channel',
  inviteUser : 'api/agora-video/invite-user',

  //reminder alert notification
  sla_notification: 'api/rule-alert/pf-alert-reminder-sla',

  ticket_remarks : 'api/porter/request-events',

  //entitybased Kpi
  get_entity_kpi_details:'api/kpi-master/entity-kpi',
  get_entity_kpi_templates :'api/kpi-master/kpi-masters',

  //door-controller
  get_door_controller_details:"api/pf-config/pf-config-filter",
  update_door_controller_details:"api/pf-config/pf-configs/",
  get_door_history:"api/entity/entity-contact-events",
  
  //group appterms
  get_group_appterms:"api/lookup-terms/v2/app-terms",
  
//API KEY
  get_apikey: 'api/all/auth/customer-tokens',

//shift-masters
save_shift_master:'api/booking/pf-shift-masters' ,

// patient-relations :
save_patient_relation : 'api/patient-relation/patient-relations',
get_patient_relation : 'api/patient-relation/patient-relations',
put_patient_relation : 'api/patient-relation/patient-relations-all',


 outpatient_reports : [
  {'id': 'patient-status-op', 'name' : 'Out Patient Summary', 'code' : 'WD_AIPROP'},
  {'id': 'out_patient_TAT', 'name' : 'TAT Report Out Patient', 'code' : 'WD_AIPROPTAT'},
  {'id': 'geofencevio', 'name' : 'Geo Fence Violation Report', 'code' : 'WD_AIPRGV'}
    ],

 n8n_create_from : 'webhook/ai/createform',
 n8n_form_generation: 'webhook/formGeneration',

 //Approval matrix
 get_approval_matrix:'api/request/workflow-approval-histories',

  //User Guide
 get_user_guide_list:'api/user-guide/guides',
 save_user_guide:'api/user-guide/guide',
 get_user_guide_code:'api/user-guide/guide',
};
