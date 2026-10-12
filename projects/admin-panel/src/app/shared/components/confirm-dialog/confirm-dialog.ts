import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [Dialog],
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
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
