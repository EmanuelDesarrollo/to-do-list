import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonChip, IonIcon, IonLabel } from '@ionic/angular';

import { Category } from '../../../features/categories/domain/models/category.model';

@Component({
  selector: 'app-category-picker',
  templateUrl: 'category-picker.component.html',
  styleUrls: ['category-picker.component.scss'],
  imports: [IonChip, IonIcon, IonLabel],
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

  toggle(category: Category): void {
    if (this.disabled) {
      return;
    }

    this.selectedCategoryId = this.selectedCategoryId === category.id ? null : category.id;
    this.onChange(this.selectedCategoryId);
    this.onTouched();
  }
}
