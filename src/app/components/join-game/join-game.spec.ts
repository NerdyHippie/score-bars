import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinGame } from './join-game';

describe('JoinGame', () => {
  let component: JoinGame;
  let fixture: ComponentFixture<JoinGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
