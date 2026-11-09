import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GEOCODING_URL } from '../../weather/api/open-meteo.constants';
import { Place } from '../place/place.types';
import { CitySearch } from './city-search';

const RESULTS = {
  results: [
    {
      id: 3687925,
      name: 'Cali',
      latitude: 3.437,
      longitude: -76.522,
      admin1: 'Valle del Cauca',
      country: 'Colombia',
    },
    { id: 3688689, name: 'Bogotá', latitude: 4.609, longitude: -74.081, country: 'Colombia' },
  ],
};

describe('CitySearch', () => {
  let fixture: ComponentFixture<CitySearch>;
  let http: HttpTestingController;
  let input: HTMLInputElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(CitySearch);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
    const element = host();
    const found = element.querySelector('input');
    if (!found) throw new Error('Falta el campo de búsqueda');
    input = found;
  });

  afterEach(() => {
    http.verify();
  });

  /** `nativeElement` is typed as `any` by Angular, so it is narrowed once here. */
  function host(): HTMLElement {
    const element: unknown = fixture.nativeElement;
    if (!(element instanceof HTMLElement)) throw new Error('El componente no se renderizó');
    return element;
  }

  async function search(text: string): Promise<void> {
    input.focus();
    input.value = text;
    input.dispatchEvent(new Event('input'));
    // Waits for the debounce, then lets the resource issue its request. `whenStable` would wait
    // for the pending request itself, so it is only awaited after flushing.
    await new Promise((resolve) => setTimeout(resolve, 350));
    TestBed.tick();
  }

  function press(key: string): void {
    input.dispatchEvent(new KeyboardEvent('keydown', { key }));
    fixture.detectChanges();
  }

  function options(): HTMLElement[] {
    const element = host();
    return Array.from(element.querySelectorAll<HTMLElement>('[role="option"]'));
  }

  it('does not search with fewer than two characters', async () => {
    await search('c');

    http.expectNone((req) => req.url === GEOCODING_URL);
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows results and selects one with the keyboard', async () => {
    const selected: Place[] = [];
    fixture.componentInstance.placeSelected.subscribe((place) => selected.push(place));

    await search('ca');
    const request = http.expectOne((req) => req.url === GEOCODING_URL);
    expect(request.request.params.get('name')).toBe('ca');
    request.flush(RESULTS);
    await fixture.whenStable();

    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(options().map((o) => o.textContent.replace(/\s+/g, ' ').trim())).toEqual([
      'Cali, Valle del Cauca, Colombia',
      'Bogotá, Colombia',
    ]);

    press('ArrowDown');
    press('ArrowDown');
    expect(input.getAttribute('aria-activedescendant')).toBe('city-search-results-1');

    press('Enter');

    expect(selected.map((p) => p.name)).toEqual(['Bogotá']);
    expect(input.value).toBe('');
  });

  it('explains when nothing matches', async () => {
    await search('zzz');
    http.expectOne((req) => req.url === GEOCODING_URL).flush({});
    await fixture.whenStable();

    const element = host();
    expect(element.querySelector('.status')?.textContent).toContain(
      'No hay ciudades que coincidan',
    );
  });
});
