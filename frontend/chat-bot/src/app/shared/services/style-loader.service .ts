import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StyleLoaderService {

  loadStyleByType(type) {
    if(type == 'google') {
      if(environment.env_key == 'vm' || environment.localStyle) {
        this.loadStyle('assets/Styles/Leaflet.css');
      } else {
      }
    }
    if(type === 'leafletCss') {
      if(environment.env_key == 'vm' || environment.localStyle) {
        this.loadStyle('assets/Styles/Leaflet.css');
      } else {
        this.loadStyle('https://unpkg.com/leaflet@1.2.0/dist/leaflet.css');
      }
    }
    if(type === 'leaflet') {
      if(environment.env_key == 'vm' || environment.localStyle) {
          this.loadStyle('assets/Styles/Leaflet.css');
          this.loadStyle('assets/Styles/Gosearch.css');
          // this.loadStyle('assets/Styles/Leafletdrawtoolbar.css');
          this.loadStyle('assets/Styles/leaflet.draw.css');
      } else {
          this.loadStylesheet('https://unpkg.com/leaflet@1.2.0/dist/leaflet.css');
          this.loadStylesheet('https://unpkg.com/leaflet-geosearch@latest/assets/css/leaflet.css');
          this.loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css');
      }
    }
  }
  loadStylesheet(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.type = 'text/css';
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`));
      document.head.appendChild(link);
    });
  }
  loadStyle(href: string): void {
    if(environment.env_key == 'vm' || environment.localStyle){
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }
}
}