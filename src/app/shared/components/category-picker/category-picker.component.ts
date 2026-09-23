import { Component, EventEmitter, Input, Output, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Category } from '../../../features/categories/domain/models/category.model';
import { CategoryChipComponent } from '../category-chip/category-chip.component';

/**
 * Selector de categoría para formularios. Incluye "Sin categoría" (valor null).
 * Con allowCreate muestra un chip "+ Nueva" que solo emite `create`; quien lo usa decide cómo crearla.
 */
@Component({
  selector: 'app-category-picker',
  templateUrl: 'category-picker.component.html',
  styleUrls: ['category-picker.component.scss'],
  imports: [CategoryChipComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategoryPickerComponent),
      multi: true,
    },
  ],
})
export class CategoryPickerComponent implements ControlValueAccessor {
  @Input() categories: Category[] = [];
  @Input() allowCreate = false;
  @Output() create = new EventEmitter<void>();

  readonly selectedCategoryId = signal<number | null>(null);
  disabled = false;

  private onChange: (value: number | null) => void = () => { };
  private onTouched: () => void = () => { };

  writeValue(value: number | null): void {
    this.selectedCategoryId.set(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  select(categoryId: number | null): void {
    if (this.disabled) {
      return;
    }

    this.selectedCategoryId.set(categoryId);
    this.onChange(categoryId);
    this.onTouched();
  }
}
