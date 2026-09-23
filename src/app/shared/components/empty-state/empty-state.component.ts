import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';

/** Estado vacío: ícono, título, texto de ayuda y un botón de acción. */
@Component({
  selector: 'app-empty-state',
  templateUrl: 'empty-state.component.html',
  styleUrls: ['empty-state.component.scss'],
  imports: [IonButton, IonIcon],
})
export class EmptyStateComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() color: 'primary' | 'secondary' = 'primary';

  @Output() action = new EventEmitter<void>();
}
