import { Component, Input } from '@angular/core';
import { IonChip, IonLabel } from '@ionic/angular';

import { Category } from '../../../features/categories/domain/models/category.model';

@Component({
  selector: 'app-category-chip',
  templateUrl: 'category-chip.component.html',
  styleUrls: ['category-chip.component.scss'],
  imports: [IonChip, IonLabel],
})
export class CategoryChipComponent {
  @Input({ required: true }) category!: Category;
}
