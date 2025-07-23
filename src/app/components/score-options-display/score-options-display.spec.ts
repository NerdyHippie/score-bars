import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreOptionsDisplay } from './score-options-display';

describe('ScoreOptions', () => {
  let component: ScoreOptionsDisplay;
  let fixture: ComponentFixture<ScoreOptionsDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoreOptionsDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoreOptionsDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
