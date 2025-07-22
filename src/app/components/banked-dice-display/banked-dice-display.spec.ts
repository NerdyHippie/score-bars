import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankedDiceDisplay } from './banked-dice-display';

describe('BankedDiceDisplay', () => {
  let component: BankedDiceDisplay;
  let fixture: ComponentFixture<BankedDiceDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankedDiceDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankedDiceDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
