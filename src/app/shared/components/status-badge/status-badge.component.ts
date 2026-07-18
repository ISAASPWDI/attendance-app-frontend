import { Component, computed, input } from '@angular/core';
import { AttendanceStatus } from '../../../core/models/attendance.model';

const TONE_CLASSES: Record<AttendanceStatus, string> = {
  Present: 'bg-green-100 text-green-800',
  Late: 'bg-yellow-100 text-yellow-800',
  Absent: 'bg-red-100 text-red-800'
};

const LABELS: Record<AttendanceStatus, string> = {
  Present: 'Presente',
  Late: 'Tarde',
  Absent: 'Ausente'
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="toneClass()">{{ label() }}</span>`
})
export class StatusBadgeComponent {
  readonly status = input.required<AttendanceStatus>();
  readonly toneClass = computed(() => TONE_CLASSES[this.status()]);
  readonly label = computed(() => LABELS[this.status()]);
}
