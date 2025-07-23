import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut, authState, onAuthStateChanged
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import {firstValueFrom} from 'rxjs';
import { UserData } from '../interfaces/user-data';


@Injectable({ providedIn: 'root' })
export class AuthService {
  public UserData: UserData | null = null;


  constructor(private auth: Auth, private firestore: Firestore, private router: Router) {
    onAuthStateChanged(this.auth, (user) => {
      console.log('Auth state changed:', user);
      this.setUserData(user);
      // optionally emit an event or BehaviorSubject here
    });
  }

  async login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    this.setUserData(result.user);
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
    this.setUserData(result.user);

    await this.logProviderData(result.user);
    this.router.navigate(['/home']);
  }

  async loginWithFacebook() {
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    this.setUserData(result.user);

    await this.logProviderData(result.user);
    this.router.navigate(['/home']);
  }

  private async logProviderData(user: any, extraData: any = {}) {
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
        uid: user.uid,
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

  // Sync version: for use after user is confirmed to be logged in
  getCurrentUserId(): string {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  // Async version: use if you aren't sure user is loaded
  async getCurrentUserIdAsync(): Promise<string> {
    const user = await firstValueFrom(authState(this.auth));
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }


  setUserData(user: any) {
    const userRef = doc(this.firestore, 'users', user.uid);
    const userDoc = getDoc(userRef);

    userDoc.then(user => {
      console.log('user: ', user.data());
      const userData = user.data();
      if (userData) {

        if (!userData['firstName']?.length || !userData['lastName']?.length) {
          console.log(`[AuthService] set names ${userData['displayName']}`)
          const nameParts = userData['displayName']?.split(' ') || [];
          userData['firstName'] = nameParts[0] || '';
          userData['lastName'] = nameParts.slice(1).join(' ') || '';
        }

        this.UserData = {
          uid: userData['uid'],
          displayName: userData['displayName'] || '',
          email: userData['email'] || '',
          phoneNumber: userData['phoneNumber'] || '',
          photoURL: userData['photoURL'] || '',
          providerId: userData['providerData']?.[0]?.providerId || '',
          firstName: userData['firstName'] || '',
          lastName: userData['lastName'] || ''
        }

        console.log(`[AuthService] setUserData: ${JSON.stringify(this.UserData)}`);
        console.log(userData);
      }
    })

  }
}
