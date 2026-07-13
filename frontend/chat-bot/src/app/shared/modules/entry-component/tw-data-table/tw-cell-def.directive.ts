import { Directive, Input, TemplateRef } from '@angular/core';

/**
 * Attach to an <ng-template> inside <tw-data-table> to provide a custom cell renderer.
 *
 * Usage:
 *   <tw-data-table [columns]="cols" [data]="rows">
 *     <ng-template twCellDef="Status" let-row>
 *       <span class="badge">{{ row.Status }}</span>
 *     </ng-template>
 *   </tw-data-table>
 *
 * The template context exposes:
 *   $implicit → the full row object
 *   col       → the TwColumnDef for this column
 */
@Directive({ selector: '[twCellDef]' })
export class TwCellDefDirective {
  @Input('twCellDef') key!: string;

  constructor(public readonly template: TemplateRef<{ $implicit: any; col: any }>) {}
}
