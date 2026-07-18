import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { UserDetail, UserRole } from '../../../core/models/user.model';
import { Page } from '../../../core/models/api.model';
import { PhotoUploadComponent } from '../../../shared/components/photo-upload/photo-upload.component';
import { SignatureUploadComponent } from '../../../shared/components/signature-upload/signature-upload.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const DEFAULT_PAGE_SIZE = 10;

interface EditDraft {
  firstName: string;
  lastName: string;
  role: UserRole;
}

@Component({
  selector: 'app-director-profile',
  imports: [FormsModule, ReactiveFormsModule, PhotoUploadComponent, SignatureUploadComponent, ConfirmDialogComponent],
  templateUrl: './director-profile.component.html',
  styleUrl: './director-profile.component.css'
})
export class DirectorProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private searchChanged = new Subject<void>();

  readonly user = this.auth.currentUser;
  readonly initials = computed(() => {
    const u = this.user();
    return u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() : '';
  });

  readonly search = signal('');
  readonly page = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly usersPage = signal<Page<UserDetail> | null>(null);
  readonly loading = signal(true);

  readonly editingUserId = signal<number | null>(null);
  readonly editDraft = signal<EditDraft>({ firstName: '', lastName: '', role: 'TEACHER' });
  readonly savingEdit = signal(false);

  readonly showCreateForm = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly createSuccess = signal<string | null>(null);

  readonly userPendingDelete = signal<UserDetail | null>(null);

  readonly createForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: [''],
    lastName: [''],
    role: ['TEACHER' as UserRole, Validators.required]
  });

  ngOnInit(): void {
    this.loadUsers();
    this.searchChanged.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page.set(0);
      this.loadUsers();
    });
  }

  onSearchChange(): void {
    this.searchChanged.next();
  }

  onSelfPhotoUploaded(url: string): void {
    const u = this.user();
    if (u) this.auth.setUser({ ...u, photoUrl: url });
  }

  onUserPhotoUploaded(userId: number, url: string): void {
    const current = this.usersPage();
    if (!current) return;
    this.usersPage.set({
      ...current,
      content: current.content.map(u => (u.id === userId ? { ...u, photoUrl: url } : u))
    });
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(0);
    this.loadUsers();
  }

  goToPage(next: number): void {
    const total = this.usersPage()?.totalPages ?? 0;
    if (next < 0 || next >= total) return;
    this.page.set(next);
    this.loadUsers();
  }

  userInitials(user: UserDetail): string {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }

  isSelf(u: UserDetail): boolean {
    return u.id === this.user()?.id;
  }

  startEdit(u: UserDetail): void {
    this.editingUserId.set(u.id);
    this.editDraft.set({ firstName: u.firstName ?? '', lastName: u.lastName ?? '', role: u.role });
  }

  cancelEdit(): void {
    this.editingUserId.set(null);
  }

  saveEdit(userId: number): void {
    if (this.savingEdit()) return;
    this.savingEdit.set(true);
    const draft = this.editDraft();

    this.userService.update(userId, draft).subscribe({
      next: updated => {
        this.savingEdit.set(false);
        this.editingUserId.set(null);
        const current = this.usersPage();
        if (!current) return;
        this.usersPage.set({
          ...current,
          content: current.content.map(u => (u.id === userId ? { ...u, ...updated } : u))
        });
      },
      error: () => this.savingEdit.set(false)
    });
  }

  requestDelete(u: UserDetail): void {
    if (this.isSelf(u)) return;
    this.userPendingDelete.set(u);
  }

  cancelDelete(): void {
    this.userPendingDelete.set(null);
  }

  confirmDelete(): void {
    const u = this.userPendingDelete();
    if (!u) return;

    this.userService.delete(u.id).subscribe({
      next: () => {
        this.userPendingDelete.set(null);
        const current = this.usersPage();
        if (!current) return;
        this.usersPage.set({
          ...current,
          content: current.content.filter(x => x.id !== u.id),
          totalElements: current.totalElements - 1
        });
      },
      error: () => this.userPendingDelete.set(null)
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
    this.createError.set(null);
    this.createSuccess.set(null);
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.creating()) return;
    this.creating.set(true);
    this.createError.set(null);
    this.createSuccess.set(null);
    const { username } = this.createForm.getRawValue();

    this.auth.register(this.createForm.getRawValue()).subscribe({
      next: () => {
        this.creating.set(false);
        this.createForm.reset({ role: 'TEACHER' });
        this.createSuccess.set(
          `Se envió un código de verificación al correo de "${username}". Debe verificarlo antes de poder iniciar sesión.`
        );
      },
      error: (err: HttpErrorResponse) => {
        this.creating.set(false);
        this.createError.set(err.error?.message ?? 'No se pudo crear el usuario.');
      }
    });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.userService.list(this.search() || undefined, this.page(), this.pageSize()).subscribe({
      next: page => {
        this.usersPage.set(page);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
