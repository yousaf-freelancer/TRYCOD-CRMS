/**
 * TEMPORARY: test logins created by `backend/prisma/seed.ts`.
 * Delete this file and the "Test accounts" block in login.page.ts before release.
 */
export interface TestAccount {
  label: string;
  icon: string;
  identifier: string;
  password: string;
}

const PASSWORD = 'Test@1234';

export const TEST_ACCOUNTS: TestAccount[] = [
  { label: 'Admin', icon: 'shield-check', identifier: 'admin@trycod.test', password: PASSWORD },
  {
    label: 'Advisor',
    icon: 'messages-square',
    identifier: 'advisor@trycod.test',
    password: PASSWORD,
  },
  { label: 'Mentor', icon: 'presentation', identifier: 'mentor@trycod.test', password: PASSWORD },
  { label: 'Sales', icon: 'phone-call', identifier: 'sales@trycod.test', password: PASSWORD },
  {
    label: 'Student',
    icon: 'graduation-cap',
    identifier: 'student@trycod.test',
    password: PASSWORD,
  },
];
