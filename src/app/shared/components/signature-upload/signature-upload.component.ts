import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../core/services/user.service';

/**
 * Write-only upload control: signatureUrl is intentionally never returned by the backend to the
 * platform (only embedded in reports), so this widget never shows a current-signature preview.
 */
@Component({
  selector: 'app-signature-upload',
  templateUrl: './signature-upload.component.html',
  styleUrl: './signature-upload.component.css'
})
export class SignatureUploadComponent {
  private userService = inject(UserService);

  readonly userId = input.required<number>();
  readonly uploaded = output<void>();

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly uploading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  triggerSelect(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.userService.uploadSignature(this.userId(), file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.successMessage.set('Firma actualizada.');
        this.uploaded.emit();
        input.value = '';
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        input.value = '';
        this.errorMessage.set(err.status === 403 ? 'No tienes permiso para actualizar esta firma.' : 'No se pudo subir la firma.');
      }
    });
  }
}
