import { Pipe, PipeTransform } from '@angular/core';
import { WindSpeedUnit, formatWindSpeed } from './units';

@Pipe({ name: 'windSpeed' })
export class WindSpeedPipe implements PipeTransform {
  transform(kmh: number, unit: WindSpeedUnit): string {
    return formatWindSpeed(kmh, unit);
  }
}
