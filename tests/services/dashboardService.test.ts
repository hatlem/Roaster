// Unit tests for Dashboard Service
// Tests metrics, analytics, and reporting functionality

import { DashboardService } from '../../src/services/dashboardService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    roster: {
      findMany: jest.fn(),
    },
    actualHours: {
      findMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock compliance config
jest.mock('../../src/config/compliance', () => ({
  getComplianceConfig: jest.fn(() => ({
    maxDailyHours: 9,
    maxWeeklyHours: 40,
    minDailyRest: 11,
    minWeeklyRest: 35,
    publishDeadlineDays: 14,
    maxOvertimePerWeek: 10,
    maxOvertimePer4Weeks: 25,
    maxOvertimePerYear: 200,
  })),
}));

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService();
    mockPrisma = new PrismaClient();
  });

  describe('getDashboardMetrics', () => {
    it('should return comprehensive dashboard metrics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const mockRosters = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07'),
          isLatePublication: false,
          shifts: [
            {
              id: 'shift-1',
              userId: 'user-1',
              startTime: new Date('2024-01-01T08:00:00Z'),
              endTime: new Date('2024-01-01T16:00:00Z'),
              breakMinutes: 30,
              violatesRestPeriod: false,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {
                id: 'user-1',
              },
            },
            {
              id: 'shift-2',
              userId: 'user-1',
              startTime: new Date('2024-01-02T08:00:00Z'),
              endTime: new Date('2024-01-02T16:00:00Z'),
              breakMinutes: 30,
              violatesRestPeriod: false,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {
                id: 'user-1',
              },
            },
          ],
        },
      ];

      const mockActualHours = [
        {
          id: 'actual-1',
          userId: 'user-1',
          date: new Date('2024-01-01'),
          totalHours: 7.5,
          overtimeHours: 0,
        },
        {
          id: 'actual-2',
          userId: 'user-1',
          date: new Date('2024-01-02'),
          totalHours: 7.5,
          overtimeHours: 0,
        },
      ];

      mockPrisma.roster.findMany.mockResolvedValue(mockRosters);
      mockPrisma.actualHours.findMany.mockResolvedValue(mockActualHours);

      const result = await service.getDashboardMetrics('org-1', startDate, endDate);

      expect(result).toHaveProperty('period');
      expect(result.period.start).toEqual(startDate);
      expect(result.period.end).toEqual(endDate);
      expect(result).toHaveProperty('labor');
      expect(result).toHaveProperty('compliance');
      expect(result).toHaveProperty('attendance');
      expect(result).toHaveProperty('overtime');
    });

    it('should calculate labor metrics correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const mockRosters = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate,
          endDate,
          shifts: [
            {
              id: 'shift-1',
              userId: 'user-1',
              startTime: new Date('2024-01-01T08:00:00Z'),
              endTime: new Date('2024-01-01T17:00:00Z'),
              breakMinutes: 60,
              user: {},
            },
          ],
        },
      ];

      const mockActualHours = [
        {
          userId: 'user-1',
          date: new Date('2024-01-01'),
          totalHours: 8,
          overtimeHours: 0,
        },
      ];

      mockPrisma.roster.findMany.mockResolvedValue(mockRosters);
      mockPrisma.actualHours.findMany.mockResolvedValue(mockActualHours);

      const result = await service.getDashboardMetrics('org-1', startDate, endDate);

      expect(result.labor).toHaveProperty('budgetedHours');
      expect(result.labor).toHaveProperty('scheduledHours');
      expect(result.labor).toHaveProperty('actualHours');
      expect(result.labor).toHaveProperty('budgetedCost');
      expect(result.labor).toHaveProperty('scheduledCost');
      expect(result.labor).toHaveProperty('actualCost');
      expect(result.labor).toHaveProperty('variance');
      expect(result.labor).toHaveProperty('variancePercentage');
      expect(result.labor.actualHours).toBe(8);
    });

    it('should calculate compliance rate correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const mockRosters = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate,
          endDate,
          isLatePublication: false,
          shifts: [
            {
              id: 'shift-1',
              violatesRestPeriod: false,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {},
            },
            {
              id: 'shift-2',
              violatesRestPeriod: true,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {},
            },
            {
              id: 'shift-3',
              violatesRestPeriod: false,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {},
            },
          ],
        },
      ];

      mockPrisma.roster.findMany.mockResolvedValue(mockRosters);
      mockPrisma.actualHours.findMany.mockResolvedValue([]);

      const result = await service.getDashboardMetrics('org-1', startDate, endDate);

      expect(result.compliance.totalShifts).toBe(3);
      expect(result.compliance.compliantShifts).toBe(2);
      expect(result.compliance.shiftsWithViolations).toBe(1);
      expect(result.compliance.complianceRate).toBeCloseTo(66.7, 1);
    });

    it('should track late publications', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockRosters = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate,
          endDate: new Date('2024-01-07'),
          isLatePublication: true,
          shifts: [],
        },
        {
          id: 'roster-2',
          organizationId: 'org-1',
          startDate: new Date('2024-01-08'),
          endDate: new Date('2024-01-14'),
          isLatePublication: false,
          shifts: [],
        },
        {
          id: 'roster-3',
          organizationId: 'org-1',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-21'),
          isLatePublication: true,
          shifts: [],
        },
      ];

      mockPrisma.roster.findMany.mockResolvedValue(mockRosters);
      mockPrisma.actualHours.findMany.mockResolvedValue([]);

      const result = await service.getDashboardMetrics('org-1', startDate, endDate);

      expect(result.compliance.latePublications).toBe(2);
    });

    it('should calculate attendance rate', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const mockRosters = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate,
          endDate,
          shifts: [
            { id: 'shift-1', user: {} },
            { id: 'shift-2', user: {} },
            { id: 'shift-3', user: {} },
            { id: 'shift-4', user: {} },
            { id: 'shift-5', user: {} },
          ],
        },
      ];

      const mockActualHours = [
        { userId: 'user-1', date: new Date('2024-01-01'), totalHours: 8, overtimeHours: 0 },
        { userId: 'user-1', date: new Date('2024-01-02'), totalHours: 8, overtimeHours: 0 },
        { userId: 'user-1', date: new Date('2024-01-03'), totalHours: 8, overtimeHours: 0 },
        { userId: 'user-1', date: new Date('2024-01-04'), totalHours: 8, overtimeHours: 0 },
      ];

      mockPrisma.roster.findMany.mockResolvedValue(mockRosters);
      mockPrisma.actualHours.findMany.mockResolvedValue(mockActualHours);

      const result = await service.getDashboardMetrics('org-1', startDate, endDate);

      expect(result.attendance.totalShifts).toBe(5);
      expect(result.attendance.completedShifts).toBe(4);
      expect(result.attendance.missedShifts).toBe(1);
      expect(result.attendance.attendanceRate).toBe(80);
    });

    it('should calculate overtime metrics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const mockActualHours = [
        {
          userId: 'user-1',
          date: new Date('2024-01-01'),
          totalHours: 10,
          overtimeHours: 1,
        },
        {
          userId: 'user-1',
          date: new Date('2024-01-02'),
          totalHours: 11,
          overtimeHours: 2,
        },
        {
          userId: 'user-2',
          date: new Date('2024-01-01'),
          totalHours: 9.5,
          overtimeHours: 0.5,
        },
      ];

      mockPrisma.roster.findMany.mockResolvedValue([]);
      mockPrisma.actualHours.findMany.mockResolvedValue(mockActualHours);

      const result = await service.getDashboardMetrics('org-1', startDate, endDate);

      expect(result.overtime.totalOvertimeHours).toBe(3.5);
      expect(result.overtime.employeesWithOvertime).toBe(2);
      expect(result.overtime.averageOvertimePerEmployee).toBeCloseTo(1.75, 1);
      // Overtime cost with 40% premium: 3.5 * 200 * 1.4 = 980
      expect(result.overtime.overtimeCost).toBe(980);
    });
  });

  describe('getWeeklyComparison', () => {
    it('should compare this week vs last week', async () => {
      const targetDate = new Date('2024-01-15'); // Monday

      const mockRostersThisWeek = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-21'),
          isLatePublication: false,
          shifts: [
            {
              id: 'shift-1',
              userId: 'user-1',
              startTime: new Date('2024-01-15T08:00:00Z'),
              endTime: new Date('2024-01-15T16:00:00Z'),
              breakMinutes: 30,
              violatesRestPeriod: false,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {},
            },
          ],
        },
      ];

      const mockRostersLastWeek = [
        {
          id: 'roster-2',
          organizationId: 'org-1',
          startDate: new Date('2024-01-08'),
          endDate: new Date('2024-01-14'),
          isLatePublication: false,
          shifts: [
            {
              id: 'shift-2',
              userId: 'user-1',
              startTime: new Date('2024-01-08T08:00:00Z'),
              endTime: new Date('2024-01-08T16:00:00Z'),
              breakMinutes: 30,
              violatesRestPeriod: false,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {},
            },
          ],
        },
      ];

      mockPrisma.roster.findMany
        .mockResolvedValueOnce(mockRostersThisWeek)
        .mockResolvedValueOnce(mockRostersLastWeek);
      mockPrisma.actualHours.findMany.mockResolvedValue([]);

      const result = await service.getWeeklyComparison('org-1', targetDate);

      expect(result).toHaveProperty('thisWeek');
      expect(result).toHaveProperty('lastWeek');
      expect(result).toHaveProperty('changes');
      expect(result.changes).toHaveProperty('laborCost');
      expect(result.changes).toHaveProperty('complianceRate');
      expect(result.changes).toHaveProperty('attendanceRate');
      expect(result.changes).toHaveProperty('overtimeHours');
    });

    it('should calculate change deltas correctly', async () => {
      const targetDate = new Date('2024-01-15');

      const mockRosters = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-21'),
          isLatePublication: false,
          shifts: [],
        },
      ];

      const mockActualHoursThisWeek = [
        {
          userId: 'user-1',
          date: new Date('2024-01-15'),
          totalHours: 8,
          overtimeHours: 2,
        },
      ];

      const mockActualHoursLastWeek = [
        {
          userId: 'user-1',
          date: new Date('2024-01-08'),
          totalHours: 8,
          overtimeHours: 1,
        },
      ];

      mockPrisma.roster.findMany.mockResolvedValue(mockRosters);
      mockPrisma.actualHours.findMany
        .mockResolvedValueOnce(mockActualHoursThisWeek)
        .mockResolvedValueOnce(mockActualHoursLastWeek);

      const result = await service.getWeeklyComparison('org-1', targetDate);

      // Overtime increased from 1 to 2 hours
      expect(result.changes.overtimeHours).toBe(1);
    });

    it('should handle weeks with no data', async () => {
      const targetDate = new Date('2024-01-15');

      mockPrisma.roster.findMany.mockResolvedValue([]);
      mockPrisma.actualHours.findMany.mockResolvedValue([]);

      const result = await service.getWeeklyComparison('org-1', targetDate);

      expect(result.thisWeek.compliance.totalShifts).toBe(0);
      expect(result.lastWeek.compliance.totalShifts).toBe(0);
      expect(result.changes.laborCost).toBe(0);
    });
  });

  describe('Labor cost aggregation', () => {
    it('should aggregate labor costs across multiple rosters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockRosters = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07'),
          shifts: [
            {
              id: 'shift-1',
              userId: 'user-1',
              startTime: new Date('2024-01-01T08:00:00Z'),
              endTime: new Date('2024-01-01T16:00:00Z'),
              breakMinutes: 30,
              user: {},
            },
          ],
        },
        {
          id: 'roster-2',
          organizationId: 'org-1',
          startDate: new Date('2024-01-08'),
          endDate: new Date('2024-01-14'),
          shifts: [
            {
              id: 'shift-2',
              userId: 'user-1',
              startTime: new Date('2024-01-08T08:00:00Z'),
              endTime: new Date('2024-01-08T16:00:00Z'),
              breakMinutes: 30,
              user: {},
            },
          ],
        },
      ];

      mockPrisma.roster.findMany.mockResolvedValue(mockRosters);
      mockPrisma.actualHours.findMany.mockResolvedValue([]);

      const result = await service.getDashboardMetrics('org-1', startDate, endDate);

      expect(result.labor.scheduledHours).toBeGreaterThan(0);
      expect(result.labor.scheduledCost).toBeGreaterThan(0);
    });

    it('should calculate variance correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const mockRosters = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate,
          endDate,
          shifts: [
            {
              id: 'shift-1',
              userId: 'user-1',
              startTime: new Date('2024-01-01T08:00:00Z'),
              endTime: new Date('2024-01-01T17:00:00Z'),
              breakMinutes: 60,
              user: {},
            },
          ],
        },
      ];

      const mockActualHours = [
        {
          userId: 'user-1',
          date: new Date('2024-01-01'),
          totalHours: 10, // More than scheduled
          overtimeHours: 1,
        },
      ];

      mockPrisma.roster.findMany.mockResolvedValue(mockRosters);
      mockPrisma.actualHours.findMany.mockResolvedValue(mockActualHours);

      const result = await service.getDashboardMetrics('org-1', startDate, endDate);

      expect(result.labor.variance).toBeDefined();
      expect(result.labor.variancePercentage).toBeDefined();
    });
  });

  describe('Compliance rate calculation', () => {
    it('should calculate 100% compliance when no violations', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const mockRosters = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate,
          endDate,
          isLatePublication: false,
          shifts: [
            {
              id: 'shift-1',
              violatesRestPeriod: false,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {},
            },
            {
              id: 'shift-2',
              violatesRestPeriod: false,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {},
            },
          ],
        },
      ];

      mockPrisma.roster.findMany.mockResolvedValue(mockRosters);
      mockPrisma.actualHours.findMany.mockResolvedValue([]);

      const result = await service.getDashboardMetrics('org-1', startDate, endDate);

      expect(result.compliance.complianceRate).toBe(100);
      expect(result.compliance.shiftsWithViolations).toBe(0);
      expect(result.compliance.compliantShifts).toBe(2);
    });

    it('should calculate partial compliance with violations', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const mockRosters = [
        {
          id: 'roster-1',
          organizationId: 'org-1',
          startDate,
          endDate,
          isLatePublication: false,
          shifts: [
            {
              id: 'shift-1',
              violatesRestPeriod: false,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {},
            },
            {
              id: 'shift-2',
              violatesRestPeriod: true,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {},
            },
            {
              id: 'shift-3',
              violatesRestPeriod: false,
              violatesDailyLimit: true,
              violatesWeeklyLimit: false,
              user: {},
            },
            {
              id: 'shift-4',
              violatesRestPeriod: false,
              violatesDailyLimit: false,
              violatesWeeklyLimit: false,
              user: {},
            },
          ],
        },
      ];

      mockPrisma.roster.findMany.mockResolvedValue(mockRosters);
      mockPrisma.actualHours.findMany.mockResolvedValue([]);

      const result = await service.getDashboardMetrics('org-1', startDate, endDate);

      expect(result.compliance.totalShifts).toBe(4);
      expect(result.compliance.compliantShifts).toBe(2);
      expect(result.compliance.shiftsWithViolations).toBe(2);
      expect(result.compliance.complianceRate).toBe(50);
    });
  });
});
