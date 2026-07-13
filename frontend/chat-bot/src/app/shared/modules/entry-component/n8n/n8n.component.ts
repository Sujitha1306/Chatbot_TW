import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-n8n',
  templateUrl: './n8n.component.html',
  styleUrls: ['./n8n.component.scss']
})
export class N8nComponent {

  iframeUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://wflow.demo.trackerwave.com/signin'
    );
  }

}
