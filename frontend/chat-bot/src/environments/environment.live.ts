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
import {base_value} from './environment.base';

export const environment = {
  version : require('../../package.json').version,
  base_value,
  production: true,
  env_key: 'prod',
  localStyle: false,
  serviceWorker : true,
  // api_base_url_new: 'https://liveapi.trackerwave.com/',
  api_base_url_new: 'https://twwebapi.southindia.cloudapp.azure.com/live/',
  n8n_baseurl : 'https://n8n.trackerwave.com/',
  languages : [
    { code: 'en', label: 'English', tooltip: 'English' },
    { code: 'ar', label: 'العربية', tooltip: 'Arabic' }
  ],  

  sk : "6LeLuB4nAAAAALZ77IMo8NxC5oAefAr1VyoRpQIc",
  ck : "4",
  firebaseConfig: {},
  pwd_check : true,
  fcm_Enable: false,
  idle_time_out: 14400,
  serverPdfURL: 'http://ec2-65-0-217-218.ap-south-1.compute.amazonaws.com:9000/',
  BLOB_URI: ''
};
