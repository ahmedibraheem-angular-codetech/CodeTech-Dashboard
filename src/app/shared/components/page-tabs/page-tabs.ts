import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  input,
  output,
} from '@angular/core';
import { Tab, TabList, Tabs } from 'primeng/tabs';

import { LanguageService } from '../../../core/services/language.service';

/** One tab. The parent owns which id is selected. */
export interface PageTab {
  id: string;
  labelKey: string;
  icon: string;
}

/**
 * The application's only tab strip: PrimeNG tabs, scrolled when they overflow,
 * styled once so every page looks the same.
 */
@Component({
  selector: 'app-page-tabs',
  imports: [Tabs, TabList, Tab],
  templateUrl: './page-tabs.html',
  styleUrl: './page-tabs.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageTabs {
  readonly tabs = input.required<readonly PageTab[]>();
  readonly value = input.required<string | number | undefined>();
  readonly valueChange = output<string | number | undefined>();
  readonly lang = inject(LanguageService);
}
