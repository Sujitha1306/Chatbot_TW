import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateActivityRuleComponent } from './create-activity-rule.component';

describe('CreateActivityRuleComponent', () => {
  let component: CreateActivityRuleComponent;
  let fixture: ComponentFixture<CreateActivityRuleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateActivityRuleComponent]
    });
    fixture = TestBed.createComponent(CreateActivityRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
