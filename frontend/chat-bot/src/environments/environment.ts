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
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import { base_value } from './environment.base';

export const environment = {
  version : require('../../package.json').version,
  base_value,
  production: false,
  localStyle: false,
  firebaseConfig: {
    apiKey: "AIzaSyA4GogMguLRpd0wSXG8HfGbqW2pb_-Ko0g",
    authDomain: "twfirebase-v1.firebaseapp.com",
    projectId: "twfirebase-v1",
    storageBucket: "twfirebase-v1.appspot.com",
    messagingSenderId: "412793295863",
    appId: "1:412793295863:web:0a7dbaf93140f58f6ad4f2",
    measurementId: "G-73D8MBGX9F",
    vapidKey: "BKflwhoZB7rf6qh6yPaJyAJgPeNWz50p-1ed1cr-jf-BWNtaFUUh8NnbomNLEBMe7RtbeBtRXwu4HTmw8L16S_Y"
  },

  // env_key: "prod",
  env_key: 'dev',
  // api_base_url_new: 'https://twwebapi.apollohospitals.com/live/',
  api_base_url_new: 'https://demoapi.trackerwave.com/',
  chatbotApiUrl: 'http://localhost:8000/',
  // api_base_url_new: 'https://twdevapi.trackerwave.com/dev/',
  // api_base_url_new: 'http://192.168.29.128:4040/',
  // api_base_url_new:'https://liveapi.trackerwave.com/live/',
  /* new url for pre-prod */
  serverPdfURL: 'http://ec2-65-0-217-218.ap-south-1.compute.amazonaws.com:8000/',
  // serverPdfURL: 'http://ec2-65-0-217-218.ap-south-1.compute.amazonaws.com:9000/',
  // sk : "6Lcz-j8nAAAAACVdRx3YsnudNdHOpLKZc1itJSOm",
  sk : "6LeLuB4nAAAAALZ77IMo8NxC5oAefAr1VyoRpQIc",
  n8n_baseurl : 'https://wflow.demo.trackerwave.com/',
  setCookie : false,
  serviceWorker : false,
  ck : "1",
  pwd_check : false,
  fcm_Enable: false,
  idle_time_out: 4 * 60 * 60,
  languages : [
    { code: 'en', label: 'English', tooltip: 'English' },
    { code: 'ar', label: 'العربية', tooltip: 'Arabic' },
    { code: 'pt', label: 'Português', tooltip: 'Portuguese' }
  ],
  outpatient_reports : [
    {'id': 'patient-status-op', 'name' : 'Out Patient Summary', 'code' : 'WD_AIPROP'},
    {'id': 'out_patient_TAT', 'name' : 'TAT Report Out Patient', 'code' : 'WD_AIPROPTAT'},
    {'id': 'geofencevio', 'name' : 'Geo Fence Violation Report', 'code' : 'WD_AIPRGV'}
  ],
  BLOB_URI: 'https://stagekynsrg.blob.core.windows.net/'
};
