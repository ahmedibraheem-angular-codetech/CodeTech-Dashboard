import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { LanguageService } from '../../../../core/services/language.service';
import type { PermissionModule } from '../../models/permissions.model';

@Component({
  selector: 'app-permissions-role-form',
  imports: [FormsModule, InputText, ToggleSwitch],
  templateUrl: './permissions-role-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsRoleForm {
  readonly lang = inject(LanguageService);

  readonly modules = input.required<readonly PermissionModule[]>();
  readonly draftName = model.required<string>();
  readonly draftModules = model.required<Record<string, boolean>>();

  protected moduleOn(moduleId: string): boolean {
    return this.draftModules()[moduleId] ?? false;
  }

  protected setModule(moduleId: string, value: boolean): void {
    this.draftModules.update((current) => ({ ...current, [moduleId]: value }));
  }

  protected setDraftName(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.draftName.set(target.value);
    }
  }
}
