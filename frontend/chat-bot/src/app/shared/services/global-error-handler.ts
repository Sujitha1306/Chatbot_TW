import { Injectable,ErrorHandler, NgZone} from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler{
  constructor(public router : Router, private readonly ngZone: NgZone) {}
  handleError(error: any): void {
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;
    const scannerFailedMsg = /BrowserMultiFormatContinuousReader.releaseAllStreams is not a function/;
    if(chunkFailedMessage.test(error.message)) {
      window.location.reload();
      // if(confirm("New version available. Load New Version?")) {
      //   window.location.reload();
      // }
    }
  }
}
