import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  User
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc
} from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public UserData: any = null;

  constructor(private auth: Auth, private firestore: Firestore, private router: Router) {}

  async login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    this.UserData = result.user;
    this.router.navigate(['/home']);
  }

  async register(userForm: any) {
    const { email, password, ...profile } = userForm;
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    this.UserData = { uid: result.user.uid, email, ...profile };

    await this.logProviderData(result.user, profile);
    this.router.navigate(['/home']);
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    this.UserData = result.user;

    await this.logProviderData(result.user);
    this.router.navigate(['/home']);
  }

  async loginWithFacebook() {
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    this.UserData = result.user;

    await this.logProviderData(result.user);
    this.router.navigate(['/home']);
  }

  private async logProviderData(user: User, extraData: any = {}) {
    const userRef = doc(this.firestore, 'users', user.uid);
    const existing = await getDoc(userRef);

    if (!existing.exists()) {
      let firstName = extraData.firstName;
      let lastName = extraData.lastName;

      if (!firstName || !lastName) {
        const nameParts = user.displayName?.split(' ') || [];
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      await setDoc(userRef, {
        firebaseAuthUID: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        photoURL: user.photoURL || '',
        providerId: user.providerData[0]?.providerId || '',
        firstName,
        lastName
      });
    }
  }

  async logout() {
    await signOut(this.auth);
    this.UserData = null;
    this.router.navigate(['/']);
  }
}
