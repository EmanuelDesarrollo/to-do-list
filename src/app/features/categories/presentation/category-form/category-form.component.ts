import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonInput, ModalController } from '@ionic/angular';

import {
  CATEGORY_PALETTE,
  ColorPalettePickerComponent,
} from '../../../../shared/components/color-palette-picker/color-palette-picker.component';
import { Category, NewCategory } from '../../domain/models/category.model';

/** Bottom sheet de creación/edición de categoría. Devuelve un NewCategory al cerrarse con rol "save". */
@Component({
  selector: 'app-category-form',
  templateUrl: 'category-form.component.html',
  imports: [ReactiveFormsModule, IonButton, IonInput, ColorPalettePickerComponent],
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
      name: [this.category?.name ?? '', [Validators.required, Validators.pattern(/\S/)]],
      color: [this.category?.color ?? CATEGORY_PALETTE[0]],
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
