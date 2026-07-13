import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'age',
  pure: true
})
export class AgeToYrsPipe implements PipeTransform {
  transform(dob: string | Date): number {
    if (!dob) return 0;
    
    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  }
}

