import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NewGameModalComponent } from './new-game-modal.component';

describe('NewGameModalComponent', () => {
  let component: NewGameModalComponent;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<NewGameModalComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [NewGameModalComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRefSpy }]
    }).compileComponents();

    const fixture = TestBed.createComponent(NewGameModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog with data on startGame', () => {
    component.playerName = 'Alice';
    component.gameMode = 'remote';
    component.startGame();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ mode: 'remote', playerName: 'Alice' });
  });

  it('should not close dialog if playerName missing', () => {
    component.playerName = '';
    component.startGame();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });
});
