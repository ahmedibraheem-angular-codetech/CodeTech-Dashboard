import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButton } from 'primeng/selectbutton';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../core/services/language.service';
import { LayoutService } from '../../../../core/services/layout.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, SelectButton, ToggleSwitch, PageHeader],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  readonly lang = inject(LanguageService);
  readonly theme = inject(ThemeService);
  readonly layout = inject(LayoutService);

  readonly densityOptions = computed(() => [
    { label: this.lang.t('settings.comfortable'), value: 'comfortable' },
    { label: this.lang.t('settings.compact'), value: 'compact' },
  ]);
  readonly themeOptions = computed(() => [
    { label: this.lang.t('settings.themeLight'), value: 'light' },
    { label: this.lang.t('settings.themeDark'), value: 'dark' },
  ]);
  readonly languageOptions = computed(() => [
    { label: this.lang.t('settings.languageAr'), value: 'ar' },
    { label: this.lang.t('settings.languageEn'), value: 'en' },
  ]);
}
