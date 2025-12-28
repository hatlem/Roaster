// Database Seeding Script
// Populates database with sample data for development/testing

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create organization
  const org = await prisma.organization.upsert({
    where: { orgNumber: '123456789' },
    update: {},
    create: {
      name: 'Example AS',
      orgNumber: '123456789',
      contactEmail: 'contact@example.no',
      contactPhone: '+47 12345678',
      address: 'Oslo, Norway',
    },
  });
  console.log('✅ Organization created');

  // Create users
  const passwordHash = await bcrypt.hash('Password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.no' },
    update: {},
    create: {
      email: 'admin@example.no',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      employeeNumber: 'ADM001',
      department: 'Management',
      position: 'System Administrator',
    },
  });
  console.log('✅ Admin user created (admin@example.no / Password123)');

  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.no' },
    update: {},
    create: {
      email: 'manager@example.no',
      passwordHash,
      firstName: 'Manager',
      lastName: 'Person',
      role: UserRole.MANAGER,
      employeeNumber: 'MGR001',
      department: 'Operations',
      position: 'Operations Manager',
    },
  });
  console.log('✅ Manager user created (manager@example.no / Password123)');

  const representative = await prisma.user.upsert({
    where: { email: 'rep@example.no' },
    update: {},
    create: {
      email: 'rep@example.no',
      passwordHash,
      firstName: 'Representative',
      lastName: 'Employee',
      role: UserRole.REPRESENTATIVE,
      employeeNumber: 'REP001',
      department: 'Operations',
      position: 'Employee Representative',
    },
  });
  console.log('✅ Representative user created (rep@example.no / Password123)');

  // Create sample employees
  const employees = [];
  for (let i = 1; i <= 5; i++) {
    const employee = await prisma.user.upsert({
      where: { email: `employee${i}@example.no` },
      update: {},
      create: {
        email: `employee${i}@example.no`,
        passwordHash,
        firstName: `Employee`,
        lastName: `${i}`,
        role: UserRole.EMPLOYEE,
        employeeNumber: `EMP00${i}`,
        department: 'Operations',
        position: 'Staff',
      },
    });
    employees.push(employee);
  }
  console.log(`✅ ${employees.length} employees created`);

  // Create sample roster
  const roster = await prisma.roster.create({
    data: {
      organizationId: org.id,
      name: 'Sample February 2024 Roster',
      startDate: new Date('2024-02-01T00:00:00Z'),
      endDate: new Date('2024-02-29T23:59:59Z'),
      status: 'DRAFT',
      createdBy: manager.id,
    },
  });
  console.log('✅ Sample roster created');

  // Create sample shifts
  for (let day = 1; day <= 5; day++) {
    for (const employee of employees.slice(0, 3)) {
      await prisma.shift.create({
        data: {
          rosterId: roster.id,
          userId: employee.id,
          startTime: new Date(`2024-02-0${day}T08:00:00Z`),
          endTime: new Date(`2024-02-0${day}T16:00:00Z`),
          breakMinutes: 30,
          department: 'Operations',
          location: 'Oslo Office',
        },
      });
    }
  }
  console.log('✅ Sample shifts created');

  // Create sample preferences
  for (const employee of employees) {
    await prisma.employeePreference.create({
      data: {
        userId: employee.id,
        preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        avoidDays: ['Sunday'],
        preferMorning: Math.random() > 0.5,
        preferEvening: false,
        preferNight: false,
        maxHoursPerWeek: 40,
      },
    });
  }
  console.log('✅ Employee preferences created');

  console.log('');
  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('Test credentials:');
  console.log('  Admin:          admin@example.no / Password123');
  console.log('  Manager:        manager@example.no / Password123');
  console.log('  Representative: rep@example.no / Password123');
  console.log('  Employee 1:     employee1@example.no / Password123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
