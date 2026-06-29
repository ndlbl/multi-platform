import { afterNextRender, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { forkJoin } from 'rxjs';
import { filter, pairwise } from 'rxjs/operators';

import { AuthService } from './core/auth.service';
import { ConnectivityService } from './core/connectivity.service';
import { OfflineQueueService } from './core/offline-queue.service';
import { SnackbarComponent } from './core/snackbar.component';
import { SpinnerComponent } from './core/spinner.component';
import { ToastHostComponent } from './core/toas-host.component';
import { ToastService } from './core/toast.service';
import { LibraryService } from './library/library.service';
import { TaskService } from './tasks/task.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    SpinnerComponent,
    ToastHostComponent,
    RouterLinkActive,
    SnackbarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private taskService = inject(TaskService);
  private libraryService = inject(LibraryService);
  private toast = inject(ToastService);
  private swUpdate = inject(SwUpdate);

  protected readonly connectivity = inject(ConnectivityService);
  protected readonly offlineQueue = inject(OfflineQueueService);

  protected readonly currentUser = this.auth.currentUser;
  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly isAdmin = this.auth.isAdmin;

  protected readonly hydrated = signal(false);
  protected readonly syncing = signal(false);
  protected readonly updateAvailable = signal(false);
  protected readonly menuOpen = signal(false);

  constructor() {
    afterNextRender(() => this.hydrated.set(true));

    // Close mobile menu on any navigation
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));

    // Detect the offline → online transition.
    toObservable(this.connectivity.online)
      .pipe(
        pairwise(),
        // only need to act on false->true, not on every 'online'
        filter(([prev, curr]) => !prev && curr),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.syncOnReconnect());

    // Listen for a new SW version becoming ready and surface the snackbar.
    // isEnabled is false in dev mode (SW is disabled), so this is a no-op locally.
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'),
          takeUntilDestroyed(),
        )
        .subscribe(() => this.updateAvailable.set(true));
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  protected reloadApp(): void {
    window.location.reload();
  }

  private syncOnReconnect(): void {
    const pending = this.offlineQueue.totalPending();
    if (pending === 0) return;

    this.syncing.set(true);

    forkJoin([this.taskService.flush(), this.libraryService.flush()]).subscribe({
      complete: () => {
        this.syncing.set(false);
        this.toast.show(`${pending} change${pending === 1 ? '' : 's'} synced`, 'success');
      },
    });
  }
}
