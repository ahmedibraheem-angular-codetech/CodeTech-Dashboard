import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
}

let nextTitleId = 0;

@Component({
  selector: 'app-confirm-dialog',
  imports: [Button, Dialog],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  /** One id per instance: the home page renders two of these dialogs. */
  readonly titleId = `confirm-title-${++nextTitleId}`;
  readonly visible = signal(false);
  readonly title = signal('');
  readonly message = signal('');
  readonly confirmLabel = signal('');
  readonly cancelLabel = signal('');
  readonly danger = signal(false);
  private pending: ((value: boolean) => void) | undefined;
  private settled = false;

  ask(options: ConfirmOptions): Promise<boolean> {
    this.title.set(options.title);
    this.message.set(options.message);
    this.confirmLabel.set(options.confirmLabel);
    this.cancelLabel.set(options.cancelLabel);
    this.danger.set(options.danger ?? false);
    this.settled = false;
    this.visible.set(true);
    return new Promise((resolve) => {
      this.pending = resolve;
    });
  }

  confirm(): void {
    this.finish(true);
  }

  cancel(): void {
    this.finish(false);
  }

  onVisible(open: boolean): void {
    this.visible.set(open);
    if (!open) {
      this.finish(false);
    }
  }

  private finish(result: boolean): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.visible.set(false);
    this.pending?.(result);
    this.pending = undefined;
  }
}
