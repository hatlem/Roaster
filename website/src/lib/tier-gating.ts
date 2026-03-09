import { prisma } from "@/lib/db";

export type TierPlan = "free" | "starter" | "professional" | "enterprise";

export type TierFeature =
  | "csv_export"
  | "api_access"
  | "full_compliance"
  | "priority_support"
  | "shift_marketplace"
  | "audit_reports";

export interface TierLimits {
  maxEmployees: number;
  maxLocations: number;
  maxRostersPerMonth: number;
  csvExport: boolean;
  apiAccess: boolean;
  fullCompliance: boolean;
  prioritySupport: boolean;
}

const TIER_LIMITS: Record<TierPlan, TierLimits> = {
  free: {
    maxEmployees: 5,
    maxLocations: 1,
    maxRostersPerMonth: 2,
    csvExport: false,
    apiAccess: false,
    fullCompliance: false,
    prioritySupport: false,
  },
  starter: {
    maxEmployees: 25,
    maxLocations: 3,
    maxRostersPerMonth: Infinity,
    csvExport: true,
    apiAccess: false,
    fullCompliance: true,
    prioritySupport: false,
  },
  professional: {
    maxEmployees: 100,
    maxLocations: 10,
    maxRostersPerMonth: Infinity,
    csvExport: true,
    apiAccess: true,
    fullCompliance: true,
    prioritySupport: true,
  },
  enterprise: {
    maxEmployees: Infinity,
    maxLocations: Infinity,
    maxRostersPerMonth: Infinity,
    csvExport: true,
    apiAccess: true,
    fullCompliance: true,
    prioritySupport: true,
  },
};

const FEATURE_TIER_MAP: Record<TierFeature, TierPlan> = {
  csv_export: "starter",
  full_compliance: "starter",
  api_access: "professional",
  priority_support: "professional",
  shift_marketplace: "professional",
  audit_reports: "professional",
};

function normalizePlan(plan: string | null | undefined): TierPlan {
  const p = (plan || "free").toLowerCase();
  if (p in TIER_LIMITS) return p as TierPlan;
  return "free";
}

export function getTierLimits(plan: string): TierLimits {
  return TIER_LIMITS[normalizePlan(plan)];
}

async function getOrgPlan(orgId: string): Promise<TierPlan> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { subscriptionPlan: true, subscriptionStatus: true },
  });

  if (!org) return "free";

  // Treat canceled/unpaid subscriptions as free
  const activeStatuses = ["active", "trialing"];
  if (org.subscriptionPlan && org.subscriptionPlan !== "free") {
    if (!org.subscriptionStatus || !activeStatuses.includes(org.subscriptionStatus)) {
      return "free";
    }
  }

  return normalizePlan(org.subscriptionPlan);
}

export interface TierAccessResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: TierPlan;
}

export async function checkTierAccess(
  orgId: string,
  feature: string
): Promise<TierAccessResult> {
  const plan = await getOrgPlan(orgId);
  const limits = TIER_LIMITS[plan];

  const featureKey = feature as TierFeature;
  if (featureKey in FEATURE_TIER_MAP) {
    const requiredTier = FEATURE_TIER_MAP[featureKey];
    const tierOrder: TierPlan[] = ["free", "starter", "professional", "enterprise"];
    const currentIdx = tierOrder.indexOf(plan);
    const requiredIdx = tierOrder.indexOf(requiredTier);

    if (currentIdx < requiredIdx) {
      return {
        allowed: false,
        reason: `This feature requires the ${requiredTier} plan or higher`,
        upgradeRequired: requiredTier,
      };
    }
  }

  // Check boolean feature flags
  if (feature === "csv_export" && !limits.csvExport) {
    return { allowed: false, reason: "CSV export is not available on your current plan", upgradeRequired: "starter" };
  }
  if (feature === "api_access" && !limits.apiAccess) {
    return { allowed: false, reason: "API access is not available on your current plan", upgradeRequired: "professional" };
  }

  return { allowed: true };
}

export async function checkEmployeeLimit(orgId: string): Promise<TierAccessResult> {
  const plan = await getOrgPlan(orgId);
  const limits = TIER_LIMITS[plan];

  if (limits.maxEmployees === Infinity) {
    return { allowed: true };
  }

  const employeeCount = await prisma.user.count({
    where: { organizationId: orgId, isActive: true },
  });

  if (employeeCount >= limits.maxEmployees) {
    const nextTier = plan === "free" ? "starter" : plan === "starter" ? "professional" : "enterprise";
    return {
      allowed: false,
      reason: `You've reached the ${limits.maxEmployees} employee limit for the ${plan} plan`,
      upgradeRequired: nextTier as TierPlan,
    };
  }

  return { allowed: true };
}

export async function checkLocationLimit(orgId: string): Promise<TierAccessResult> {
  const plan = await getOrgPlan(orgId);
  const limits = TIER_LIMITS[plan];

  if (limits.maxLocations === Infinity) {
    return { allowed: true };
  }

  const locationCount = await prisma.location.count({
    where: { organizationId: orgId },
  });

  if (locationCount >= limits.maxLocations) {
    const nextTier = plan === "free" ? "starter" : plan === "starter" ? "professional" : "enterprise";
    return {
      allowed: false,
      reason: `You've reached the ${limits.maxLocations} location limit for the ${plan} plan`,
      upgradeRequired: nextTier as TierPlan,
    };
  }

  return { allowed: true };
}
