import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConnectivityService implements OnDestroy {
  private readonly onlineSubject = new BehaviorSubject<boolean>(this.readOnline());
  readonly online$ = this.onlineSubject.asObservable();

  private readonly onOnline = (): void => {
    this.ngZone.run(() => this.onlineSubject.next(true));
  };

  private readonly onOffline = (): void => {
    this.ngZone.run(() => this.onlineSubject.next(false));
  };

  constructor(private readonly ngZone: NgZone) {
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    document.body.classList.toggle('is-offline', !this.readOnline());
    this.online$.subscribe((online) => document.body.classList.toggle('is-offline', !online));
  }

  get online(): boolean {
    return this.onlineSubject.value;
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }

  private readOnline(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }
}
