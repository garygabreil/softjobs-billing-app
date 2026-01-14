import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="width"
      [attr.height]="height"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2d5c54;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e3d37;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Top curved stroke -->
      <path
        d="M 40 25 C 25 25, 15 35, 15 50 C 15 65, 30 75, 45 80 C 55 83, 60 87, 60 95 C 60 103, 55 108, 47 108"
        fill="none"
        stroke="url(#logoGradient)"
        stroke-width="18"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Bottom curved stroke (interlocking) -->
      <path
        d="M 80 95 C 95 95, 105 85, 105 70 C 105 55, 90 45, 75 40 C 65 37, 60 33, 60 25 C 60 17, 65 12, 73 12"
        fill="none"
        stroke="url(#logoGradient)"
        stroke-width="18"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Middle connecting curve for depth -->
      <ellipse
        cx="60"
        cy="60"
        rx="8"
        ry="12"
        fill="url(#logoGradient)"
        opacity="0.6"
      />
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class LogoComponent {
  @Input() width: string = '80';
  @Input() height: string = '80';
}
