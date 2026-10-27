import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { FieldError } from '../../../../../shared/components/field-error/field-error';
import { StateView } from '../../../../../shared/components/state-view/state-view';
import { ProductUpload } from '../../../../products/components/product-upload/product-upload';
import { ServiceIconPicker } from '../../../components/service-icon-picker/service-icon-picker';
import { ServiceProjectCard } from '../../../components/service-project-card/service-project-card';
import { EditorStep } from './editor-step';

const stepHost = { style: 'display: contents' };
/** Translation prefix for the upload chrome (`service.uploadHint`, `service.clearImage`, …). */
const uploadPrefix = 'service';

@Component({
  selector: 'app-service-why-step',
  imports: [
    IconField,
    InputIcon,
    InputText,
    Textarea,
    ProductUpload,
    FieldError,
    ServiceIconPicker,
  ],
  templateUrl: './why-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class WhyStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
}

@Component({
  selector: 'app-service-solutions-step',
  imports: [FeatureCard],
  templateUrl: './solutions-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class SolutionsStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
}

@Component({
  selector: 'app-service-stages-step',
  imports: [FeatureCard],
  templateUrl: './stages-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class StagesStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
}

@Component({
  selector: 'app-service-features-step',
  imports: [FeatureCard],
  templateUrl: './features-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class FeaturesStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
}

@Component({
  selector: 'app-service-projects-step',
  imports: [StateView, ServiceProjectCard],
  templateUrl: './projects-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class ProjectsStep extends EditorStep {}

@Component({
  selector: 'app-service-sectors-step',
  imports: [ProductUpload],
  templateUrl: './sectors-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class SectorsStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
}

@Component({
  selector: 'app-service-faq-step',
  imports: [FeatureCard],
  templateUrl: './faq-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class FaqStep extends EditorStep {}
