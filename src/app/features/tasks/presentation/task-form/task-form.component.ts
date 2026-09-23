import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonInput, ModalController } from '@ionic/angular';

import { FeatureFlagsService } from '../../../../core/feature-flags/feature-flags.service';
import { FeedbackService } from '../../../../core/feedback/feedback.service';
import { Category, NewCategory } from '../../../categories/domain/models/category.model';
import { CategoryRepository } from '../../../categories/domain/repositories/category.interface';
import { CategoryFormComponent } from '../../../categories/presentation/category-form/category-form.component';
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

  // Se agrega un signal para las opciones de categoria porque al agregar una nueva categoria con la feature de firebase
  // no esta renderizando nuevamente el modal porque no detectaba cambios reales, por ende con el signal al actualizarlo 
  // ya Angular toma un cambio en pantalla y renderiza la nueva categoria. 
  readonly categoryOptions = signal<Category[]>([]);

  private readonly formBuilder = inject(FormBuilder);
  private readonly modalController = inject(ModalController);
  private readonly categoryRepository = inject(CategoryRepository);
  private readonly featureFlags = inject(FeatureFlagsService);
  private readonly feedback = inject(FeedbackService);

  // Flag de Remote Config: habilita el chip "+ Nueva" en el selector de categoría.
  readonly canCreateCategory = this.featureFlags.categoryFromTask;

  form!: FormGroup;

  get isEditMode(): boolean {
    return !!this.task;
  }

  ngOnInit(): void {
    this.categoryOptions.set(this.categories);
    this.form = this.formBuilder.group({
      title: [this.task?.title ?? '', [Validators.required, Validators.pattern(/\S/)]],
      categoryId: [this.task?.categoryId ?? null],
    });
  }

  cancel(): void {
    this.modalController.dismiss(null, 'cancel');
  }

  /**
   * Abre el formulario de categoría encima de este sheet, la guarda y la deja seleccionada,
   * sin salir de la tarea que se está creando/editando.
   */
  async createCategory(): Promise<void> {
    const modal = await this.modalController.create({
      component: CategoryFormComponent,
      cssClass: 'app-sheet',
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<NewCategory>();
    if (role !== 'save' || !data) {
      return;
    }

    await this.feedback.attempt(
      async () => {
        const category = await this.categoryRepository.create(data);
        this.categoryOptions.update((list) => [...list, category]);
        this.form.controls['categoryId'].setValue(category.id);
      },
      { success: 'Categoría creada', error: 'No se pudo crear la categoría' },
    );
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
