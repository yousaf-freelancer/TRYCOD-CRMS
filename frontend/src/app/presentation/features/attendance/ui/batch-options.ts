import { computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/auth/auth.service';
import { CoursesService } from '../../../../data/services/courses.service';

/** Ongoing batches visible to the current user (mentors see only their own). */
export function ongoingBatchOptions() {
  const auth = inject(AuthService);
  const courses = inject(CoursesService);
  const batches = rxResource({
    params: () => ({
      status: 'Ongoing' as const,
      mentorId: auth.role() === 'Mentor' ? (auth.user()?.employeeId ?? null) : null,
    }),
    stream: ({ params }) => courses.getBatches(params),
    defaultValue: [],
  });
  const options = computed(() =>
    (batches.hasValue() ? batches.value() : []).map((b) => ({
      label: `${b.code} · ${b.courseName}`,
      value: b.id,
      timing: b.timing,
      mentor: b.mentorName,
    })),
  );
  return { batches, options };
}
