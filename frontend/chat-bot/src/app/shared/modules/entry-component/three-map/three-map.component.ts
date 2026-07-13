import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MapViewerComponent } from './components/map-viewer/map-viewer.component';
import { AiInteractionComponent } from './components/ai-interaction/ai-interaction.component';

@Component({
  selector: 'app-three-map',
  standalone: false,
  templateUrl: './three-map.component.html',
  styleUrls: ['./three-map.component.scss']
})
export class ThreeMapComponent {
  constructor(private router: Router) { }

  navigateToMultipleMap(): void {
    this.router.navigate(['/three-multi-view']);
  }
}
