import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';
import { DocumentType, StudentDocument } from '../../../models';
import { AppDatePipe } from '../../../shared/pipes/format.pipes';
import { EmptyState } from '../../../shared/ui/empty-state';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { ToastService } from '../../../shared/ui/toast.service';
import { StudentsService } from '../data-access/students.service';

@Component({
  selector: 'app-student-documents',
  imports: [LucideDynamicIcon, StatusBadge, EmptyState, AppDatePipe],
  host: { class: 'block space-y-4' },
  template: `
    <label
      class="flex cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-white px-6 py-8 text-center transition-colors hover:border-neutral-500 hover:bg-neutral-50"
      [class.!border-neutral-950]="dragging()"
      (dragover)="$event.preventDefault(); dragging.set(true)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
    >
      <span class="grid size-10 place-items-center rounded-full bg-neutral-100">
        <svg
          [lucideIcon]="uploading() ? 'loader-circle' : 'upload'"
          size="18"
          [class.animate-spin]="uploading()"
        />
      </span>
      <span class="mt-3 text-sm font-medium">{{
        uploading() ? 'Uploading…' : 'Upload a document'
      }}</span>
      <span class="mt-1 text-xs text-muted"
        >Drag & drop or click · PDF, JPG or PNG up to 5 MB (stored locally in this demo)</span
      >
      <input
        type="file"
        class="sr-only"
        accept=".pdf,.jpg,.jpeg,.png"
        (change)="onPick($event)"
        [disabled]="uploading()"
      />
    </label>

    <div class="card overflow-hidden">
      @if (docs.error()) {
        <app-empty-state
          variant="error"
          title="Couldn't load documents"
          actionLabel="Retry"
          (action)="docs.reload()"
        />
      } @else {
        <ul class="divide-y divide-neutral-100">
          @for (d of docs.value(); track d.id) {
            <li class="flex items-center gap-4 px-5 py-3.5">
              <span
                class="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-muted"
              >
                <svg [lucideIcon]="d.fileName.endsWith('.pdf') ? 'file-text' : 'image'" size="16" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-medium">{{ d.name }}</p>
                <p class="truncate text-xs text-muted">
                  {{ d.fileName }} · {{ size(d.sizeKb) }} · {{ d.type }} · uploaded
                  {{ d.uploadedOn | appDate }}
                </p>
              </div>
              <app-status-badge [status]="d.verified ? 'Verified' : 'Pending'" />
              <button
                type="button"
                class="btn btn-ghost btn-icon btn-sm"
                [attr.aria-label]="'Download ' + d.name"
                (click)="download(d)"
              >
                <svg lucideIcon="download" size="15" />
              </button>
            </li>
          } @empty {
            <li>
              <app-empty-state
                icon="folder-open"
                title="No documents yet"
                message="Upload ID proof, certificates and the signed admission agreement."
              />
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class StudentDocuments {
  private readonly service = inject(StudentsService);
  private readonly toast = inject(ToastService);
  readonly studentId = input.required<string>();

  protected readonly dragging = signal(false);
  protected readonly uploading = signal(false);
  protected readonly docs = rxResource({
    params: () => this.studentId(),
    stream: ({ params }) => this.service.getDocuments(params),
    defaultValue: [],
  });

  protected size(kb: number): string {
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
  }

  protected onPick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.upload(file);
    (event.target as HTMLInputElement).value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.upload(file);
  }

  private upload(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('File too large', 'Maximum size is 5 MB.');
      return;
    }
    const type: DocumentType = file.type.startsWith('image/') ? 'Photo' : 'Other';
    this.uploading.set(true);
    this.service
      .uploadDocument(
        this.studentId(),
        file.name.replace(/\.[^.]+$/, ''),
        type,
        file.name,
        Math.max(1, Math.round(file.size / 1024)),
      )
      .subscribe(() => {
        this.uploading.set(false);
        this.toast.success('Document uploaded', file.name);
        this.docs.reload();
      });
  }

  protected download(d: StudentDocument): void {
    this.toast.info('Download will be available with the backend', d.fileName);
  }
}
