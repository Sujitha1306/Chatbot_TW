import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';

@Component({
  selector: 'app-floor-plan',
  templateUrl: './floor-plan.component.html',
  styleUrls: ['./floor-plan.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class FloorPlanComponent {

  public contextOptions = {
    'show': {
      'navbar': true,
      'navMenu': true,
      'blockSelect': true,
      'floorSelect': true,
      'searchBox': true,
      'navBlkImg': true,
      'navBlkContent': true,
      'navBlkList': true,
      'filterOption': true,
      'editable': true
    }
  }
  public floorId = null;
  public blockId = null;

  constructor() { }

}
