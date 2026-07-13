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
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

interface SseConnection {
  abortController: AbortController;
  subject: Subject<MessageEvent>;
  refCount: number;
}

@Injectable({ providedIn: 'root' })
export class SseService implements OnDestroy {

  private connections = new Map<string, SseConnection>();

  /**
   * Connect to an SSE endpoint using fetch so custom headers (e.g. Authorization,
   * customerId) can be sent. Multiple subscriptions to the same URL share one
   * fetch stream. The connection is closed when all subscribers unsubscribe.
   */
  connect(url: string): Observable<MessageEvent> {
    const customerId = localStorage.getItem('customerId') || '';
    const token = localStorage.getItem(btoa('user_token')) || '';
    const headers: Record<string, string> = {
      'customerId': customerId,
      'Authorization': `Bearer ${token}`
    };
    let userId = localStorage.getItem(btoa('userId'));
    if(userId) {
      url = url + '?userId=' + userId
    }
    return new Observable<MessageEvent>((observer) => {
      let conn = this.connections.get(url);

      if (!conn) {
        const subject = new Subject<MessageEvent>();
        const abortController = new AbortController();

        this.startFetchSse(url, headers, abortController.signal, subject, url);

        conn = { abortController, subject, refCount: 0 };
        this.connections.set(url, conn);
      }

      conn.refCount++;
      const inner = conn.subject.subscribe(observer);

      return () => {
        inner.unsubscribe();
        const c = this.connections.get(url);
        if (c) {
          c.refCount--;
          if (c.refCount <= 0) {
            this.connections.delete(url);
            c.abortController.abort();
            c.subject.complete();
          }
        }
      };
    });
  }

  private async startFetchSse(
    url: string,
    headers: Record<string, string>,
    signal: AbortSignal,
    subject: Subject<MessageEvent>,
    connKey: string
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'text/event-stream', ...headers },
        signal,
      });

      if (!response.ok || !response.body) {
        subject.error(new Error(`SSE connection failed: ${response.status}`));
        this.connections.delete(connKey);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let eventData = '';
        for (const line of lines) {
          if (line.startsWith('data:')) {
            eventData += line.slice(5).trim();
          } else if (line.trim() === '' && eventData) {
            subject.next(new MessageEvent('message', { data: eventData }));
            eventData = '';
          }
        }
      }

      this.connections.delete(connKey);
      subject.complete();
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError' ||
        (err instanceof TypeError && /abort/i.test(err.message));
      if (!isAbort) {
        subject.error(err);
        this.connections.delete(connKey);
      }
    }
  }

  /** Force-close a specific SSE connection regardless of subscriber count. */
  disconnect(url: string): void {
    const conn = this.connections.get(url);
    if (conn) {
      this.connections.delete(url);
      conn.abortController.abort();
      conn.subject.complete();
    }
  }

  ngOnDestroy(): void {
    this.connections.forEach((conn) => {
      conn.abortController.abort();
      conn.subject.complete();
    });
    this.connections.clear();
  }
}
