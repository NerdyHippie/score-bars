// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { canActivate } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [canActivate]
  },
  {
    path: 'game/:id',
    loadComponent: () => import('./components/game/game.component').then(m => m.GameComponent),
    canActivate: [canActivate]
  },
  {
    path: 'new-game',
    loadComponent: () => import('./components/new-game/new-game.component').then(m => m.NewGameComponent)
  },
  { path: '**', redirectTo: '' }
];
