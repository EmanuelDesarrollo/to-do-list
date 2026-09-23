import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonInput, ModalController } from '@ionic/angular';

import { Category } from '../../../categories/domain/models/category.model';
import { CategoryPickerComponent } from '../../../../shared/components/category-picker/category-picker.component';
import { NewTask, Task } from '../../domain/models/task.model';

// Bottom sheet de creación/edición de tarea. Devuelve un NewTask al cerrarse con rol "save".
@Component({
  selector: 'app-task-form',
  templateUrl: 'task-form.component.html',
  imports: [ReactiveFormsModule, IonButton, IonInput, CategoryPickerComponent],
})
export class TaskFormComponent implements OnInit {
  @Input() task?: Task;
  @Input() categories: Category[] = [];

  private readonly formBuilder = inject(FormBuilder);
  private readonly modalController = inject(ModalController);

  form!: FormGroup;

  get isEditMode(): boolean {
    return !!this.task;
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      title: [this.task?.title ?? '', [Validators.required, Validators.pattern(/\S/)]],
      categoryId: [this.task?.categoryId ?? null],
    });
  }

  cancel(): void {
    this.modalController.dismiss(null, 'cancel');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const result: NewTask = this.form.value;
    this.modalController.dismiss(result, 'save');
  }
}
