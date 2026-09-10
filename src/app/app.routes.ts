import { Routes } from '@angular/router';
import { Home } from './pages/home';
import { TitleDetail } from './pages/titledetail';
import { PersonDetail } from './pages/persondetail';
import { Browse } from './pages/browse';
import { Login } from './pages/login';
import { AccountCallback } from './pages/accountcallback';
import { AccountShell } from './pages/accountshell';
import { AccountMedia } from './components/accountmedia';
import { AccountLists } from './components/accountlists';
import { AccountListDetail } from './components/accountlistdetail';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'movie/:id', component: TitleDetail, data: { mediaType: 'movie' } },
  { path: 'tv/:id', component: TitleDetail, data: { mediaType: 'tv' } },
  { path: 'person/:id', component: PersonDetail },
  { path: 'movies', component: Browse, data: { routeType: 'movie' } },
  { path: 'tv', component: Browse, data: { routeType: 'tv' } },
  { path: 'people', component: Browse, data: { routeType: 'person' } },
  { path: 'search', component: Browse },
  { path: 'login', component: Login },
  { path: 'account/callback', component: AccountCallback },
  {
    path: 'account',
    component: AccountShell,
    children: [
      { path: '', redirectTo: 'watchlist', pathMatch: 'full' },
      { path: 'watchlist', component: AccountMedia, data: { kind: 'watchlist' } },
      { path: 'favorites', component: AccountMedia, data: { kind: 'favorite' } },
      { path: 'ratings', component: AccountMedia, data: { kind: 'rated' } },
      { path: 'lists', component: AccountLists },
      { path: 'lists/:id', component: AccountListDetail },
    ],
  },
  { path: '**', redirectTo: '' },
];