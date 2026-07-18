import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { PhotoUploadComponent } from '../../../shared/components/photo-upload/photo-upload.component';

@Component({
  selector: 'app-teacher-profile',
  imports: [PhotoUploadComponent],
  templateUrl: './teacher-profile.component.html',
  styleUrl: './teacher-profile.component.css'
})
export class TeacherProfileComponent {
  private auth = inject(AuthService);

  readonly user = this.auth.currentUser;
  readonly initials = computed(() => {
    const u = this.user();
    return u ? `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() : '';
  });

  onPhotoUploaded(url: string): void {
    const u = this.user();
    if (u) this.auth.setUser({ ...u, photoUrl: url });
  }
}
