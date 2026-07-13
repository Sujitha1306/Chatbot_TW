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
/** IE9, IE10 and IE11 requires all of the following polyfills. **/
import 'core-js/es6/symbol';
import 'core-js/es6/object';
import 'core-js/es6/function';
import 'core-js/es6/parse-int';
import 'core-js/es6/parse-float';
import 'core-js/es6/number';
import 'core-js/es6/math';
import 'core-js/es6/string';
import 'core-js/es6/date';
import 'core-js/es6/array';
import 'core-js/es6/regexp';
import 'core-js/es6/map';
import 'core-js/es6/weak-map';
import 'core-js/es6/set';

import 'core-js/es7/symbol';
import 'core-js/es7/object';
import 'core-js/es7/math';
import 'core-js/es7/string';
import 'core-js/es7/array';
import 'core-js/es7/map';
import 'core-js/es7/weak-map';
import 'core-js/es7/set';
/** IE10 and IE11 requires the following for the Reflect API. */
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';

import 'core-js/es6/promise';
import 'core-js/es7/promise';

/* COMMENTED IT TEMPORARILY ------ NEED to  I N S T A L L    it */
/** IE10 and IE11 requires the following for NgClass support on SVG elements */
// import 'classlist.js';
// import 'web-animations-js';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}
function loadStyle(url) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

if(environment.env_key == 'vm' || environment.localStyle) {
  // Example: Load a CSS file dynamically
  loadStyle('assets/Styles/Material-Icons.css');
  loadStyle('assets/Styles/Font.css');
  loadStyle('assets/Styles/Fontawesome.css');
  loadStyle('assets/Styles/Calendar.css');
  loadStyle('assets/Styles/Flatpickr.css');
} else  {
  loadStyle('https://fonts.googleapis.com/icon?family=Material+Icons');
  loadStyle('https://fonts.googleapis.com/css?family=Open+Sans:400italic,600italic,700italic,400,600,700');
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
