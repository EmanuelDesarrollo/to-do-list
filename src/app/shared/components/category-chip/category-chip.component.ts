import { Component, Input } from '@angular/core';
import { IonChip, IonLabel } from '@ionic/angular';

import { NEUTRAL_CATEGORY_COLOR } from '../color-palette-picker/color-palette-picker.component';

/**
 * Chip coloreado a partir del color de una categoría.
 * - variant "tag": etiqueta pequeña (dentro de una tarea).
 * - variant "select": opción seleccionable (filtros y formulario).
 *
 * Los tonos de fondo/texto se derivan del color con color-mix() en CSS, así que
 * funcionan en claro y oscuro sin calcular nada en TypeScript.
 */
@Component({
  selector: 'app-category-chip',
  templateUrl: 'category-chip.component.html',
  styleUrls: ['category-chip.component.scss'],
  imports: [IonChip, IonLabel],
})
export class CategoryChipComponent {
  @Input({ required: true }) label!: string;
  @Input() color: string | null = null;
  @Input() variant: 'tag' | 'select' = 'tag';
  @Input() selected = false;

  readonly neutralColor = NEUTRAL_CATEGORY_COLOR;
}
