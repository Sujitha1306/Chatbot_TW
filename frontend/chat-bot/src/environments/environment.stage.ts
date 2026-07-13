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
// `ng build --env=stage` then `environment.stage.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import {base_value} from './environment.base';

export const environment = {
  version : require('../../package.json').version,
  base_value,
  production: true,
  env_key: 'stage',
  localStyle: false,
  api_base_url_new: 'https://stgapi.trackerwave.com/uat/',
  n8n_baseurl : 'https://n8n.trackerwave.com/',
  languages : [
    { code: 'en', label: 'English', tooltip: 'English' },
    { code: 'ar', label: 'العربية', tooltip: 'Arabic' },
    { code: 'pt', label: 'Português', tooltip: 'Portuguese' },
    { code: 'th', label: 'ไทย', tooltip: 'Thai'}
  ],
  setCookie : false,
  sk : "6LeLuB4nAAAAALZ77IMo8NxC5oAefAr1VyoRpQIc",
  ck : "6",
  pwd_check : true,
  fcm_Enable: false,
  serviceWorker : true,
  idle_time_out: 24400,
  serverPdfURL: 'http://ec2-65-0-217-218.ap-south-1.compute.amazonaws.com:8000/',
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
  BLOB_URI: ''
};

