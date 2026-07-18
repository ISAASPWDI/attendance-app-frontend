import { Component, computed, input } from '@angular/core';

export type StatTone = 'primary' | 'success' | 'warning' | 'danger';

const TONE_CLASSES: Record<StatTone, string> = {
  primary: 'bg-red-100 text-red-600',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700'
};

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css'
})
export class StatCardComponent {
  readonly icon = input.required<string>();
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  readonly tone = input<StatTone>('primary');

  readonly iconClasses = computed(() => TONE_CLASSES[this.tone()]);
}
