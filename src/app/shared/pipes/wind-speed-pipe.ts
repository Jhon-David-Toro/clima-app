import { Pipe, PipeTransform } from '@angular/core';
import { WindSpeedUnit } from '../utils/units.types';
import { formatWindSpeed } from '../utils/units';

@Pipe({ name: 'windSpeed' })
export class WindSpeedPipe implements PipeTransform {
  transform(kmh: number, unit: WindSpeedUnit): string {
    return formatWindSpeed(kmh, unit);
  }
}
