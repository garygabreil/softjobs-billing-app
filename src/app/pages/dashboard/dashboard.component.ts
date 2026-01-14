import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '../../components/logo/logo.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LogoComponent],
  template: `
    <div class="container-fluid min-vh-100 bg-light">
      <div class="row justify-content-center align-items-center min-vh-100">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow-lg border-0">
            <div class="card-body text-center p-5">
              <!-- Logo and Company Name -->
              <div class="mb-4">
                <div class="mb-3">
                  <app-logo width="100" height="100"></app-logo>
                </div>
                <h2 class="mb-1">SOFTJOBS</h2>
                <p class="text-muted small">
                  Computer Sales & Services, Toner Refilling, Online Entry,
                  Printer Service<br />
                </p>
              </div>

              <!-- Buttons -->
              <div class="d-grid gap-3">
                <button routerLink="/quotation" class="btn btn-primary btn-lg">
                  <i class="bi bi-file-text me-2"></i>Quotations
                </button>

                <button routerLink="/billing" class="btn btn-primary btn-lg">
                  <i class="bi bi-receipt me-2"></i>Billing
                </button>

                <button routerLink="/inventory" class="btn btn-primary btn-lg">
                  <i class="bi bi-archive me-2"></i>Inventory & Search
                </button>

                <button routerLink="/products" class="btn btn-warning btn-lg">
                  <i class="bi bi-plus-circle me-2"></i>Add Products
                </button>
              </div>

              <!-- Footer Info -->
              <div class="mt-4 pt-3 border-top">
                <p class="text-muted small mb-1">
                  65B Katchery road, Satya Sweets Opps, <br />
                  Kallakurichi-606 202
                </p>
                <p class="text-muted small mb-1">
                  Gmail: jtittus&#64;gmail.com, Tel: 04151-290013, <br />
                  Cell: 9994740907,
                </p>
                <p class="text-muted small">GST No: 33ADYPT100461ZJ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .logo-placeholder {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    `,
  ],
})
export class DashboardComponent {}
