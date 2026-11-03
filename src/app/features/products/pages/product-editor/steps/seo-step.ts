import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import { FieldError } from '../../../../../shared/components/field-error/field-error';
import { EditorStep, PRODUCT_EDITOR_STEP_HOST } from './editor-step';

@Component({
  selector: 'app-seo-step',
  imports: [InputText, Textarea, FieldError],
  templateUrl: './seo-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: PRODUCT_EDITOR_STEP_HOST,
})
export class SeoStep extends EditorStep {}
