import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AIPromptFormComponent } from './ai-prompt-form.component';

describe('AIPromptFormComponent', () => {
  let component: AIPromptFormComponent;
  let fixture: ComponentFixture<AIPromptFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AIPromptFormComponent]
    });
    fixture = TestBed.createComponent(AIPromptFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
