// src/app/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

import * as afAuth from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';

describe('AuthService', () => {
  let service: AuthService;

  const fakeAuth: Partial<Auth> = {} as any;
  const fakeUser = { uid: 'uid-123', displayName: null } as any;
  const fakeCred = { user: fakeUser } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: fakeAuth },
      ],
    });

    service = TestBed.inject(AuthService);
    // No jasmine.clearAllSpies() call — some environments don't expose it.
  });

  describe('register()', () => {
    it('creates user and sets displayName to "First Last"', async () => {
      const createSpy = spyOn(afAuth, 'createUserWithEmailAndPassword').and.resolveTo(fakeCred);
      const updateSpy = spyOn(afAuth, 'updateProfile').and.resolveTo();

      const res = await service.register({
        firstName: 'First',
        lastName: 'Last',
        email: 'a@b.com',
        password: 'pw',
      } as any);

      expect(createSpy).toHaveBeenCalledOnceWith(fakeAuth as any, 'a@b.com', 'pw');
      expect(updateSpy).toHaveBeenCalledOnceWith(fakeUser, { displayName: 'First Last' });
      expect(res).toBe(fakeCred);
    });

    it('propagates createUser errors and does not call updateProfile', async () => {
      const err = new Error('auth/email-already-in-use');
      spyOn(afAuth, 'createUserWithEmailAndPassword').and.rejectWith(err);
      const updateSpy = spyOn(afAuth, 'updateProfile').and.resolveTo();

      await expectAsync(
        service.register({ firstName: 'A', lastName: 'B', email: 'dupe@b.com', password: 'pw' } as any)
      ).toBeRejectedWith(err);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('continues if updateProfile fails (adjust if your service throws)', async () => {
      spyOn(afAuth, 'createUserWithEmailAndPassword').and.resolveTo(fakeCred);
      spyOn(afAuth, 'updateProfile').and.rejectWith(new Error('profile-fail'));

      const res = await service.register({
        firstName: 'A',
        lastName: 'B',
        email: 'x@y.com',
        password: 'pw',
      } as any);

      expect(res).toBe(fakeCred);
    });
  });

  describe('login()', () => {
    it('calls signInWithEmailAndPassword and returns credential', async () => {
      const signInSpy = spyOn(afAuth, 'signInWithEmailAndPassword').and.resolveTo(fakeCred);

      const res = await service.login('a@b.com', 'pw');

      expect(signInSpy).toHaveBeenCalledOnceWith(fakeAuth as any, 'a@b.com', 'pw');
      expect(res).toBe(fakeCred);
    });

    it('propagates sign-in errors', async () => {
      const err = new Error('auth/wrong-password');
      spyOn(afAuth, 'signInWithEmailAndPassword').and.rejectWith(err);

      await expectAsync(service.login('a@b.com', 'bad')).toBeRejectedWith(err);
    });
  });

  describe('logout()', () => {
    it('calls signOut()', async () => {
      const signOutSpy = spyOn(afAuth, 'signOut').and.resolveTo();
      await service.logout();
      expect(signOutSpy).toHaveBeenCalledOnceWith(fakeAuth as any);
    });

    it('propagates signOut errors', async () => {
      const err = new Error('signout-fail');
      spyOn(afAuth, 'signOut').and.rejectWith(err);
      await expectAsync(service.logout()).toBeRejectedWith(err);
    });
  });
});
