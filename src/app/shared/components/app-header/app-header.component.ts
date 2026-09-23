import { Component, Input, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';

import { ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: 'app-header.component.html',
  styleUrls: ['app-header.component.scss'],
  imports: [IonButton, IonIcon],
})
export class AppHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';

  readonly theme = inject(ThemeService);
}
