// src/app/app.component.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterOutlet, Router } from '@angular/router';
import { Location } from '@angular/common';

import { AppComponent } from './app.component';
import { Component } from '@angular/core';

// A tiny routed component so we can assert outlet rendering.
@Component({
  standalone: true,
  selector: 'app-dummy',
  template: `<h1 data-test="dummy">Dummy Works</h1>`,
})
class DummyComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, DummyComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          // add any other quick stubs if your template links to them:
          // { path: 'game/:gameId', component: DummyComponent },
          // { path: 'register', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('creates the app', () => {
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('contains a RouterOutlet', () => {
    const outlet = fixture.debugElement.query(By.directive(RouterOutlet));
    expect(outlet).withContext('AppComponent should include <router-outlet>').toBeTruthy();
  });

  it('shows an app title (data-test="app-title" or fallback text "Score Bars")', () => {
    const el: HTMLElement = fixture.nativeElement;

    // Prefer a test id if you’ve added one:
    const testTitle = el.querySelector('[data-test="app-title"]')?.textContent?.trim();

    // Fallback to a loose text search to avoid brittleness:
    const wholeText = el.textContent?.toLowerCase() ?? '';
    const hasFallback = wholeText.includes('score bars');

    expect(!!testTitle || hasFallback).toBeTrue();
  });

  it('renders routed content in the outlet', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    const dummy = el.querySelector('[data-test="dummy"]');
    expect(dummy?.textContent).toContain('Dummy Works');
    expect(location.path()).toBe('/');
  });
});
