import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import { FieldError } from '../../../../../shared/components/field-error/field-error';
import { EditorStep, PROJECT_EDITOR_STEP_HOST } from './editor-step';

@Component({
  selector: 'app-project-seo-step',
  imports: [InputText, Textarea, FieldError],
  templateUrl: './seo-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: PROJECT_EDITOR_STEP_HOST,
})
export class SeoStep extends EditorStep {}
