import { prisma } from "@/lib/db";
import { MarketplaceMode, MarketplaceStatus } from "@prisma/client";

interface CreateListingParams {
  shiftId: string;
  postedBy: string;
  mode: MarketplaceMode;
  reason?: string;
  availableUntil: Date;
  targetEmployeeId?: string;
  eligibleRoles?: string[];
  eligibleUserIds?: string[];
}

interface ClaimListingParams {
  listingId: string;
  claimedBy: string;
}

interface ApproveListingParams {
  listingId: string;
  approvedBy: string;
}

interface RejectListingParams {
  listingId: string;
  rejectedBy: string;
  reason: string;
}

// Get all available listings for an organization
export async function getAvailableListings(organizationId: string) {
  return prisma.shiftMarketplaceListing.findMany({
    where: {
      status: "AVAILABLE",
      availableUntil: { gt: new Date() },
      shift: {
        roster: { organizationId },
      },
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
    orderBy: { postedAt: "desc" },
  });
}

// Get listings posted by a specific user
export async function getMyListings(userId: string) {
  return prisma.shiftMarketplaceListing.findMany({
    where: { postedBy: userId },
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
      claimedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { postedAt: "desc" },
  });
}

// Get listings claimed by a specific user
export async function getClaimedListings(userId: string) {
  return prisma.shiftMarketplaceListing.findMany({
    where: { claimedBy: userId },
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
    orderBy: { claimedAt: "desc" },
  });
}

// Get pending approvals for managers
export async function getPendingApprovals(organizationId: string) {
  return prisma.shiftMarketplaceListing.findMany({
    where: {
      status: "CLAIMED",
      shift: {
        roster: { organizationId },
      },
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
      claimedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { claimedAt: "asc" },
  });
}

// Create a new marketplace listing
export async function createListing(params: CreateListingParams) {
  // Check if shift exists and is not already listed
  const existingListing = await prisma.shiftMarketplaceListing.findUnique({
    where: { shiftId: params.shiftId },
  });

  if (existingListing) {
    throw new Error("This shift is already listed on the marketplace");
  }

  // Verify the shift belongs to the user posting it
  const shift = await prisma.shift.findUnique({
    where: { id: params.shiftId },
    include: { user: true },
  });

  if (!shift) {
    throw new Error("Shift not found");
  }

  if (shift.userId !== params.postedBy) {
    throw new Error("You can only post your own shifts to the marketplace");
  }

  return prisma.shiftMarketplaceListing.create({
    data: {
      shiftId: params.shiftId,
      postedBy: params.postedBy,
      mode: params.mode,
      reason: params.reason,
      availableUntil: params.availableUntil,
      targetEmployeeId: params.targetEmployeeId,
      eligibleRoles: params.eligibleRoles || [],
      eligibleUserIds: params.eligibleUserIds || [],
      status: "AVAILABLE",
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
        },
      },
    },
  });
}

// Claim a listing
export async function claimListing(params: ClaimListingParams) {
  const listing = await prisma.shiftMarketplaceListing.findUnique({
    where: { id: params.listingId },
    include: { shift: true },
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  if (listing.status !== "AVAILABLE") {
    throw new Error("This listing is no longer available");
  }

  if (listing.availableUntil < new Date()) {
    throw new Error("This listing has expired");
  }

  // Check if user is eligible
  if (listing.mode === "HANDOVER" && listing.targetEmployeeId) {
    if (listing.targetEmployeeId !== params.claimedBy) {
      throw new Error("This shift is designated for a specific employee");
    }
  }

  if (listing.eligibleUserIds.length > 0) {
    if (!listing.eligibleUserIds.includes(params.claimedBy)) {
      throw new Error("You are not eligible to claim this shift");
    }
  }

  // Can't claim your own shift
  if (listing.postedBy === params.claimedBy) {
    throw new Error("You cannot claim your own shift");
  }

  return prisma.shiftMarketplaceListing.update({
    where: { id: params.listingId },
    data: {
      status: "CLAIMED",
      claimedBy: params.claimedBy,
      claimedAt: new Date(),
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
        },
      },
      claimedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

// Approve a claimed listing
export async function approveListing(params: ApproveListingParams) {
  const listing = await prisma.shiftMarketplaceListing.findUnique({
    where: { id: params.listingId },
    include: { shift: true },
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  if (listing.status !== "CLAIMED") {
    throw new Error("This listing is not pending approval");
  }

  if (!listing.claimedBy) {
    throw new Error("No one has claimed this listing");
  }

  // Transfer the shift to the new employee
  await prisma.$transaction([
    // Update the shift assignment
    prisma.shift.update({
      where: { id: listing.shiftId },
      data: { userId: listing.claimedBy },
    }),
    // Update the listing status
    prisma.shiftMarketplaceListing.update({
      where: { id: params.listingId },
      data: {
        status: "APPROVED",
        approvedBy: params.approvedBy,
        approvedAt: new Date(),
      },
    }),
  ]);

  return { success: true };
}

// Reject a claimed listing
export async function rejectListing(params: RejectListingParams) {
  const listing = await prisma.shiftMarketplaceListing.findUnique({
    where: { id: params.listingId },
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  if (listing.status !== "CLAIMED") {
    throw new Error("This listing is not pending approval");
  }

  return prisma.shiftMarketplaceListing.update({
    where: { id: params.listingId },
    data: {
      status: "REJECTED",
      rejectionReason: params.reason,
      // Reset claim info so it can be claimed again
      claimedBy: null,
      claimedAt: null,
    },
  });
}

// Cancel a listing
export async function cancelListing(listingId: string, userId: string) {
  const listing = await prisma.shiftMarketplaceListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  if (listing.postedBy !== userId) {
    throw new Error("You can only cancel your own listings");
  }

  if (listing.status === "APPROVED") {
    throw new Error("Cannot cancel an approved listing");
  }

  return prisma.shiftMarketplaceListing.update({
    where: { id: listingId },
    data: { status: "CANCELLED" },
  });
}

// Get a single listing by ID
export async function getListing(listingId: string) {
  return prisma.shiftMarketplaceListing.findUnique({
    where: { id: listingId },
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
      claimedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}
