import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('¿Confirmar acción?');
  readonly message = input('Esta acción no se puede deshacer.');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly danger = input(true);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
