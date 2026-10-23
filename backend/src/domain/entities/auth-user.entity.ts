/** Signed-in user returned by `POST /auth/login` and `GET /auth/me`. */
export interface AuthUser {
  userId: string;
  name: string;
  email: string | null;
  /** Role codes, e.g. `ADMIN`, `STUDENT`. */
  roles: string[];
  /** Permission codes granted through the user's roles. */
  permissions: string[];
  /** `Employee.id` for staff users. */
  employeeId: string | null;
  /** `Student.id` for student users. */
  studentId: string | null;
}
