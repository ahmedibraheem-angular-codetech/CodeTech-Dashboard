import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Step, StepList, Stepper } from 'primeng/stepper';

export interface WizardStepItem {
  id: string;
  label: string;
}

/** Horizontal PrimeNG stepper. A step shows a check only after it has been left. */
@Component({
  selector: 'app-wizard-stepper',
  imports: [Stepper, StepList, Step],
  templateUrl: './wizard-stepper.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardStepper {
  readonly steps = input.required<readonly WizardStepItem[]>();
  readonly active = input.required<number>();
  /** Highest index the user has already left. */
  readonly passed = input(-1);
  readonly picked = output<number>();

  protected done(index: number): boolean {
    return index <= this.passed() && index !== this.active();
  }

  protected choose(index: number): void {
    if (index > this.active()) {
      return;
    }
    this.picked.emit(index);
  }
}
