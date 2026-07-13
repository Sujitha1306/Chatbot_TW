import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'smartCapitalize',
  pure: true
})
export class SmartCapitalizePipe implements PipeTransform {
  transform(value: string): string {
    if (!value || value.length === 0) return value;

    const words = value.split(' ');

    // First word: Capitalize only if second letter is NOT capital
    if (words[0].length > 0) {
      const firstChar = words[0].charAt(0);
      const secondChar = words[0].charAt(1);

      if (!secondChar || secondChar !== secondChar.toUpperCase()) {
        words[0] = firstChar.toUpperCase() + words[0].slice(1);
      }
    }

    // Second word: Always capitalize first letter
    if (words.length > 1 && words[1].length > 0) {
      words[1] = words[1].charAt(0).toUpperCase() + words[1].slice(1);
    }

    return words.join(' ');
  }
}
