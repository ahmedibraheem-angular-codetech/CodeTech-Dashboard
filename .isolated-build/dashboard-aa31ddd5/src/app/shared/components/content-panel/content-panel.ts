import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-content-panel',
  templateUrl: './content-panel.html',
  styleUrl: './content-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPanel {}
