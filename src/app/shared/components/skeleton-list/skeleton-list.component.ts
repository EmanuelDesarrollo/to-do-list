import { Component, Input } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular';

/** Filas placeholder mientras se consulta SQLite por primera vez. */
@Component({
  selector: 'app-skeleton-list',
  templateUrl: 'skeleton-list.component.html',
  styleUrls: ['skeleton-list.component.scss'],
  imports: [IonSkeletonText],
})
export class SkeletonListComponent {
  // "task": círculo + dos líneas; "category": círculo + una línea.
  @Input() variant: 'task' | 'category' = 'task';

  readonly rows = [1, 2, 3];
}
