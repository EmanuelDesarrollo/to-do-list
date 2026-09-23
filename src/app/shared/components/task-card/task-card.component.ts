import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonCheckbox,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonIcon,
} from '@ionic/angular';

import { Category } from '../../../features/categories/domain/models/category.model';
import { Task } from '../../../features/tasks/domain/models/task.model';
import { CategoryChipComponent } from '../category-chip/category-chip.component';

@Component({
  selector: 'app-task-card',
  templateUrl: 'task-card.component.html',
  styleUrls: ['task-card.component.scss'],
  imports: [
    IonItemSliding,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonIcon,
    IonItemOptions,
    IonItemOption,
    CategoryChipComponent,
  ],
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() category?: Category;

  @Output() toggleComplete = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();
}
