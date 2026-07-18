import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TaskStore } from '../task.store';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent implements OnInit {
  protected readonly store = inject(TaskStore);

  ngOnInit(): void {
    this.store.load();
  }

  toggle(id: string, done: boolean): void {
    this.store.update(id, { done: !done }).subscribe();
  }

  remove(id: string): void {
    this.store.remove(id).subscribe();
  }
}
