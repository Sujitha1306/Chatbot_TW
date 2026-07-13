import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeVal',
  pure: true
})
export class TimeAgoPipe implements PipeTransform {
    transform(value: Date | string | number): string {
        const now = new Date().getTime();
        const date = new Date(value).getTime();
        const diffInSeconds = Math.floor((date - now) / 1000);
        const absDiff = Math.abs(diffInSeconds);

        if (isNaN(date)) return '';
        if (diffInSeconds === 0) return 'now';

        const minutes = Math.floor(absDiff / 60);
        const hours = Math.floor(absDiff / 3600);
        const days = Math.floor(absDiff / 86400);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        const format = (unit: string, count: number) => {
            const plural = count !== 1 ? 's' : '';
            return diffInSeconds < 0
                ? `${count} ${unit}${plural} ago`
                : `in ${count} ${unit}${plural}`;
        };

        if (absDiff < 10 && diffInSeconds < 0) return 'just now';
        if (absDiff < 60) return format('second', absDiff);
        if (minutes < 60) return format('minute', minutes);
        if (hours < 24) return format('hour', hours);

        if (days === 1) return diffInSeconds < 0 ? 'yesterday' : 'tomorrow';
        if (days < 7) return format('day', days);
        if (weeks < 4) return format('week', weeks);
        if (months < 12) return format('month', months);

        return format('year', years);
    }
    // transform(value: Date | string | number, mode: 'ago' | 'until' = 'ago'): string {
    //     const now = new Date().getTime();
    //     const date = new Date(value).getTime();
    //     const diffInSeconds = Math.floor((mode === 'ago' ? now - date : date - now) / 1000);

    //     if (isNaN(diffInSeconds)) return '';

    //     if (mode === 'ago' && diffInSeconds < 0) return 'in the future';
    //     if (mode === 'until' && diffInSeconds < 0) return 'in the past';
    //     if (diffInSeconds === 0) return 'now';

    //     const minutes = Math.floor(diffInSeconds / 60);
    //     const hours = Math.floor(diffInSeconds / 3600);
    //     const days = Math.floor(diffInSeconds / 86400);
    //     const weeks = Math.floor(days / 7);
    //     const months = Math.floor(days / 30);
    //     const years = Math.floor(days / 365);

    //     const label = (text: string, count: number) => {
    //         const plural = count !== 1 ? 's' : '';
    //         return mode === 'ago' ? `${count} ${text}${plural} ago` : `in ${count} ${text}${plural}`;
    //     };

    //     if (diffInSeconds < 10 && mode === 'ago') return 'just now';
    //     if (diffInSeconds < 60) return label('second', diffInSeconds);
    //     if (minutes < 60) return label('minute', minutes);
    //     if (hours < 24) return label('hour', hours);

    //     if (days === 1) return mode === 'ago' ? 'yesterday' : 'tomorrow';
    //     if (days < 7) return label('day', days);
    //     if (weeks < 4) return label('week', weeks);
    //     if (months < 12) return label('month', months);

    //     return label('year', years);
    // }
}
