import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'maskData', pure: true })

@Injectable({
  providedIn: 'root',
})
export class MaskDataPipe implements PipeTransform {
  transform(value: string, isVisible: boolean = false,fullMask : boolean = false): string {
    if (isVisible || !value) {
      return value; 
    }
    if(fullMask){
      if (value.length <= 1) return value; 
      const masked = '*'.repeat(value.length - 1); 
      return `${masked}`; 
    }else{
      return value
      .split(' ') 
      .map(part => {
        if (part.length <= 1) return part; 
        const firstChar = part[0];
        const masked = '*'.repeat(part.length - 1); 
        return `${firstChar}${masked}`; 
      })
      .join(' '); 
    }
    
  }
}
