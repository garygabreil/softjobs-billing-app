import { AbstractControl, FormArray, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const PHONE_PATTERN = /^[6-9]\d{9}$/;

export const phoneValidator = Validators.pattern(PHONE_PATTERN);

export function minLengthTrimmed(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '').toString().trim();
    if (!value) {
      return null;
    }
    return value.length >= min ? null : { minlength: { requiredLength: min, actualLength: value.length } };
  };
}

export function requiredWhenGst(isGst: () => boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!isGst()) {
      return null;
    }
    const value = (control.value || '').toString().trim();
    return value ? null : { required: true };
  };
}

export function getControlError(control: AbstractControl | null, label: string): string {
  if (!control || !control.errors || !(control.touched || control.dirty)) {
    return '';
  }

  if (control.errors['required']) {
    return `${label} is required`;
  }
  if (control.errors['minlength']) {
    return `${label} must be at least ${control.errors['minlength'].requiredLength} characters`;
  }
  if (control.errors['min']) {
    return `${label} must be at least ${control.errors['min'].min}`;
  }
  if (control.errors['pattern']) {
    if (label.toLowerCase().includes('phone')) {
      return 'Enter a valid 10-digit mobile number';
    }
    return `${label} format is invalid`;
  }

  return `${label} is invalid`;
}

export function markAllControlsTouched(control: AbstractControl): void {
  control.markAsTouched();

  if (control instanceof FormGroup) {
    Object.values(control.controls).forEach((child) => markAllControlsTouched(child));
    return;
  }

  if (control instanceof FormArray) {
    control.controls.forEach((child) => markAllControlsTouched(child));
  }
}
