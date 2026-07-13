import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
  HttpClient
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NetworkService } from './network.service';
import { RequestQueueService } from './request-queue.service';

@Injectable()
export class NetworkInterceptorInterceptor implements HttpInterceptor {

  constructor(
    private networkService: NetworkService,
    private requestQueue: RequestQueueService,
    private http: HttpClient
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    if (req.headers.has('X-Retry')) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {

      if (error.status === 0) {

        this.requestQueue.add(() =>
          this.http.request(
            req.clone({
              headers: req.headers.set('X-Retry', 'true')
            })
          )
        );

        if (!this.networkService.isOffline()) {
          this.networkService.markOffline();
        }
      }
        return throwError(() => error);
      })
    );
  }
}
