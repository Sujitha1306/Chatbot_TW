import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePwaTicketComponent } from './create-pwa-ticket.component';

describe('CreatePwaTicketComponent', () => {
  let component: CreatePwaTicketComponent;
  let fixture: ComponentFixture<CreatePwaTicketComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreatePwaTicketComponent]
    });
    fixture = TestBed.createComponent(CreatePwaTicketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
