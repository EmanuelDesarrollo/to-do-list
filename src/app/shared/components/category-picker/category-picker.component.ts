import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Category } from '../../../features/categories/domain/models/category.model';
import { CategoryChipComponent } from '../category-chip/category-chip.component';

/** Selector de categoría para formularios. Incluye "Sin categoría" (valor null). */
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

  selectedCategoryId: number | null = null;
  disabled = false;

  private onChange: (value: number | null) => void = () => { };
  private onTouched: () => void = () => { };

  writeValue(value: number | null): void {
    this.selectedCategoryId = value;
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

    this.selectedCategoryId = categoryId;
    this.onChange(categoryId);
    this.onTouched();
  }
}
