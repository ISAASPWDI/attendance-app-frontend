import { Component, ElementRef, OnDestroy, inject, input, output, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../core/services/user.service';

/**
 * Write-only upload control: signatureUrl is intentionally never returned by the backend to the
 * platform (only embedded in reports), so this widget never shows the currently-saved signature —
 * only a local preview of the file about to be uploaded, before it's confirmed.
 */
@Component({
  selector: 'app-signature-upload',
  templateUrl: './signature-upload.component.html',
  styleUrl: './signature-upload.component.css'
})
export class SignatureUploadComponent implements OnDestroy {
  private userService = inject(UserService);

  readonly userId = input.required<number>();
  readonly uploaded = output<void>();

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly uploading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly pendingFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);

  triggerSelect(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.revokePreview();
    this.pendingFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  confirmUpload(): void {
    const file = this.pendingFile();
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    this.userService.uploadSignature(this.userId(), file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.successMessage.set('Firma actualizada.');
        this.uploaded.emit();
        this.clearPending();
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.errorMessage.set(err.status === 403 ? 'No tienes permiso para actualizar esta firma.' : 'No se pudo subir la firma.');
      }
    });
  }

  cancelUpload(): void {
    this.clearPending();
  }

  private clearPending(): void {
    this.revokePreview();
    this.pendingFile.set(null);
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }
}
