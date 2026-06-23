import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TaskService } from '../task.service';

// Strongly typed shape of the form
type TaskForm = FormGroup<{
  title: import('@angular/forms').FormControl<string>;
  done: import('@angular/forms').FormControl<boolean>;
}>;

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent implements OnInit {
  // DI
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private taskService = inject(TaskService);

  // Router-bound input `:id`, Undefined if on `tasks/new`.
  readonly id = input<string>();

  // Derive state of form
  readonly isEdit = computed(() => this.id() !== undefined);
  readonly heading = computed(() => (this.isEdit() ? 'Edit task' : 'New task'));

  // UI state
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form: TaskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    done: [false],
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.taskService.getOne(id).subscribe({
      next: (task) => {
        this.form.patchValue({ title: task.title, done: task.done });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load task');
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const value = this.form.getRawValue();
    const id = this.id();

    const op$ = id ? this.taskService.update(id, value) : this.taskService.create(value);

    op$.subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (err) => {
        this.error.set(err.error?.error ?? err.message ?? 'Save failed');
        this.saving.set(false);
      },
    });
  }
}
