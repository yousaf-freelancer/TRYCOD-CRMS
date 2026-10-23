/** Signed-in user as returned by `POST /auth/login` and `GET /auth/me`. */
export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  /** Role codes, e.g. `ADMIN`, `MENTOR`, `STUDENT`. */
  roles: string[];
  /** Permission codes, e.g. `students.view`, `fees.collect`. */
  permissions: string[];
  /** Set for staff users. */
  employeeId: string | null;
  /** Set for student users. */
  studentId: string | null;
}

export interface LoginCredentials {
  /** Email or phone number. */
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
