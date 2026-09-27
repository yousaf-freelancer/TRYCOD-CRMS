import { AppUser, DemoAccount } from '../models';

/** Fictional demo credentials shown on the login page. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Admin', email: 'admin@trycod-demo.com', password: 'Admin@123' },
  { role: 'Advisor', email: 'advisor@trycod-demo.com', password: 'Advisor@123' },
  { role: 'Mentor', email: 'mentor@trycod-demo.com', password: 'Mentor@123' },
  { role: 'Sales', email: 'sales@trycod-demo.com', password: 'Sales@123' },
  { role: 'Student', email: 'student@trycod-demo.com', password: 'Student@123' },
];

export const DEMO_USERS: Record<string, AppUser> = {
  'admin@trycod-demo.com': {
    id: 'USR-1',
    name: 'Rahul Menon',
    email: 'admin@trycod-demo.com',
    role: 'Admin',
    title: 'Director',
    employeeId: 'EMP-001',
  },
  'advisor@trycod-demo.com': {
    id: 'USR-2',
    name: 'Anjali Nair',
    email: 'advisor@trycod-demo.com',
    role: 'Advisor',
    title: 'Senior Academic Advisor',
    employeeId: 'EMP-003',
  },
  'mentor@trycod-demo.com': {
    id: 'USR-3',
    name: 'Arjun Krishnan',
    email: 'mentor@trycod-demo.com',
    role: 'Mentor',
    title: 'Lead Mentor – Full Stack',
    employeeId: 'EMP-006',
  },
  'sales@trycod-demo.com': {
    id: 'USR-4',
    name: 'Aswathy Suresh',
    email: 'sales@trycod-demo.com',
    role: 'Sales',
    title: 'Sales Lead',
    employeeId: 'EMP-013',
  },
  'student@trycod-demo.com': {
    id: 'USR-5',
    name: 'Adithya Raj',
    email: 'student@trycod-demo.com',
    role: 'Student',
    title: 'Student · Full Stack Development',
    studentId: 'STU-1001',
  },
};
