import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../core/services/language.service';
import { LayoutService } from '../../../../core/services/layout.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, ToggleSwitch, PageHeader],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  readonly lang = inject(LanguageService);
  readonly theme = inject(ThemeService);
  readonly layout = inject(LayoutService);
}
