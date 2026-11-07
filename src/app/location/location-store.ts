import { Service, computed, effect, inject, signal } from '@angular/core';
import { BrowserStorage } from '../shared/browser-storage';
import { MEDELLIN, Place, isPlace } from './place';

const SELECTED_KEY = 'clima-app:selected-place';
const FAVORITES_KEY = 'clima-app:favorite-places';
const MAX_FAVORITES = 8;

function parsePlace(value: unknown): Place {
  return isPlace(value) ? value : MEDELLIN;
}

function parsePlaces(value: unknown): Place[] {
  return Array.isArray(value) ? value.filter(isPlace).slice(0, MAX_FAVORITES) : [];
}

@Service()
export class LocationStore {
  private readonly storage = inject(BrowserStorage);
  private readonly selectedPlace = signal<Place>(this.storage.read(SELECTED_KEY, parsePlace));
  private readonly favoritePlaces = signal<readonly Place[]>(
    this.storage.read(FAVORITES_KEY, parsePlaces),
  );

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

  select(place: Place): void {
    if (place.id !== this.selectedPlace().id) {
      this.selectedPlace.set(place);
    }
  }

  toggleSelectedFavorite(): void {
    const place = this.selectedPlace();
    if (this.isSelectedFavorite()) {
      this.removeFavorite(place);
    } else if (this.canAddFavorite()) {
      this.favoritePlaces.update((places) => [...places, place]);
    }
  }

  removeFavorite(place: Place): void {
    this.favoritePlaces.update((places) => places.filter((p) => p.id !== place.id));
  }
}
