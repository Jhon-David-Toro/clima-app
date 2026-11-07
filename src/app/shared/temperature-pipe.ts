import { Pipe, PipeTransform } from '@angular/core';
import { TemperatureUnit, formatTemperature } from './units';

@Pipe({ name: 'temperature' })
export class TemperaturePipe implements PipeTransform {
  transform(celsius: number, unit: TemperatureUnit): string {
    return formatTemperature(celsius, unit);
  }
}
