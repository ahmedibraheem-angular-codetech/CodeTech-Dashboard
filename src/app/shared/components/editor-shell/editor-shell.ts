import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from 'primeng/button';

import type { AppLanguage } from '../../../core/i18n/language';
import { LocaleSwitch } from '../locale-switch/locale-switch';
import { PageHeader } from '../page-header/page-header';
import { StateView } from '../state-view/state-view';
import { WizardStepper, type WizardStepItem } from '../wizard-stepper/wizard-stepper';

/** Already translated labels. The shell does not know a feature's translation keys. */
export interface EditorShellLabels {
  saveDraft: string;
  publish: string;
  unpublish: string;
  save: string;
  next: string;
  previous: string;
  finish: string;
  loading: string;
  missing: string;
  error: string;
}

/**
 * Shared editor frame: header actions, load states, stepper or tabs, locale switch, and footer.
 * The feature owns the draft and projects the step body.
 */
@Component({
  selector: 'app-editor-shell',
  imports: [PageHeader, Button, LocaleSwitch, StateView, WizardStepper],
  templateUrl: './editor-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorShell {
  readonly title = input.required<string>();
  readonly mode = input.required<'create' | 'edit'>();
  readonly status = input.required<'loading' | 'ready' | 'missing' | 'error'>();
  readonly saving = input(false);
  readonly published = input(false);
  readonly steps = input.required<readonly WizardStepItem[]>();
  readonly active = input.required<number>();
  readonly passed = input(-1);
  readonly lastStep = input(false);
  readonly locale = input.required<AppLanguage>();
  readonly labels = input.required<EditorShellLabels>();
  readonly panelId = input('editor-panel');
  readonly tabIdPrefix = input('editor-tab');

  readonly saveDraft = output<void>();
  readonly publishChange = output<boolean>();
  readonly save = output<void>();
  readonly retry = output<void>();
  readonly stepChange = output<number>();
  readonly next = output<void>();
  readonly previous = output<void>();
  readonly localeChange = output<AppLanguage>();
}
