import { Service, computed, effect, inject, signal } from '@angular/core';
import { BrowserStorage } from '../../shared/services/browser-storage';
import { FAVORITES_KEY, MAX_FAVORITES, SELECTED_KEY } from './location-store.constants';
import { MEDELLIN } from '../place/place.constants';
import { Place } from '../place/place.types';
import { isPlace } from '../place/place';

function parsePlace(value: unknown): Place {
  return isPlace(value) ? value : MEDELLIN;
}

function parsePlaces(value: unknown): Place[] {
  return Array.isArray(value) ? value.filter(isPlace).slice(0, MAX_FAVORITES) : [];
}

/** Persists the selected place and favorites list; sources of truth for location state. */
@Service()
export class LocationStore {
  private readonly storage = inject(BrowserStorage);
  private readonly selectedPlace = signal<Place>(this.storage.read(SELECTED_KEY, parsePlace));
  private readonly favoritePlaces = signal<readonly Place[]>(
    this.storage.read(FAVORITES_KEY, parsePlaces),
  );

  /** The currently selected place. */
  readonly selected = this.selectedPlace.asReadonly();
  readonly favorites = this.favoritePlaces.asReadonly();
  readonly isSelectedFavorite = computed(() =>
    this.favoritePlaces().some((place) => place.id === this.selectedPlace().id),
  );
  readonly canAddFavorite = computed(() => this.favoritePlaces().length < MAX_FAVORITES);

  constructor() {
    effect(() => {
      this.storage.write(SELECTED_KEY, this.selectedPlace());
    });
    effect(() => {
      this.storage.write(FAVORITES_KEY, this.favoritePlaces());
    });
  }

  /** Selects a new place; no-ops when the same place is already selected. */
  select(place: Place): void {
    if (place.id !== this.selectedPlace().id) {
      this.selectedPlace.set(place);
    }
  }

  /** Toggles the selected place in/out of favorites, respecting {@link MAX_FAVORITES}. */
  toggleSelectedFavorite(): void {
    const place = this.selectedPlace();
    if (this.isSelectedFavorite()) {
      this.removeFavorite(place);
    } else if (this.canAddFavorite()) {
      this.favoritePlaces.update((places) => [...places, place]);
    }
  }

  /** Removes `place` from the favorites list. */
  removeFavorite(place: Place): void {
    this.favoritePlaces.update((places) =>
      places.filter((savedPlace) => savedPlace.id !== place.id),
    );
  }
}
