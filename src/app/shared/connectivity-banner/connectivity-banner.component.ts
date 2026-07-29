import { Component } from '@angular/core';
import { ConnectivityService } from '../../services/connectivity.service';

@Component({
  selector: 'app-connectivity-banner',
  templateUrl: './connectivity-banner.component.html',
  styleUrls: ['./connectivity-banner.component.css'],
})
export class ConnectivityBannerComponent {
  constructor(public readonly connectivity: ConnectivityService) {}
}
