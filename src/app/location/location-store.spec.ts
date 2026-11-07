import { TestBed } from '@angular/core/testing';
import { LocationStore } from './location-store';
import { MEDELLIN, Place } from './place';

const CALI: Place = {
  id: 'geo-3687925',
  name: 'Cali',
  region: 'Valle del Cauca, Colombia',
  latitude: 3.437,
  longitude: -76.522,
};

describe('LocationStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts in Medellín on the first visit', () => {
    expect(TestBed.inject(LocationStore).selected()).toEqual(MEDELLIN);
  });

  it('persists the selected place and favorites', () => {
    const store = TestBed.inject(LocationStore);

    store.select(CALI);
    store.toggleSelectedFavorite();
    TestBed.tick();

    expect(store.isSelectedFavorite()).toBe(true);
    expect(JSON.parse(localStorage.getItem('clima-app:selected-place') ?? 'null')).toEqual(CALI);
    expect(JSON.parse(localStorage.getItem('clima-app:favorite-places') ?? '[]')).toEqual([CALI]);
  });

  it('ignores corrupt stored data', () => {
    localStorage.setItem('clima-app:selected-place', '{"name": 3}');
    localStorage.setItem('clima-app:favorite-places', '[{"id": "x"}, "nope"]');

    const store = TestBed.inject(LocationStore);

    expect(store.selected()).toEqual(MEDELLIN);
    expect(store.favorites()).toEqual([]);
  });

  it('removes a favorite when toggled again', () => {
    const store = TestBed.inject(LocationStore);
    store.select(CALI);
    store.toggleSelectedFavorite();
    store.toggleSelectedFavorite();

    expect(store.favorites()).toEqual([]);
  });
});
