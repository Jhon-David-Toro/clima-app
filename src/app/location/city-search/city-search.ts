/** City search following the WAI-ARIA combobox pattern with a listbox popup. */
import { Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { geocodingParams, parseGeocodingResponse } from '../../weather/api/open-meteo';
import { GEOCODING_URL } from '../../weather/api/open-meteo.constants';
import { placeFromGeocoding } from '../place/place';
import { Place } from '../place/place.types';
import { DEBOUNCE_MS, MIN_QUERY_LENGTH } from './city-search.constants';

@Component({
  selector: 'app-city-search',
  templateUrl: './city-search.html',
  styleUrl: './city-search.scss',
})
export class CitySearch {
  readonly placeSelected = output<Place>();

  protected readonly listboxId = 'city-search-results';

  /** Raw value bound to the `<input>` element. */
  protected readonly rawQuery = signal('');
  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(-1);

  private readonly debouncedQueryState = signal('');
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  /** Debounced, trimmed version of the input that drives the HTTP resource. */
  private readonly debouncedQuery = this.debouncedQueryState.asReadonly();

  private readonly searchResource = httpResource(
    () => {
      const name = this.debouncedQuery();
      return name.length >= MIN_QUERY_LENGTH
        ? { url: GEOCODING_URL, params: { ...geocodingParams(name) } }
        : undefined;
    },
    { parse: (raw: unknown) => parseGeocodingResponse(raw).results.map(placeFromGeocoding) },
  );

  protected readonly results = computed<readonly Place[]>(() =>
    this.searchResource.hasValue() ? this.searchResource.value() : [],
  );
  protected readonly isSearching = this.searchResource.isLoading;
  protected readonly hasError = computed(() => this.searchResource.error() !== undefined);
  protected readonly hasQuery = computed(() => this.debouncedQuery().length >= MIN_QUERY_LENGTH);
  protected readonly showPopup = computed(() => this.isOpen() && this.hasQuery());
  protected readonly activeOptionId = computed(() =>
    this.showPopup() && this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null,
  );

  protected readonly statusMessage = computed(() => {
    if (!this.hasQuery()) return '';
    if (this.isSearching()) return 'Buscando ciudades…';
    if (this.hasError()) return 'No se pudo buscar. Revisa tu conexión e inténtalo de nuevo.';
    const count = this.results().length;
    if (count === 0) return `No hay ciudades que coincidan con «${this.debouncedQuery()}».`;
    return count === 1 ? '1 ciudad encontrada.' : `${count} ciudades encontradas.`;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.debounceTimer);
    });
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-${index}`;
  }

  /**
   * Handles every keystroke: updates the raw display value immediately
   * and schedules a debounced update that fires the search.
   */
  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.rawQuery.set(value);
    this.isOpen.set(true);
    this.activeIndex.set(-1);
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debouncedQueryState.set(value.trim());
    }, DEBOUNCE_MS);
  }

  protected closeResults(): void {
    this.isOpen.set(false);
    this.activeIndex.set(-1);
  }

  protected moveActive(step: 1 | -1, event: Event): void {
    const count = this.results().length;
    if (count === 0) return;
    event.preventDefault();
    this.isOpen.set(true);
    this.activeIndex.update((index) => (index + step + count) % count);
  }

  protected chooseActive(event: Event): void {
    const place = this.results()[this.activeIndex()] ?? this.results()[0];
    if (place && this.showPopup()) {
      event.preventDefault();
      this.choose(place);
    }
  }

  protected choose(place: Place): void {
    this.placeSelected.emit(place);
    this.rawQuery.set('');
    this.debouncedQueryState.set('');
    clearTimeout(this.debounceTimer);
    this.closeResults();
  }

  protected closeWhenFocusLeaves(event: FocusEvent): void {
    const target = event.relatedTarget;
    const container = event.currentTarget;
    if (!(target instanceof Node && container instanceof Node && container.contains(target))) {
      this.closeResults();
    }
  }
}
