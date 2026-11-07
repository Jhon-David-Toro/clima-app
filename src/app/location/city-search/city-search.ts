import { Component, computed, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { GEOCODING_URL, geocodingParams, parseGeocodingResponse } from '../../weather/open-meteo';
import { Place, placeFromGeocoding } from '../place';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/** City search following the WAI-ARIA combobox pattern with a listbox popup. */
@Component({
  selector: 'app-city-search',
  imports: [ReactiveFormsModule],
  templateUrl: './city-search.html',
  styleUrl: './city-search.scss',
})
export class CitySearch {
  readonly placeSelected = output<Place>();

  protected readonly listboxId = 'city-search-results';
  protected readonly query = new FormControl('', { nonNullable: true });
  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(-1);

  private readonly debouncedQuery = toSignal(
    this.query.valueChanges.pipe(
      map((value) => value.trim()),
      debounceTime(DEBOUNCE_MS),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

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

  protected optionId(index: number): string {
    return `${this.listboxId}-${index}`;
  }

  protected openResults(): void {
    this.isOpen.set(true);
    this.activeIndex.set(-1);
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
    this.query.setValue('');
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
