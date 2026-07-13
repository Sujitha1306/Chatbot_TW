import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalUserComponent } from './external-user.component';

describe('ExternalUserComponent', () => {
  let component: ExternalUserComponent;
  let fixture: ComponentFixture<ExternalUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExternalUserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExternalUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
