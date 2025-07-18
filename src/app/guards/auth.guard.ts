// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

export const canActivate: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return new Promise<boolean>((resolve) => {
    const unsub = auth.onAuthStateChanged(user => {
      unsub();
      if (user) resolve(true);
      else {
        router.navigate(['/']);
        resolve(false);
      }
    });
  });
};
