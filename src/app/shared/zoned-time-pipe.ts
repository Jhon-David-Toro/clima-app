import { Pipe, PipeTransform } from '@angular/core';
import { TimeFormat, formatZonedTime } from './time-format';

/** Formats a time in the forecast location's time zone instead of the device's. */
@Pipe({ name: 'zonedTime' })
export class ZonedTimePipe implements PipeTransform {
  transform(epochMs: number, timeZone: string, format: TimeFormat): string {
    return formatZonedTime(epochMs, timeZone, format);
  }
}
