import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';

import { Category, NewCategory } from '../../domain/models/category.model';

const DEFAULT_COLOR = '#3880ff';

/** Modal de creación/edición de categoría. Devuelve un NewCategory al cerrarse con rol "save". */
@Component({
  selector: 'app-category-form',
  templateUrl: 'category-form.component.html',
  styleUrls: ['category-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonInput,
  ],
})
export class CategoryFormComponent implements OnInit {
  @Input() category?: Category;

  private readonly formBuilder = inject(FormBuilder);
  private readonly modalController = inject(ModalController);

  form!: FormGroup;

  get isEditMode(): boolean {
    return !!this.category;
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      name: [this.category?.name ?? '', [Validators.required]],
      color: [this.category?.color ?? DEFAULT_COLOR],
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

    const result: NewCategory = this.form.value;
    this.modalController.dismiss(result, 'save');
  }
}
