import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/data/prisma/generated/client';

/**
 * Idempotent seed: permissions, system roles (with their permission matrix),
 * the real admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD, and one test
 * user per role for development.
 *
 * Run: `npx prisma db seed`
 * Skip test users: SEED_TEST_USERS=false
 * Test user password: SEED_TEST_PASSWORD (default `Test@1234`)
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
});

type RoleCode = 'ADMIN' | 'ADVISOR' | 'MENTOR' | 'SALES' | 'STUDENT';

const ROLES: Record<RoleCode, { name: string; description: string }> = {
  ADMIN: { name: 'Admin', description: 'Full access to the institute.' },
  ADVISOR: { name: 'Advisor', description: 'Academic advisor: admissions, students and fees.' },
  MENTOR: { name: 'Mentor', description: 'Mentor: batches, attendance and weekly reports.' },
  SALES: { name: 'Sales', description: 'Sales: leads, follow-ups and calls.' },
  STUDENT: { name: 'Student', description: 'Student portal access.' },
};

const STAFF: RoleCode[] = ['ADMIN', 'ADVISOR', 'MENTOR', 'SALES'];

/** Permission code → module, description and the roles that hold it. */
const PERMISSIONS: { code: string; module: string; description: string; roles: RoleCode[] }[] = [
  { code: 'dashboard.view', module: 'dashboard', description: 'View the staff dashboard', roles: STAFF },
  { code: 'admissions.view', module: 'admissions', description: 'Leads, enquiries, follow-ups and admissions', roles: ['ADMIN', 'ADVISOR', 'SALES'] },
  { code: 'calls.view', module: 'calls', description: 'View sales call logs', roles: ['ADMIN', 'SALES'] },
  { code: 'students.view', module: 'students', description: 'View students', roles: ['ADMIN', 'ADVISOR', 'MENTOR'] },
  { code: 'courses.view', module: 'courses', description: 'View courses and batches', roles: ['ADMIN', 'ADVISOR', 'MENTOR'] },
  { code: 'courses.manage', module: 'courses', description: 'Create and edit courses', roles: ['ADMIN'] },
  { code: 'attendance.student.mark', module: 'attendance', description: 'Mark student attendance', roles: ['ADMIN', 'MENTOR'] },
  { code: 'attendance.staff.manage', module: 'attendance', description: 'Manage staff attendance', roles: ['ADMIN'] },
  { code: 'mentor_reports.view', module: 'mentor_reports', description: 'View and write mentor reports', roles: ['ADMIN', 'MENTOR'] },
  { code: 'fees.view', module: 'fees', description: 'View fees and payments', roles: ['ADMIN', 'ADVISOR'] },
  { code: 'fees.collect', module: 'fees', description: 'Collect fee payments', roles: ['ADMIN', 'ADVISOR'] },
  { code: 'hr.view', module: 'hr', description: 'Employees and leave', roles: ['ADMIN'] },
  { code: 'payroll.manage', module: 'hr', description: 'Process payroll', roles: ['ADMIN'] },
  { code: 'reports.view', module: 'reports', description: 'View reports', roles: ['ADMIN'] },
  { code: 'settings.manage', module: 'settings', description: 'Manage institute settings', roles: ['ADMIN'] },
  { code: 'users.manage', module: 'settings', description: 'Manage users, roles and permissions', roles: ['ADMIN'] },
  { code: 'self.access', module: 'self_service', description: 'Own attendance, leave and payslips', roles: STAFF },
  { code: 'portal.access', module: 'portal', description: 'Student portal', roles: ['STUDENT'] },
];

interface SeedUser {
  role: RoleCode;
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  code: string;
  /** Re-hash the password on every run (test users); false keeps a changed password. */
  resetPassword: boolean;
}

async function seedPermissionsAndRoles(): Promise<Map<RoleCode, string>> {
  const permissionIds = new Map<string, string>();
  for (const p of PERMISSIONS) {
    const row = await prisma.permission.upsert({
      where: { code: p.code },
      update: { module: p.module, description: p.description },
      create: { code: p.code, module: p.module, description: p.description },
    });
    permissionIds.set(p.code, row.id);
  }

  const roleIds = new Map<RoleCode, string>();
  for (const [code, meta] of Object.entries(ROLES) as [RoleCode, (typeof ROLES)[RoleCode]][]) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name: meta.name, description: meta.description, isSystem: true },
      create: { code, name: meta.name, description: meta.description, isSystem: true },
    });
    roleIds.set(code, role.id);

    // Keep the system role's permissions in sync with the matrix above.
    const granted = PERMISSIONS.filter((p) => p.roles.includes(code)).map(
      (p) => permissionIds.get(p.code)!,
    );
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: granted.map((permissionId) => ({ roleId: role.id, permissionId })),
      }),
    ]);
  }
  return roleIds;
}

async function seedUser(u: SeedUser, roleIds: Map<RoleCode, string>): Promise<void> {
  const passwordHash = await bcrypt.hash(u.password, 10);
  const user = await prisma.user.upsert({
    where: { email: u.email },
    update: u.resetPassword ? { passwordHash, status: 'ACTIVE' } : {},
    create: { email: u.email, phone: u.phone, passwordHash, status: 'ACTIVE' },
  });

  const roleId = roleIds.get(u.role)!;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId } },
    update: {},
    create: { userId: user.id, roleId },
  });

  const person = {
    userId: user.id,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    email: u.email,
  };
  if (u.role === 'STUDENT') {
    await prisma.student.upsert({
      where: { admissionNo: u.code },
      update: person,
      create: { ...person, admissionNo: u.code },
    });
  } else {
    await prisma.employee.upsert({
      where: { employeeCode: u.code },
      update: person,
      create: { ...person, employeeCode: u.code, joiningDate: new Date() },
    });
  }
  console.log(`  ${u.role.padEnd(8)} ${u.email}`);
}

function testUsers(password: string): SeedUser[] {
  const base = (role: RoleCode, n: number, firstName: string, code: string): SeedUser => ({
    role,
    email: `${role.toLowerCase()}@trycod.test`,
    phone: `900000000${n}`,
    password,
    firstName,
    lastName: 'Test',
    code,
    resetPassword: true,
  });
  return [
    base('ADMIN', 1, 'Admin', 'EMP-T001'),
    base('ADVISOR', 2, 'Advisor', 'EMP-T002'),
    base('MENTOR', 3, 'Mentor', 'EMP-T003'),
    base('SALES', 4, 'Sales', 'EMP-T004'),
    base('STUDENT', 5, 'Student', 'STU-T001'),
  ];
}

async function main(): Promise<void> {
  console.log('Seeding permissions and roles…');
  const roleIds = await seedPermissionsAndRoles();

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  console.log('Seeding users…');
  if (adminEmail && adminPassword) {
    await seedUser(
      {
        role: 'ADMIN',
        email: adminEmail.trim().toLowerCase(),
        phone: '9000000000',
        password: adminPassword,
        firstName: 'Administrator',
        lastName: '',
        code: 'EMP-0001',
        resetPassword: false,
      },
      roleIds,
    );
  } else {
    console.warn('  SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping the main admin.');
  }

  if (process.env.SEED_TEST_USERS !== 'false') {
    const password = process.env.SEED_TEST_PASSWORD ?? 'Test@1234';
    for (const u of testUsers(password)) await seedUser(u, roleIds);
  }
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
