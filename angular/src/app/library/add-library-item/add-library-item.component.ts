import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { ITEM_KINDS, ItemKind, NewLibraryItem } from '../library.model';
import { LibraryService } from '../library.service';

@Component({
  selector: 'app-add-library-item',
  imports: [ReactiveFormsModule],
  templateUrl: './add-library-item.component.html',
  styleUrl: './add-library-item.component.scss',
})
export class AddLibraryItemComponent {
  private fb = inject(FormBuilder);
  private lib = inject(LibraryService);
  protected readonly kinds = ITEM_KINDS;

  // Fires after an item is successfully added. The parent uses it to close the dialog.
  readonly added = output<void>();

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    kind: ['book' as ItemKind, [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    tagsCsv: [''],

    //book only
    author: [''],
    pages: [0],

    //article onle
    url: [''],
    source: [''],

    //podcsost only
    host: [''],
    durationMinutes: [0],
  });

  readonly kind = toSignal(this.form.controls.kind.valueChanges, {
    initialValue: this.form.controls.kind.value,
  });

  protected readonly showBookFields = computed(() => this.kind() === 'book');
  protected readonly showArticleFields = computed(() => this.kind() === 'article');
  protected readonly showPodcastFields = computed(() => this.kind() === 'podcast');

  private applKindValidators(kind: ItemKind): void {
    const c = this.form.controls;
    c.author.clearValidators();
    c.pages.clearValidators();
    c.host.clearValidators();
    c.url.clearValidators();
    c.source.clearValidators();
    c.durationMinutes.clearValidators();

    switch (kind) {
      case 'book':
        c.author.addValidators([Validators.required, Validators.maxLength(100)]);
        c.pages.addValidators([Validators.required, Validators.min(1)]);
        break;
      case 'article':
        c.url.addValidators([Validators.required, Validators.maxLength(500), httpUrlValidator]);
        c.source.addValidators([Validators.required, Validators.maxLength(100)]);
        break;
      case 'podcast':
        c.host.addValidators([Validators.required, Validators.maxLength(100)]);
        c.durationMinutes.addValidators([Validators.required, Validators.min(1)]);
        break;
    }
    [c.author, c.pages, c.host, c.url, c.durationMinutes, c.source].forEach((ctrl) =>
      ctrl.updateValueAndValidity({ emitEvent: false }),
    );
  }

  // submit

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();

    const tags = v.tagsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let input: NewLibraryItem;

    switch (v.kind) {
      case 'book':
        input = {
          kind: 'book',
          title: v.title,
          tags,
          consumed: false,
          author: v.author,
          pages: v.pages,
        };
        break;
      case 'podcast':
        input = {
          kind: 'podcast',
          title: v.title,
          tags,
          consumed: false,
          host: v.host,
          durationMinutes: v.durationMinutes,
        };
        break;
      case 'article':
        input = {
          kind: 'article',
          title: v.title,
          tags,
          consumed: false,
          url: v.url,
          source: v.source,
        };
        break;
    }
    // `add()`  rests the form, and emits 'added' so we dont close dialog before success occurs
    const lastkind = v.kind;
    this.submitting.set(true);
    this.submitError.set(null);
    this.lib.add(input).subscribe({
      next: () => {
        this.submitting.set(false);
        this.form.reset();
        this.form.patchValue({ kind: lastkind });
        this.added.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err.error?.error ?? err.message ?? 'Failed to add item');
      },
    });
  }

  constructor() {
    effect(() => {
      this.applKindValidators(this.kind());
    });
  }
}
// custom validator, just checks for 'starting with' http:// or https://
function httpUrlValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value ?? '';
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? null : { httpsUrl: true };
}
