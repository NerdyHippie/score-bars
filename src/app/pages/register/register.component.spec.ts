import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';

class MockAuthService {
  register = jasmine.createSpy('register');
}

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let auth: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('alerts and does NOT call AuthService.register when any field is missing', () => {
    const alertSpy = spyOn(window, 'alert');
    component.onSubmit({ firstName: 'A', lastName: '', email: 'a@b.com', password: 'pw' });
    expect(alertSpy).toHaveBeenCalled();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('calls AuthService.register with full form data', () => {
    const formData = { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'pw' };
    component.onSubmit(formData);
    expect(auth.register).toHaveBeenCalledOnceWith(formData);
  });
});
