import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// Paleta cerrada de colores para categorías (tonos cálidos del diseño).
export const CATEGORY_PALETTE = ['#c99a3e', '#6c8a95', '#92637a', '#8a8a4e', '#b0563f', '#7d7566'];

// Color usado cuando una tarea no tiene categoría o la categoría no tiene color.
export const NEUTRAL_CATEGORY_COLOR = '#7d7566';

@Component({
  selector: 'app-color-palette-picker',
  templateUrl: 'color-palette-picker.component.html',
  styleUrls: ['color-palette-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPalettePickerComponent),
      multi: true,
    },
  ],
})
export class ColorPalettePickerComponent implements ControlValueAccessor {
  selectedColor: string | null = null;
  disabled = false;

  private onChange: (value: string) => void = () => { };
  private onTouched: () => void = () => { };

  get colors(): string[] {
    const selected = this.selectedColor;
    return selected && !CATEGORY_PALETTE.includes(selected) ? [selected, ...CATEGORY_PALETTE] : CATEGORY_PALETTE;
  }

  writeValue(value: string | null): void {
    this.selectedColor = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  select(color: string): void {
    if (this.disabled) {
      return;
    }

    this.selectedColor = color;
    this.onChange(color);
    this.onTouched();
  }
}
