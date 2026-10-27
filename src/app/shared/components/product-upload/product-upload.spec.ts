import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ObjectUrls } from './object-urls';
import { ProductUpload } from './product-upload';

@Component({
  imports: [ProductUpload],
  template: `
    @if (show) {
      <app-product-upload
        [keyPrefix]="prefix"
        [clearable]="clearable"
        [actions]="actions"
        [name]="name"
        [url]="url"
        (picked)="onPicked($event)"
        (cleared)="onCleared()"
      />
    }
  `,
})
class Host {
  prefix = 'product';
  clearable = false;
  actions = false;
  /** Mounts or destroys the upload, like leaving and re-entering a wizard step. */
  show = true;
  /** When set, the host behaves like a draft that keeps the value it was given. */
  follow = false;
  name = '';
  url = '';
  picked: { name: string; url: string } | null = null;
  cleared = false;

  onPicked(file: { name: string; url: string }): void {
    this.picked = file;
    if (this.follow) {
      this.name = file.name;
      this.url = file.url;
    }
  }

  onCleared(): void {
    this.cleared = true;
    if (this.follow) {
      this.name = '';
      this.url = '';
    }
  }
}

describe('ProductUpload', () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  let created = 0;
  let revoke: ReturnType<typeof vi.fn<(url: string) => void>>;

  beforeEach(() => {
    created = 0;
    revoke = vi.fn<(url: string) => void>();
    URL.createObjectURL = () => `blob:test/${(created += 1)}`;
    URL.revokeObjectURL = revoke;
  });

  afterEach(() => {
    localStorage.setItem('codetech.language', 'ar');
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
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
  function fileInput(fixture: ReturnType<typeof create>): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
  }

  function pick(fixture: ReturnType<typeof create>, name = 'a.png', type = 'image/png'): void {
    const input = fileInput(fixture);
    Object.defineProperty(input, 'files', {
      value: [new File([new Uint8Array([1])], name, { type })],
      configurable: true,
    });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  /** The host is driven by plain fields, so it has to be marked dirty by hand. */
  function refresh(fixture: ReturnType<typeof create>): void {
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  }

  function remount(fixture: ReturnType<typeof create>): void {
    fixture.componentInstance.show = false;
    refresh(fixture);
    fixture.componentInstance.show = true;
    refresh(fixture);
  }

  function preview(fixture: ReturnType<typeof create>): string | undefined {
    return fixture.nativeElement.querySelector('img.uploader__preview')?.getAttribute('src');
  }

  describe('object URL lifecycle', () => {
    it('emits a preview URL and shows it', () => {
      const fixture = create((host) => (host.follow = true));
      pick(fixture, 'cover.png');
      expect(fixture.componentInstance.picked).toEqual({ name: 'cover.png', url: 'blob:test/1' });
      expect(preview(fixture)).toBe('blob:test/1');
      expect(revoke).not.toHaveBeenCalled();
    });

    it('keeps the preview valid when the upload is destroyed and mounted again', () => {
      const fixture = create((host) => (host.follow = true));
      pick(fixture);

      remount(fixture);

      expect(revoke).not.toHaveBeenCalled();
      expect(fixture.componentInstance.url).toBe('blob:test/1');
      expect(preview(fixture)).toBe('blob:test/1');
    });

    it('revokes the previous URL when the image is replaced, but not the new one', () => {
      const fixture = create((host) => (host.follow = true));
      pick(fixture, 'first.png');
      pick(fixture, 'second.png');

      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:test/1');
      expect(preview(fixture)).toBe('blob:test/2');
    });

    it('revokes the previous URL when replacing after the upload was mounted again', () => {
      const fixture = create((host) => (host.follow = true));
      pick(fixture, 'first.png');
      remount(fixture);
      expect(revoke).not.toHaveBeenCalled();

      pick(fixture, 'second.png');

      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:test/1');
      expect(fixture.componentInstance.url).toBe('blob:test/2');
    });

    it('revokes the URL when a clearable image is cleared', () => {
      const fixture = create((host) => {
        host.follow = true;
        host.clearable = true;
      });
      pick(fixture);
      (fixture.nativeElement.querySelector('.uploader__clear') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(revoke).toHaveBeenCalledTimes(1);
      expect(revoke).toHaveBeenCalledWith('blob:test/1');
      expect(fixture.componentInstance.cleared).toBe(true);
      expect(fixture.nativeElement.querySelector('.uploader__clear')).toBeNull();
    });

    it('revokes the URL when an icon from the library replaces the image', () => {
      const fixture = create((host) => {
        host.follow = true;
        host.actions = true;
      });
      const [library, upload] = [
        ...fixture.nativeElement.querySelectorAll('.uploader__action'),
      ] as HTMLButtonElement[];
      expect(upload).toBeDefined();
      pick(fixture);
      library.click();
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.icon-library__item') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(revoke).toHaveBeenCalledWith('blob:test/1');
      expect(fixture.componentInstance.url).toMatch(/^icon:pi-/);
    });

    it('does not revoke a saved blob URL when an unsaved icon replaces it', () => {
      const fixture = create((host) => {
        host.follow = true;
        host.actions = true;
      });
      pick(fixture);
      TestBed.inject(ObjectUrls).sync(null, { url: 'blob:test/1' });
      const [library] = [
        ...fixture.nativeElement.querySelectorAll('.uploader__action'),
      ] as HTMLButtonElement[];
      library.click();
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.icon-library__item') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(revoke).not.toHaveBeenCalled();
      expect(fixture.componentInstance.url).toMatch(/^icon:pi-/);
    });

    it('never revokes values it did not create', () => {
      const fixture = create((host) => {
        host.follow = true;
        host.clearable = true;
        host.url = '/images/seed.jpg';
      });
      (fixture.nativeElement.querySelector('.uploader__clear') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(revoke).not.toHaveBeenCalled();

      fixture.componentInstance.url = 'icon:pi-cloud';
      fixture.componentInstance.actions = true;
      refresh(fixture);
      pick(fixture);
      expect(revoke).not.toHaveBeenCalled();
    });

    it('releases every URL still alive when the application is torn down', () => {
      const fixture = create((host) => (host.follow = true));
      pick(fixture, 'first.png');
      pick(fixture, 'second.png');
      fixture.destroy();
      expect(revoke).toHaveBeenCalledTimes(1);

      TestBed.resetTestingModule();

      expect(revoke).toHaveBeenCalledTimes(2);
      expect(revoke).toHaveBeenLastCalledWith('blob:test/2');
    });
  });

  describe('selection', () => {
    it('accepts an image dropped on the field', () => {
      const fixture = create();
      const field = fixture.nativeElement.querySelector('label.uploader') as HTMLLabelElement;
      const drop = new Event('drop', { cancelable: true });
      const file = new File([new Uint8Array([1])], 'drop.png', { type: 'image/png' });
      Object.defineProperty(drop, 'dataTransfer', { value: { files: [file] } });
      field.dispatchEvent(drop);
      expect(fixture.componentInstance.picked).toEqual({ name: 'drop.png', url: 'blob:test/1' });
    });

    it('ignores a file that is not an image', () => {
      const fixture = create();
      pick(fixture, 'notes.txt', 'text/plain');
      expect(fixture.componentInstance.picked).toBeNull();
      expect(created).toBe(0);
    });

    it('does not create or revoke anything for an oversized image', () => {
      const fixture = create((host) => {
        host.follow = true;
        host.url = '/images/keep.jpg';
      });
      const input = fileInput(fixture);
      const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(input, 'files', { value: [oversized], configurable: true });
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(created).toBe(0);
      expect(revoke).not.toHaveBeenCalled();
      expect(fixture.componentInstance.url).toBe('/images/keep.jpg');
    });
  });
});
