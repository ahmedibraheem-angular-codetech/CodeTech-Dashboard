import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ProductUpload } from './product-upload';

@Component({
  imports: [ProductUpload],
  template: `
    <app-product-upload
      [keyPrefix]="prefix"
      [clearable]="clearable"
      [name]="name"
      [url]="url"
      (picked)="picked = $event"
      (cleared)="cleared = true"
    />
  `,
})
class Host {
  prefix = 'product';
  clearable = false;
  name = '';
  url = '';
  picked: { name: string; url: string } | null = null;
  cleared = false;
}

describe('ProductUpload', () => {
  afterEach(() => {
    localStorage.setItem('codetech.language', 'ar');
  });

  function create(setup?: (host: Host) => void) {
    TestBed.configureTestingModule({ imports: [Host] });
    localStorage.setItem('codetech.language', 'en');
    const fixture = TestBed.createComponent(Host);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    return fixture;
  }

  it('hides the clear control by default for Products', () => {
    const fixture = create((host) => {
      host.url = 'https://example.com/cover.jpg';
    });
    expect(fixture.nativeElement.querySelector('.uploader__clear')).toBeNull();
  });

  it('clears the draft when clearable and cleared is emitted', () => {
    const fixture = create((host) => {
      host.clearable = true;
      host.url = 'https://example.com/cover.jpg';
      host.name = 'cover.jpg';
    });
    const clear = fixture.nativeElement.querySelector('.uploader__clear') as HTMLButtonElement;
    expect(clear).not.toBeNull();
    clear.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.cleared).toBe(true);
  });

  it('rejects images larger than 5 MB and keeps the previous selection', () => {
    const fixture = create((host) => {
      host.url = 'https://example.com/keep.jpg';
    });
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(input, 'files', { value: [oversized] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.picked).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('exceeds the 5 MB limit');
    expect(fixture.componentInstance.url).toBe('https://example.com/keep.jpg');
  });

  it('shows an icon preview when the url is an icon reference', () => {
    const fixture = create((host) => {
      host.url = 'icon:pi-cloud';
      host.name = 'pi-cloud';
    });
    expect(fixture.nativeElement.querySelector('.uploader__mark--icon .pi-cloud')).not.toBeNull();
  });
});
