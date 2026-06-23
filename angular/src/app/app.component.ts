import { afterNextRender, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { SpinnerComponent } from './core/spinner.component';
import { ToastHostComponent } from './core/toas-host.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SpinnerComponent, ToastHostComponent, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // AuthService signals
  protected readonly currentUser = this.auth.currentUser;
  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly isAdmin = this.auth.isAdmin;

  // force false to avoid prerender mismatch, after first load real auth takes over.
  protected readonly hydrated = signal(false);
  constructor() {
    afterNextRender(() => this.hydrated.set(true));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
