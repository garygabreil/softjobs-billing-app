import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav',
  templateUrl: './app-nav.component.html',
  styleUrls: ['./app-nav.component.css'],
})
export class AppNavComponent {
  @Input() active: 'home' | 'inventory' | 'billing' = 'home';

  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }

  goInventory(): void {
    this.router.navigate(['/product-dashboard']);
  }

  goBilling(): void {
    this.router.navigate(['/billing-dashboard']);
  }
}
