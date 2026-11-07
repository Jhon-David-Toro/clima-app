import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Clima',
    loadComponent: () => import('./forecast-page/forecast-page').then((m) => m.ForecastPage),
  },
  { path: '**', redirectTo: '' },
];
