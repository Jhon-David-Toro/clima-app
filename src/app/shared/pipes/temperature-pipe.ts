import { Pipe, PipeTransform } from '@angular/core';
import { TemperatureUnit } from '../utils/units.types';
import { formatTemperature } from '../utils/units';

@Pipe({ name: 'temperature' })
export class TemperaturePipe implements PipeTransform {
  transform(celsius: number, unit: TemperatureUnit): string {
    return formatTemperature(celsius, unit);
  }
}
