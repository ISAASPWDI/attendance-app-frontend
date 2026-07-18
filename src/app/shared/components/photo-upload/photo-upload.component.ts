import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-photo-upload',
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

  triggerSelect(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    this.userService.uploadPhoto(this.userId(), file).subscribe({
      next: res => {
        this.uploading.set(false);
        this.uploaded.emit(res.url);
        input.value = '';
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        input.value = '';
        this.errorMessage.set(err.status === 403 ? 'No tienes permiso para actualizar esta foto.' : 'No se pudo subir la foto.');
      }
    });
  }
}
