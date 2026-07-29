import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { PhotoUploadComponent } from '../../../shared/components/photo-upload/photo-upload.component';
import { SignatureUploadComponent } from '../../../shared/components/signature-upload/signature-upload.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-teacher-profile',
  imports: [PhotoUploadComponent, SignatureUploadComponent, ConfirmDialogComponent, ReactiveFormsModule],
  templateUrl: './teacher-profile.component.html',
  styleUrl: './teacher-profile.component.css'
})
export class TeacherProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly user = this.auth.currentUser;
  readonly initials = computed(() => {
    const u = this.user();
    return u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() : '';
  });

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly confirmingDelete = signal(false);
  readonly deleting = signal(false);

  readonly editForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required]
  });

  ngOnInit(): void {
    const u = this.user();
    if (u) this.editForm.setValue({ firstName: u.firstName ?? '', lastName: u.lastName ?? '' });
  }

  startEdit(): void {
    const u = this.user();
    if (u) this.editForm.setValue({ firstName: u.firstName ?? '', lastName: u.lastName ?? '' });
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  submitEdit(): void {
    const u = this.user();
    if (!u || this.editForm.invalid || this.saving()) return;
    const raw = this.editForm.getRawValue();

    this.saving.set(true);
    this.userService.update(u.id, { firstName: raw.firstName, lastName: raw.lastName }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.auth.setUser({ ...u, firstName: raw.firstName, lastName: raw.lastName });
        this.toast.show('Perfil actualizado.', 'success');
      },
      error: () => this.saving.set(false)
    });
  }

  deleteAccount(): void {
    const u = this.user();
    if (!u || this.deleting()) return;

    this.deleting.set(true);
    this.userService.delete(u.id).subscribe({
      next: () => {
        this.confirmingDelete.set(false);
        this.auth.logout();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.deleting.set(false);
        this.confirmingDelete.set(false);
      }
    });
  }

  onPhotoUploaded(url: string): void {
    const u = this.user();
    if (u) this.auth.setUser({ ...u, photoUrl: url });
  }
}
