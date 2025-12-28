// Unit tests for Time-Off Service
// Tests vacation and time-off request management with Norwegian standards

import { TimeOffService } from '../../src/services/timeOffService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    timeOffRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    accrualBalance: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock AuditLogger
jest.mock('../../src/services/auditLogger', () => {
  return {
    AuditLogger: jest.fn().mockImplementation(() => ({
      log: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('TimeOffService', () => {
  let service: TimeOffService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TimeOffService();
    mockPrisma = new PrismaClient();
  });

  describe('submitTimeOffRequest', () => {
    it('should submit vacation request with sufficient balance', async () => {
      const mockBalance = {
        id: 'balance-1',
        userId: 'user-1',
        type: 'VACATION',
        year: 2024,
        annualEntitlement: 25,
        earnedDays: 25,
        usedDays: 5,
        remainingDays: 20,
      };

      const mockRequest = {
        id: 'request-1',
        userId: 'user-1',
        type: 'VACATION',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-05'),
        totalDays: 5,
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockPrisma.accrualBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrisma.timeOffRequest.create.mockResolvedValue(mockRequest);

      const result = await service.submitTimeOffRequest({
        userId: 'user-1',
        type: 'VACATION',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-05'),
        reason: 'Summer vacation',
      });

      expect(result).toEqual(mockRequest);
      expect(mockPrisma.timeOffRequest.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'VACATION',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-05'),
          totalDays: 5,
          reason: 'Summer vacation',
          attachment: undefined,
          status: 'PENDING',
        },
      });
    });

    it('should reject vacation request with insufficient balance', async () => {
      const mockBalance = {
        id: 'balance-1',
        userId: 'user-1',
        type: 'VACATION',
        year: 2024,
        annualEntitlement: 25,
        earnedDays: 25,
        usedDays: 23,
        remainingDays: 2,
      };

      mockPrisma.accrualBalance.findUnique.mockResolvedValue(mockBalance);

      await expect(
        service.submitTimeOffRequest({
          userId: 'user-1',
          type: 'VACATION',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-10'),
          reason: 'Summer vacation',
        })
      ).rejects.toThrow('Insufficient vacation balance');
    });

    it('should calculate working days excluding weekends', async () => {
      // Week: Mon Jun 3 - Fri Jun 7 (5 working days)
      const mockBalance = {
        id: 'balance-1',
        userId: 'user-1',
        type: 'VACATION',
        year: 2024,
        annualEntitlement: 25,
        earnedDays: 25,
        usedDays: 0,
        remainingDays: 25,
      };

      const mockRequest = {
        id: 'request-1',
        userId: 'user-1',
        type: 'VACATION',
        startDate: new Date('2024-06-03'),
        endDate: new Date('2024-06-07'),
        totalDays: 5,
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockPrisma.accrualBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrisma.timeOffRequest.create.mockResolvedValue(mockRequest);

      const result = await service.submitTimeOffRequest({
        userId: 'user-1',
        type: 'VACATION',
        startDate: new Date('2024-06-03'),
        endDate: new Date('2024-06-07'),
      });

      expect(result.totalDays).toBe(5);
    });

    it('should allow sick leave without balance check', async () => {
      const mockRequest = {
        id: 'request-1',
        userId: 'user-1',
        type: 'SICK_LEAVE',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-03'),
        totalDays: 3,
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockPrisma.timeOffRequest.create.mockResolvedValue(mockRequest);

      const result = await service.submitTimeOffRequest({
        userId: 'user-1',
        type: 'SICK_LEAVE',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-03'),
        reason: 'Flu',
        attachment: 'sick-note.pdf',
      });

      expect(result).toEqual(mockRequest);
      expect(mockPrisma.accrualBalance.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('approveTimeOffRequest', () => {
    it('should approve pending request and deduct from balance', async () => {
      const mockRequest = {
        id: 'request-1',
        userId: 'user-1',
        type: 'VACATION',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-05'),
        totalDays: 5,
        status: 'PENDING',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const mockBalance = {
        id: 'balance-1',
        userId: 'user-1',
        type: 'VACATION',
        year: 2024,
        annualEntitlement: 25,
        earnedDays: 25,
        usedDays: 10,
        remainingDays: 15,
      };

      const mockApproved = {
        ...mockRequest,
        status: 'APPROVED',
        approvedBy: 'manager-1',
        approvedAt: new Date(),
      };

      mockPrisma.timeOffRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.timeOffRequest.update.mockResolvedValue(mockApproved);
      mockPrisma.accrualBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrisma.accrualBalance.update.mockResolvedValue({
        ...mockBalance,
        usedDays: 15,
        remainingDays: 10,
      });

      const result = await service.approveTimeOffRequest(
        'request-1',
        'manager-1',
        'manager@example.com'
      );

      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.accrualBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-1' },
        data: {
          usedDays: 15,
          remainingDays: 10,
        },
      });
    });

    it('should reject approval of non-existent request', async () => {
      mockPrisma.timeOffRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.approveTimeOffRequest('invalid-id', 'manager-1', 'manager@example.com')
      ).rejects.toThrow('Request not found');
    });

    it('should reject approval of already processed request', async () => {
      const mockRequest = {
        id: 'request-1',
        userId: 'user-1',
        type: 'VACATION',
        status: 'APPROVED',
        user: {
          id: 'user-1',
        },
      };

      mockPrisma.timeOffRequest.findUnique.mockResolvedValue(mockRequest);

      await expect(
        service.approveTimeOffRequest('request-1', 'manager-1', 'manager@example.com')
      ).rejects.toThrow('Request has already been processed');
    });

    it('should approve sick leave and deduct from balance', async () => {
      const mockRequest = {
        id: 'request-1',
        userId: 'user-1',
        type: 'SICK_LEAVE',
        totalDays: 3,
        status: 'PENDING',
        user: {
          id: 'user-1',
        },
      };

      const mockBalance = {
        id: 'balance-1',
        userId: 'user-1',
        type: 'SICK_LEAVE',
        year: 2024,
        annualEntitlement: 10,
        earnedDays: 10,
        usedDays: 0,
        remainingDays: 10,
      };

      mockPrisma.timeOffRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.timeOffRequest.update.mockResolvedValue({
        ...mockRequest,
        status: 'APPROVED',
      });
      mockPrisma.accrualBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrisma.accrualBalance.update.mockResolvedValue({
        ...mockBalance,
        usedDays: 3,
        remainingDays: 7,
      });

      await service.approveTimeOffRequest('request-1', 'manager-1', 'manager@example.com');

      expect(mockPrisma.accrualBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-1' },
        data: {
          usedDays: 3,
          remainingDays: 7,
        },
      });
    });
  });

  describe('rejectTimeOffRequest', () => {
    it('should reject request with reason', async () => {
      const mockRejected = {
        id: 'request-1',
        userId: 'user-1',
        status: 'REJECTED',
        approvedBy: 'manager-1',
        approvedAt: new Date(),
        rejectionReason: 'Not enough coverage',
      };

      mockPrisma.timeOffRequest.update.mockResolvedValue(mockRejected);

      const result = await service.rejectTimeOffRequest(
        'request-1',
        'manager-1',
        'manager@example.com',
        'Not enough coverage'
      );

      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Not enough coverage');
    });
  });

  describe('getAccrualBalance', () => {
    it('should return existing balance', async () => {
      const mockBalance = {
        id: 'balance-1',
        userId: 'user-1',
        type: 'VACATION',
        year: 2024,
        annualEntitlement: 25,
        earnedDays: 25,
        usedDays: 10,
        remainingDays: 15,
      };

      mockPrisma.accrualBalance.findUnique.mockResolvedValue(mockBalance);

      const result = await service.getAccrualBalance('user-1', 'VACATION', 2024);

      expect(result).toEqual(mockBalance);
    });

    it('should create balance with Norwegian vacation standard (25 days)', async () => {
      mockPrisma.accrualBalance.findUnique.mockResolvedValue(null);
      mockPrisma.accrualBalance.create.mockResolvedValue({
        id: 'balance-1',
        userId: 'user-1',
        type: 'VACATION',
        year: 2024,
        annualEntitlement: 25,
        earnedDays: 25,
        usedDays: 0,
        remainingDays: 25,
      });

      const result = await service.getAccrualBalance('user-1', 'VACATION', 2024);

      expect(result.annualEntitlement).toBe(25); // Norwegian standard
      expect(result.remainingDays).toBe(25);
      expect(mockPrisma.accrualBalance.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'VACATION',
          year: 2024,
          annualEntitlement: 25,
          earnedDays: 25,
          usedDays: 0,
          remainingDays: 25,
        },
      });
    });

    it('should create sick leave balance with 10 days entitlement', async () => {
      mockPrisma.accrualBalance.findUnique.mockResolvedValue(null);
      mockPrisma.accrualBalance.create.mockResolvedValue({
        id: 'balance-1',
        userId: 'user-1',
        type: 'SICK_LEAVE',
        year: 2024,
        annualEntitlement: 10,
        earnedDays: 10,
        usedDays: 0,
        remainingDays: 10,
      });

      const result = await service.getAccrualBalance('user-1', 'SICK_LEAVE', 2024);

      expect(result.annualEntitlement).toBe(10);
    });
  });

  describe('getUserTimeOffRequests', () => {
    it('should return all requests for user', async () => {
      const mockRequests = [
        {
          id: 'request-1',
          userId: 'user-1',
          type: 'VACATION',
          status: 'APPROVED',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'request-2',
          userId: 'user-1',
          type: 'SICK_LEAVE',
          status: 'PENDING',
          createdAt: new Date('2024-01-15'),
        },
      ];

      mockPrisma.timeOffRequest.findMany.mockResolvedValue(mockRequests);

      const result = await service.getUserTimeOffRequests('user-1');

      expect(result).toEqual(mockRequests);
      expect(mockPrisma.timeOffRequest.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getPendingTimeOffRequests', () => {
    it('should return all pending requests with user info', async () => {
      const mockRequests = [
        {
          id: 'request-1',
          userId: 'user-1',
          status: 'PENDING',
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            department: 'Sales',
          },
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockPrisma.timeOffRequest.findMany.mockResolvedValue(mockRequests);

      const result = await service.getPendingTimeOffRequests();

      expect(result).toEqual(mockRequests);
      expect(mockPrisma.timeOffRequest.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getUserAccrualBalances', () => {
    it('should return all balances for current year', async () => {
      const mockBalances = [
        {
          id: 'balance-1',
          userId: 'user-1',
          type: 'VACATION',
          year: 2024,
          remainingDays: 15,
        },
        {
          id: 'balance-2',
          userId: 'user-1',
          type: 'SICK_LEAVE',
          year: 2024,
          remainingDays: 10,
        },
      ];

      mockPrisma.accrualBalance.findMany.mockResolvedValue(mockBalances);

      const result = await service.getUserAccrualBalances('user-1');

      expect(result).toEqual(mockBalances);
      expect(mockPrisma.accrualBalance.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          year: new Date().getFullYear(),
        },
      });
    });

    it('should return balances for specific year', async () => {
      mockPrisma.accrualBalance.findMany.mockResolvedValue([]);

      await service.getUserAccrualBalances('user-1', 2023);

      expect(mockPrisma.accrualBalance.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          year: 2023,
        },
      });
    });
  });
});
