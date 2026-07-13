// theme.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class ColorThemeService {
  constructor(private readonly commonService : CommonService, ) {}

  loadTheme(isdefault = false): void {
    if(isdefault){
      document.documentElement.style.setProperty('--primary-bg-color',  '#08BFE6');
      document.documentElement.style.setProperty('--primary-menu-bg-color', '#07AACB');
      document.documentElement.style.setProperty('--primary-bg-hghl-color', '#ffffff');
      document.documentElement.style.setProperty('--primary_shadowColor1', '#28a59f');
      document.documentElement.style.setProperty('--primary_shadowColor2', '#62d9d3');
    }
    else{
    this.commonService.getConfigFile('color-theme').subscribe(res => {
        if(res.statusCode == 1){
            let theme = res.results.contentObject;
            if (theme.backgroundColor) {
                document.documentElement.style.setProperty('--primary-bg-color', theme.backgroundColor.primary ?? '#08BFE6');
                document.documentElement.style.setProperty('--primary-menu-bg-color', theme.backgroundColor.menu ?? '#07AACB');
                document.documentElement.style.setProperty('--primary-bg-hghl-color', theme.backgroundColor.highlight ?? '#ffffff');
                document.documentElement.style.setProperty('--primary_shadowColor1', theme.backgroundColor.primary_shadowColor1 ?? '#28a59f');
                document.documentElement.style.setProperty('--primary_shadowColor2', theme.backgroundColor.primary_shadowColor2 ?? '#62d9d3');
            }
        }
    });
    }
  }
}
