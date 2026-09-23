import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonCheckbox,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
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

  get createdLabel(): string {
    return formatCreatedDate(this.task.createdAt);
  }
}

/**
 * Fecha de creación como "MM-DD" si es del año actual, o "YYYY-MM-DD" si es de otro año.
 */
function formatCreatedDate(iso: string): string {
  // Convertimos el iso a un objeto Date para manipularlo (queda en la zona horaria local).
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  // getMonth() empieza en 0 (enero = 0), por eso se suma 1. padStart agrega el cero inicial: 3 -> "03".
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return year === new Date().getFullYear() ? `${month}-${day}` : `${year}-${month}-${day}`;
}
