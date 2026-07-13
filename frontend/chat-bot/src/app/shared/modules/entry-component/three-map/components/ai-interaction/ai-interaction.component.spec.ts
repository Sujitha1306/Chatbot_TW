import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiInteractionComponent } from './ai-interaction.component';

describe('AiInteractionComponent', () => {
  let component: AiInteractionComponent;
  let fixture: ComponentFixture<AiInteractionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiInteractionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiInteractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
