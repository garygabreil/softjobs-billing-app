import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBT2sXIeOL8EqAickWcW3f8WzQW50EMzWs',
  authDomain: 'softjobs-app.firebaseapp.com',
  databaseURL: 'https://softjobs-app-default-rtdb.firebaseio.com',
  projectId: 'softjobs-app',
  storageBucket: 'softjobs-app.firebasestorage.app',
  messagingSenderId: '1015553325903',
  appId: '1:1015553325903:web:7aa6000a0d2d71523d633a',
  measurementId: 'G-C3F2M6SRLH',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
  ],
};
