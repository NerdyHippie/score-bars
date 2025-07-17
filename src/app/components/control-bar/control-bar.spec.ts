import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlBar } from './control-bar';

describe('ControlBar', () => {
  let component: ControlBar;
  let fixture: ComponentFixture<ControlBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ControlBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
