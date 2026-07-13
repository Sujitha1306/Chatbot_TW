import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mask',
  pure: true
})
export class MaskPipe implements PipeTransform {
  transform(value: string, type: 'mobile' | 'id' = 'mobile'): string {
    if (!value) return '';

    // Remove spaces before processing
    let cleanedValue = value.replace(/\s+/g, '');

    if (type === 'mobile' && cleanedValue.length >= 10) {
      return cleanedValue.replace(/^(\d{2})\d{6}(\d{2})$/, '$1******$2'); // Example: 98******76
    } else if (false && type === 'id' && cleanedValue.length >= 12) {        
      return cleanedValue.replace(/^(\d{4})\d{4}(\d{4})$/, '$1****$2'); // Example: 1234****5678
    } else if (type === 'id' && cleanedValue.length >= 1) {
        if (cleanedValue.length <= 4) {
            return value;
        }    
        return '*'.repeat(value.length - 4) + value.slice(-4);
    }
    return value; // Return the original value if no match
  }
}


@Pipe({ name: 'splitCapital', pure: true })

export class SplitCapitalPipe implements PipeTransform {
  transform(value: string = ''): string {
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^\w/, c => c.toUpperCase());
  }
}
