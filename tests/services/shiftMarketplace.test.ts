// Unit tests for Shift Marketplace Service
// Tests shift posting, claiming, and approval workflow

import { ShiftMarketplaceService } from '../../src/services/shiftMarketplaceService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    shift: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    shiftMarketplaceListing: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
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

describe('ShiftMarketplaceService', () => {
  let service: ShiftMarketplaceService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ShiftMarketplaceService();
    mockPrisma = new PrismaClient();
  });

  describe('postShiftToMarketplace', () => {
    it('should post future shift to marketplace', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockShift = {
        id: 'shift-1',
        userId: 'user-1',
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + 8 * 60 * 60 * 1000),
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
        },
        roster: {
          id: 'roster-1',
          name: 'Week 45',
        },
      };

      const mockListing = {
        id: 'listing-1',
        shiftId: 'shift-1',
        postedBy: 'user-1',
        availableUntil: new Date(futureDate.getTime() - 24 * 60 * 60 * 1000),
        reason: 'Personal appointment',
        eligibleRoles: [],
        eligibleUserIds: [],
        status: 'AVAILABLE',
      };

      mockPrisma.shift.findUnique.mockResolvedValue(mockShift);
      mockPrisma.shiftMarketplaceListing.create.mockResolvedValue(mockListing);

      const result = await service.postShiftToMarketplace({
        shiftId: 'shift-1',
        postedBy: 'user-1',
        availableUntil: new Date(futureDate.getTime() - 24 * 60 * 60 * 1000),
        reason: 'Personal appointment',
      });

      expect(result).toEqual(mockListing);
      expect(mockPrisma.shiftMarketplaceListing.create).toHaveBeenCalledWith({
        data: {
          shiftId: 'shift-1',
          postedBy: 'user-1',
          availableUntil: expect.any(Date),
          reason: 'Personal appointment',
          eligibleRoles: [],
          eligibleUserIds: [],
          status: 'AVAILABLE',
        },
      });
    });

    it('should reject posting past shift', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockShift = {
        id: 'shift-1',
        startTime: pastDate,
        user: {},
        roster: {},
      };

      mockPrisma.shift.findUnique.mockResolvedValue(mockShift);

      await expect(
        service.postShiftToMarketplace({
          shiftId: 'shift-1',
          postedBy: 'user-1',
          availableUntil: new Date(),
        })
      ).rejects.toThrow('Cannot post past shifts to marketplace');
    });

    it('should reject posting non-existent shift', async () => {
      mockPrisma.shift.findUnique.mockResolvedValue(null);

      await expect(
        service.postShiftToMarketplace({
          shiftId: 'invalid-id',
          postedBy: 'user-1',
          availableUntil: new Date(),
        })
      ).rejects.toThrow('Shift not found');
    });

    it('should post shift with eligible roles', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockShift = {
        id: 'shift-1',
        startTime: futureDate,
        user: {},
        roster: {},
      };

      mockPrisma.shift.findUnique.mockResolvedValue(mockShift);
      mockPrisma.shiftMarketplaceListing.create.mockResolvedValue({
        id: 'listing-1',
        eligibleRoles: ['CASHIER', 'SALES'],
      });

      const result = await service.postShiftToMarketplace({
        shiftId: 'shift-1',
        postedBy: 'user-1',
        availableUntil: futureDate,
        eligibleRoles: ['CASHIER', 'SALES'],
      });

      expect(result.eligibleRoles).toEqual(['CASHIER', 'SALES']);
    });

    it('should post shift with eligible user IDs', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockShift = {
        id: 'shift-1',
        startTime: futureDate,
        user: {},
        roster: {},
      };

      mockPrisma.shift.findUnique.mockResolvedValue(mockShift);
      mockPrisma.shiftMarketplaceListing.create.mockResolvedValue({
        id: 'listing-1',
        eligibleUserIds: ['user-2', 'user-3'],
      });

      const result = await service.postShiftToMarketplace({
        shiftId: 'shift-1',
        postedBy: 'user-1',
        availableUntil: futureDate,
        eligibleUserIds: ['user-2', 'user-3'],
      });

      expect(result.eligibleUserIds).toEqual(['user-2', 'user-3']);
    });
  });

  describe('claimShift', () => {
    it('should claim available shift', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockListing = {
        id: 'listing-1',
        shiftId: 'shift-1',
        status: 'AVAILABLE',
        availableUntil: futureDate,
        eligibleUserIds: [],
        shift: {
          id: 'shift-1',
          user: { id: 'user-1' },
          roster: { id: 'roster-1' },
        },
      };

      const mockClaimed = {
        ...mockListing,
        status: 'CLAIMED',
        claimedBy: 'user-2',
        claimedAt: expect.any(Date),
      };

      mockPrisma.shiftMarketplaceListing.findUnique.mockResolvedValue(mockListing);
      mockPrisma.shiftMarketplaceListing.update.mockResolvedValue(mockClaimed);

      const result = await service.claimShift('listing-1', 'user-2', 'user2@example.com');

      expect(result.status).toBe('CLAIMED');
      expect(result.claimedBy).toBe('user-2');
      expect(mockPrisma.shiftMarketplaceListing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: {
          claimedBy: 'user-2',
          claimedAt: expect.any(Date),
          status: 'CLAIMED',
        },
      });
    });

    it('should reject claim of non-existent listing', async () => {
      mockPrisma.shiftMarketplaceListing.findUnique.mockResolvedValue(null);

      await expect(
        service.claimShift('invalid-id', 'user-2', 'user2@example.com')
      ).rejects.toThrow('Listing not found');
    });

    it('should reject claim of unavailable shift', async () => {
      const mockListing = {
        id: 'listing-1',
        status: 'CLAIMED',
        availableUntil: new Date(),
        shift: {},
      };

      mockPrisma.shiftMarketplaceListing.findUnique.mockResolvedValue(mockListing);

      await expect(
        service.claimShift('listing-1', 'user-2', 'user2@example.com')
      ).rejects.toThrow('Shift is no longer available');
    });

    it('should reject claim after deadline', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockListing = {
        id: 'listing-1',
        status: 'AVAILABLE',
        availableUntil: pastDate,
        shift: {},
      };

      mockPrisma.shiftMarketplaceListing.findUnique.mockResolvedValue(mockListing);

      await expect(
        service.claimShift('listing-1', 'user-2', 'user2@example.com')
      ).rejects.toThrow('Claim deadline has passed');
    });

    it('should enforce eligibility restrictions', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockListing = {
        id: 'listing-1',
        status: 'AVAILABLE',
        availableUntil: futureDate,
        eligibleUserIds: ['user-3', 'user-4'],
        shift: {},
      };

      mockPrisma.shiftMarketplaceListing.findUnique.mockResolvedValue(mockListing);

      await expect(
        service.claimShift('listing-1', 'user-2', 'user2@example.com')
      ).rejects.toThrow('You are not eligible to claim this shift');
    });

    it('should allow eligible user to claim', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockListing = {
        id: 'listing-1',
        status: 'AVAILABLE',
        availableUntil: futureDate,
        eligibleUserIds: ['user-2', 'user-3'],
        shift: { user: {}, roster: {} },
      };

      mockPrisma.shiftMarketplaceListing.findUnique.mockResolvedValue(mockListing);
      mockPrisma.shiftMarketplaceListing.update.mockResolvedValue({
        ...mockListing,
        status: 'CLAIMED',
        claimedBy: 'user-2',
      });

      const result = await service.claimShift('listing-1', 'user-2', 'user2@example.com');

      expect(result.claimedBy).toBe('user-2');
    });
  });

  describe('approveShiftClaim', () => {
    it('should approve claimed shift and reassign', async () => {
      const mockListing = {
        id: 'listing-1',
        shiftId: 'shift-1',
        status: 'CLAIMED',
        claimedBy: 'user-2',
        shift: {
          id: 'shift-1',
          userId: 'user-1',
        },
      };

      const mockApproved = {
        ...mockListing,
        status: 'APPROVED',
        approvedBy: 'manager-1',
        approvedAt: expect.any(Date),
      };

      mockPrisma.shiftMarketplaceListing.findUnique.mockResolvedValue(mockListing);
      mockPrisma.shiftMarketplaceListing.update.mockResolvedValue(mockApproved);
      mockPrisma.shift.update.mockResolvedValue({
        id: 'shift-1',
        userId: 'user-2',
      });

      const result = await service.approveShiftClaim(
        'listing-1',
        'manager-1',
        'manager@example.com'
      );

      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.shift.update).toHaveBeenCalledWith({
        where: { id: 'shift-1' },
        data: {
          userId: 'user-2',
          isChanged: true,
          changeReason: 'EMPLOYEE_REQUEST',
          changeNotes: 'Claimed from marketplace by employee',
          changedBy: 'manager-1',
          changedAt: expect.any(Date),
        },
      });
    });

    it('should reject approval of non-existent listing', async () => {
      mockPrisma.shiftMarketplaceListing.findUnique.mockResolvedValue(null);

      await expect(
        service.approveShiftClaim('invalid-id', 'manager-1', 'manager@example.com')
      ).rejects.toThrow('Listing not found');
    });

    it('should reject approval of unclaimed shift', async () => {
      const mockListing = {
        id: 'listing-1',
        status: 'AVAILABLE',
        shift: {},
      };

      mockPrisma.shiftMarketplaceListing.findUnique.mockResolvedValue(mockListing);

      await expect(
        service.approveShiftClaim('listing-1', 'manager-1', 'manager@example.com')
      ).rejects.toThrow('Shift has not been claimed');
    });

    it('should reject approval without claimer', async () => {
      const mockListing = {
        id: 'listing-1',
        status: 'CLAIMED',
        claimedBy: null,
        shift: {},
      };

      mockPrisma.shiftMarketplaceListing.findUnique.mockResolvedValue(mockListing);

      await expect(
        service.approveShiftClaim('listing-1', 'manager-1', 'manager@example.com')
      ).rejects.toThrow('No claimer found');
    });
  });

  describe('getAvailableShifts', () => {
    it('should return available shifts for user', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockListings = [
        {
          id: 'listing-1',
          status: 'AVAILABLE',
          availableUntil: futureDate,
          shift: {
            id: 'shift-1',
            startTime: futureDate,
            user: {
              id: 'user-2',
              firstName: 'Jane',
              lastName: 'Smith',
            },
            roster: {
              id: 'roster-1',
              name: 'Week 45',
            },
          },
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.shiftMarketplaceListing.findMany.mockResolvedValue(mockListings);

      const result = await service.getAvailableShifts('user-1');

      expect(result).toEqual(mockListings);
      expect(mockPrisma.shiftMarketplaceListing.findMany).toHaveBeenCalledWith({
        where: {
          status: 'AVAILABLE',
          availableUntil: {
            gte: expect.any(Date),
          },
          OR: [
            { eligibleUserIds: { isEmpty: true } },
            { eligibleUserIds: { has: 'user-1' } },
          ],
        },
        include: {
          shift: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              roster: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          availableUntil: 'asc',
        },
      });
    });

    it('should filter by user eligibility', async () => {
      const mockUser = {
        id: 'user-1',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.shiftMarketplaceListing.findMany.mockResolvedValue([]);

      await service.getAvailableShifts('user-1');

      const findManyCall = mockPrisma.shiftMarketplaceListing.findMany.mock.calls[0][0];
      expect(findManyCall.where.OR).toEqual([
        { eligibleUserIds: { isEmpty: true } },
        { eligibleUserIds: { has: 'user-1' } },
      ]);
    });

    it('should reject for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getAvailableShifts('invalid-id')).rejects.toThrow(
        'User not found'
      );
    });

    it('should order by availableUntil ascending', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.shiftMarketplaceListing.findMany.mockResolvedValue([]);

      await service.getAvailableShifts('user-1');

      const findManyCall = mockPrisma.shiftMarketplaceListing.findMany.mock.calls[0][0];
      expect(findManyCall.orderBy).toEqual({ availableUntil: 'asc' });
    });
  });

  describe('cancelListing', () => {
    it('should cancel marketplace listing', async () => {
      const mockCancelled = {
        id: 'listing-1',
        status: 'CANCELLED',
      };

      mockPrisma.shiftMarketplaceListing.update.mockResolvedValue(mockCancelled);

      const result = await service.cancelListing(
        'listing-1',
        'user-1',
        'user1@example.com'
      );

      expect(result.status).toBe('CANCELLED');
      expect(mockPrisma.shiftMarketplaceListing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: {
          status: 'CANCELLED',
        },
      });
    });
  });
});
