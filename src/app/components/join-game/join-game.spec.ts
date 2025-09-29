import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinGameComponent } from './join-game';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import * as fs from '@angular/fire/firestore';

// ---- Helper: build a mock DocumentSnapshot with the right shape ----
function makeDocSnap<AppModelType, DbModelType extends fs.DocumentData>(
  obj: AppModelType,
  exists = true
): fs.DocumentSnapshot<AppModelType, DbModelType> {
  // Build a plain object and then cast through unknown so TS accepts
  // the 'exists' type predicate and other structural fields.
  const snapLike: any = {
    exists: () => exists,
    data: () => obj,
    get: (_: string) => undefined,
    metadata: {} as any,
    id: 'doc-id',
    ref: {} as any,
    toJSON: () => obj as any,
  };
  return snapLike as unknown as fs.DocumentSnapshot<AppModelType, DbModelType>;
}
// -------------------------------------------------------------------

describe('JoinGame', () => {
  let fixture: ComponentFixture<JoinGameComponent>;
  let component: JoinGameComponent;

  const routeStub = {
    snapshot: { queryParamMap: { get: (k: string) => (k === 'gameId' ? 'GAME123' : null) } },
  } as Partial<ActivatedRoute>;

  const routerStub = { navigate: jasmine.createSpy('navigate') } as Partial<Router>;
  const authStub = {} as Partial<Auth>;

  let docSpy: jasmine.Spy;
  let onSnapshotSpy: jasmine.Spy;
  let getDocSpy: jasmine.Spy;
  let updateDocSpy: jasmine.Spy;
  let arrayUnionSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinGameComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: Router, useValue: routerStub },
        { provide: Auth, useValue: authStub },
      ],
    }).compileComponents();

    // doc()
    docSpy = spyOn(fs, 'doc').and.returnValue({} as any);

    // onSnapshot(): provide a generic-aware fake and cast when wiring to spy
    const fakeOnSnapshot = <
      AppModelType,
      DbModelType extends fs.DocumentData
    >(
      _ref: fs.DocumentReference<AppModelType, DbModelType>,
      next: (snap: fs.DocumentSnapshot<AppModelType, DbModelType>) => void
    ) => {
      const snap = makeDocSnap<AppModelType, DbModelType>(
        { players: [{ name: 'Existing' }] } as unknown as AppModelType
      );
      next(snap);
      return () => {};
    };
    onSnapshotSpy = spyOn(fs, 'onSnapshot').and.callFake(fakeOnSnapshot as any);

    // getDoc(): same idea — generic-aware fake
    const fakeGetDoc = <
      AppModelType,
      DbModelType extends fs.DocumentData
    >(
      _ref: fs.DocumentReference<AppModelType, DbModelType>
    ): Promise<fs.DocumentSnapshot<AppModelType, DbModelType>> => {
      const snap = makeDocSnap<AppModelType, DbModelType>(
        { players: [{ name: 'Existing' }] } as unknown as AppModelType
      );
      return Promise.resolve(snap);
    };
    getDocSpy = spyOn(fs, 'getDoc').and.callFake(fakeGetDoc as any);

    // updateDoc() and arrayUnion()
    updateDocSpy = spyOn(fs, 'updateDoc').and.resolveTo();
    arrayUnionSpy = spyOn(fs, 'arrayUnion').and.callFake((x: any) => x);

    fixture = TestBed.createComponent(JoinGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders joined players from snapshot', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const items = Array.from(el.querySelectorAll('ul li')).map(li => li.textContent?.trim());
    expect(items).toContain('Existing');
  });

  it('disables the Ready button when no name; enables when name present', async () => {
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBeTrue();

    component.playerName = 'Alice';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(btn.disabled).toBeFalse();
  });

  it('click Ready adds the player via updateDoc when name is unique', async () => {
    component.playerName = 'Alice';
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('button') as HTMLButtonElement).click();

    await fixture.whenStable();
    expect(docSpy).toHaveBeenCalled();
    expect(updateDocSpy).toHaveBeenCalled();
  });

  it('sets errorMessage when name is taken and does NOT call updateDoc', async () => {
    // Override getDoc to return a lobby where 'Alice' already exists
    const fakeGetDocTaken = <
      AppModelType,
      DbModelType extends fs.DocumentData
    >(
      _ref: fs.DocumentReference<AppModelType, DbModelType>
    ): Promise<fs.DocumentSnapshot<AppModelType, DbModelType>> => {
      const snap = makeDocSnap<AppModelType, DbModelType>(
        { players: [{ name: 'Alice' }] } as unknown as AppModelType
      );
      return Promise.resolve(snap);
    };
    (getDocSpy as any).and.callFake(fakeGetDocTaken as any);

    component.playerName = 'Alice';
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('button') as HTMLButtonElement).click();

    await fixture.whenStable();
    expect(component.errorMessage).toContain('taken');
    expect(updateDocSpy).not.toHaveBeenCalled();
  });
});
