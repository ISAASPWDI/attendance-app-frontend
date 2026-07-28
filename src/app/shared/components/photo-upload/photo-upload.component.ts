import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../core/services/user.service';
import { ImageCropperComponent } from '../image-cropper/image-cropper.component';

@Component({
  selector: 'app-photo-upload',
  imports: [ImageCropperComponent],
  templateUrl: './photo-upload.component.html',
  styleUrl: './photo-upload.component.css'
})
export class PhotoUploadComponent {
  private userService = inject(UserService);

  readonly userId = input.required<number>();
  readonly photoUrl = input<string | null | undefined>(null);
  readonly initials = input('');
  readonly uploaded = output<string>();

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  readonly uploading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly cropSrc = signal<string | null>(null);
  readonly cropOpen = signal(false);

  triggerSelect(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.errorMessage.set(null);
    this.cropSrc.set(URL.createObjectURL(file));
    this.cropOpen.set(true);
  }

  onCropped(blob: Blob): void {
    this.closeCropper();
    const file = new File([blob], 'photo.png', { type: blob.type });

    this.uploading.set(true);
    this.userService.uploadPhoto(this.userId(), file).subscribe({
      next: res => {
        this.uploading.set(false);
        this.uploaded.emit(res.url);
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.errorMessage.set(err.status === 403 ? 'No tienes permiso para actualizar esta foto.' : 'No se pudo subir la foto.');
      }
    });
  }

  onCropCancelled(): void {
    this.closeCropper();
  }

  private closeCropper(): void {
    this.cropOpen.set(false);
    const url = this.cropSrc();
    if (url) URL.revokeObjectURL(url);
    this.cropSrc.set(null);
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
  }
}
