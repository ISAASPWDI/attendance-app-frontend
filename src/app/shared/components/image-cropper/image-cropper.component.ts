import { Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';

const VIEWPORT_WIDTH = 280;
const EXPORT_WIDTH = 480;

@Component({
  selector: 'app-image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrl: './image-cropper.component.css'
})
export class ImageCropperComponent {
  readonly open = input(false);
  readonly imageSrc = input<string | null>(null);
  readonly aspectRatio = input(1);
  readonly rounded = input(false);
  readonly title = input('Ajustar imagen');

  readonly cropped = output<Blob>();
  readonly cancelled = output<void>();

  readonly sourceImage = viewChild<ElementRef<HTMLImageElement>>('sourceImage');

  readonly zoom = signal(1);
  readonly posX = signal(0);
  readonly posY = signal(0);
  private naturalWidth = signal(0);
  private naturalHeight = signal(0);
  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  readonly viewportWidth = VIEWPORT_WIDTH;
  readonly viewportHeight = computed(() => VIEWPORT_WIDTH / this.aspectRatio());

  private baseScale = computed(() => {
    const nw = this.naturalWidth();
    const nh = this.naturalHeight();
    if (!nw || !nh) return 0;
    return Math.max(this.viewportWidth / nw, this.viewportHeight() / nh);
  });

  readonly displayWidth = computed(() => this.naturalWidth() * this.baseScale() * this.zoom());
  readonly displayHeight = computed(() => this.naturalHeight() * this.baseScale() * this.zoom());

  onImageLoad(): void {
    const img = this.sourceImage()?.nativeElement;
    if (!img) return;
    this.naturalWidth.set(img.naturalWidth);
    this.naturalHeight.set(img.naturalHeight);
    this.zoom.set(1);
    this.posX.set((this.viewportWidth - this.displayWidth()) / 2);
    this.posY.set((this.viewportHeight() - this.displayHeight()) / 2);
  }

  onZoomChange(value: string): void {
    this.zoom.set(+value);
    this.clampPosition();
  }

  onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    const dx = event.clientX - this.lastPointerX;
    const dy = event.clientY - this.lastPointerY;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.posX.update(x => x + dx);
    this.posY.update(y => y + dy);
    this.clampPosition();
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  private clampPosition(): void {
    const minX = this.viewportWidth - this.displayWidth();
    const minY = this.viewportHeight() - this.displayHeight();
    this.posX.set(Math.min(0, Math.max(minX, this.posX())));
    this.posY.set(Math.min(0, Math.max(minY, this.posY())));
  }

  apply(): void {
    const img = this.sourceImage()?.nativeElement;
    if (!img) return;

    const totalScale = this.baseScale() * this.zoom();
    const sx = -this.posX() / totalScale;
    const sy = -this.posY() / totalScale;
    const sw = this.viewportWidth / totalScale;
    const sh = this.viewportHeight() / totalScale;

    const exportWidth = EXPORT_WIDTH;
    const exportHeight = EXPORT_WIDTH / this.aspectRatio();

    const canvas = document.createElement('canvas');
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, exportWidth, exportHeight);

    canvas.toBlob(blob => {
      if (blob) this.cropped.emit(blob);
    }, 'image/jpeg', 0.92);
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
