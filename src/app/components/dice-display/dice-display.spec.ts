import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiceDisplay } from './dice-display';

describe('DiceDisplay', () => {
  let component: DiceDisplay;
  let fixture: ComponentFixture<DiceDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiceDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiceDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
