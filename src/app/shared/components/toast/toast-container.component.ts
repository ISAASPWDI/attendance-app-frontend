import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html'
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
