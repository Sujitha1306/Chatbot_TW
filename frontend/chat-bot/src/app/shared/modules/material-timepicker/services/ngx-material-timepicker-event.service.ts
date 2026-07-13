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
import {Injectable} from '@angular/core';
import {Subject, Observable} from 'rxjs';

@Injectable()
export class NgxMaterialTimepickerEventService {

    backdropClickSubject: Subject<MouseEvent> = new Subject();
    keydownEventSubject: Subject<KeyboardEvent> = new Subject();

    get backdropClick(): Observable<MouseEvent> {
        return this.backdropClickSubject.asObservable();
    }

    get keydownEvent(): Observable<KeyboardEvent> {
        return this.keydownEventSubject.asObservable();
    }

}
