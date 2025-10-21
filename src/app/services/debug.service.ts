import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  showDebug = false;

  constructor() { }

  enableDebug() {
    this.showDebug = true;
  }
  disableDebug() {
    this.showDebug = false;
  }

  msg<T>(...args: [string, ...T[]]): void {
    if (this.showDebug) console.log(...args);
  }
}
