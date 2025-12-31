// People-First Dashboard Service
// Provides employee-centric metrics focused on culture, wellness, and human connection
// Rather than just compliance and cost tracking

import { PrismaClient, KudosCategory, MilestoneType, QuickActionType } from '@prisma/client';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInHours,
  differenceInYears,
  differenceInDays,
  isSameDay,
  addDays,
  format,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns';
import { nb } from 'date-fns/locale';

const prisma = new PrismaClient();

// Types for People-First features
export interface PersonalDashboard {
  greeting: string;
  todayAtAGlance: TodayAtAGlance;
  upcomingShifts: UpcomingShift[];
  quickActions: QuickAction[];
  teamPulse: TeamPulse;
  celebrations: Celebration[];
  kudosFeed: KudosFeedItem[];
  wellnessSummary: WellnessSummary;
  personalStats: PersonalStats;
}

export interface TodayAtAGlance {
  hasShiftToday: boolean;
  shift?: {
    startTime: string;
    endTime: string;
    location: string;
    department: string;
    hoursUntilStart?: number;
  };
  teamMembersWorking: number;
  openShiftsAvailable: number;
  unreadNotifications: number;
  pendingRequests: number;
}

export interface UpcomingShift {
  id: string;
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
  duration: string;
  location: string;
  isToday: boolean;
  isTomorrow: boolean;
}

export interface QuickAction {
  type: QuickActionType;
  label: string;
  icon: string;
  badge?: number;
  isAvailable: boolean;
}

export interface TeamPulse {
  teamMood: number; // Average mood 1-5
  teamMoodTrend: 'up' | 'down' | 'stable';
  workingToday: TeamMember[];
  recentKudos: number;
  upcomingCelebrations: number;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  department: string;
  shiftTime: string;
}

export interface Celebration {
  id: string;
  type: 'birthday' | 'anniversary' | 'milestone';
  personName: string;
  personInitials: string;
  title: string;
  date: string;
  daysUntil: number;
  canCelebrate: boolean;
}

export interface KudosFeedItem {
  id: string;
  fromName: string;
  fromInitials: string;
  toName: string;
  toInitials: string;
  category: string;
  categoryEmoji: string;
  message: string;
  celebrationCount: number;
  timeAgo: string;
  isOwnKudos: boolean;
}

export interface WellnessSummary {
  workLifeBalanceScore: number;
  scoreLabel: string;
  scoreColor: string;
  weeklyHours: number;
  weeklyHoursStatus: 'healthy' | 'moderate' | 'high';
  averageRestHours: number;
  restStatus: 'good' | 'ok' | 'needs-attention';
  insight: string;
  recommendation: string;
}

export interface PersonalStats {
  shiftsThisMonth: number;
  hoursThisMonth: number;
  kudosReceived: number;
  kudosGiven: number;
  vacationDaysRemaining: number;
  currentStreak: number; // Days of perfect attendance
}

// Category emoji mapping
const KUDOS_EMOJI: Record<KudosCategory, string> = {
  TEAMWORK: '🤝',
  INNOVATION: '💡',
  CUSTOMER_SERVICE: '⭐',
  LEADERSHIP: '🎯',
  GOING_EXTRA_MILE: '🚀',
  PROBLEM_SOLVING: '🧩',
  MENTORSHIP: '🌱',
  POSITIVE_ATTITUDE: '☀️',
  RELIABILITY: '🏆',
  OTHER: '👏',
};

// Category labels in Norwegian
const KUDOS_LABELS_NO: Record<KudosCategory, string> = {
  TEAMWORK: 'Samarbeid',
  INNOVATION: 'Innovasjon',
  CUSTOMER_SERVICE: 'Kundeservice',
  LEADERSHIP: 'Lederskap',
  GOING_EXTRA_MILE: 'Ekstra innsats',
  PROBLEM_SOLVING: 'Problemløsning',
  MENTORSHIP: 'Mentorskap',
  POSITIVE_ATTITUDE: 'Positiv holdning',
  RELIABILITY: 'Pålitelighet',
  OTHER: 'Annet',
};

export class PeopleFirstService {
  /**
   * Get personalized dashboard for an employee
   */
  async getPersonalDashboard(userId: string, locale: string = 'no'): Promise<PersonalDashboard> {
    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employeeProfile: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [
      todayAtAGlance,
      upcomingShifts,
      quickActions,
      teamPulse,
      celebrations,
      kudosFeed,
      wellnessSummary,
      personalStats,
    ] = await Promise.all([
      this.getTodayAtAGlance(userId),
      this.getUpcomingShifts(userId, locale),
      this.getQuickActions(userId, locale),
      this.getTeamPulse(userId),
      this.getUpcomingCelebrations(userId, locale),
      this.getKudosFeed(userId, locale),
      this.getWellnessSummary(userId, locale),
      this.getPersonalStats(userId),
    ]);

    const greeting = this.generateGreeting(user.firstName, locale, now);

    return {
      greeting,
      todayAtAGlance,
      upcomingShifts,
      quickActions,
      teamPulse,
      celebrations,
      kudosFeed,
      wellnessSummary,
      personalStats,
    };
  }

  /**
   * Generate a friendly, time-appropriate greeting
   */
  private generateGreeting(firstName: string, locale: string, now: Date): string {
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let greeting: string;
    let timeGreeting: string;

    if (locale === 'no') {
      if (hour < 6) {
        timeGreeting = 'God natt';
      } else if (hour < 10) {
        timeGreeting = 'God morgen';
      } else if (hour < 12) {
        timeGreeting = 'God formiddag';
      } else if (hour < 17) {
        timeGreeting = 'God ettermiddag';
      } else if (hour < 21) {
        timeGreeting = 'God kveld';
      } else {
        timeGreeting = 'God kveld';
      }

      if (dayOfWeek === 1) {
        greeting = `${timeGreeting}, ${firstName}! Klar for en ny uke?`;
      } else if (dayOfWeek === 5) {
        greeting = `${timeGreeting}, ${firstName}! Snart helg!`;
      } else if (isWeekend) {
        greeting = `${timeGreeting}, ${firstName}! Ha en fin helg!`;
      } else {
        greeting = `${timeGreeting}, ${firstName}!`;
      }
    } else {
      if (hour < 6) {
        timeGreeting = 'Good night';
      } else if (hour < 12) {
        timeGreeting = 'Good morning';
      } else if (hour < 17) {
        timeGreeting = 'Good afternoon';
      } else {
        timeGreeting = 'Good evening';
      }

      if (dayOfWeek === 1) {
        greeting = `${timeGreeting}, ${firstName}! Ready for a new week?`;
      } else if (dayOfWeek === 5) {
        greeting = `${timeGreeting}, ${firstName}! Almost weekend!`;
      } else if (isWeekend) {
        greeting = `${timeGreeting}, ${firstName}! Enjoy your weekend!`;
      } else {
        greeting = `${timeGreeting}, ${firstName}!`;
      }
    }

    return greeting;
  }

  /**
   * Get today at a glance for quick overview
   */
  private async getTodayAtAGlance(userId: string): Promise<TodayAtAGlance> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's shift for user
    const todayShift = await prisma.shift.findFirst({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        roster: true,
      },
    });

    // Count team members working today
    const teamMembersWorking = await prisma.shift.count({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Count open shifts
    const openShiftsAvailable = await prisma.shiftMarketplaceListing.count({
      where: {
        status: 'AVAILABLE',
        availableUntil: {
          gte: now,
        },
      },
    });

    // Count unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    // Count pending requests
    const pendingTimeOff = await prisma.timeOffRequest.count({
      where: {
        userId,
        status: 'PENDING',
      },
    });
    const pendingSwaps = await prisma.shiftSwapRequest.count({
      where: {
        requestedBy: userId,
        status: 'PENDING',
      },
    });

    return {
      hasShiftToday: !!todayShift,
      shift: todayShift
        ? {
            startTime: format(todayShift.startTime, 'HH:mm'),
            endTime: format(todayShift.endTime, 'HH:mm'),
            location: todayShift.location || '',
            department: todayShift.department || '',
            hoursUntilStart: isAfter(todayShift.startTime, now)
              ? differenceInHours(todayShift.startTime, now)
              : undefined,
          }
        : undefined,
      teamMembersWorking,
      openShiftsAvailable,
      unreadNotifications,
      pendingRequests: pendingTimeOff + pendingSwaps,
    };
  }

  /**
   * Get upcoming shifts for the user
   */
  private async getUpcomingShifts(userId: string, locale: string): Promise<UpcomingShift[]> {
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    const shifts = await prisma.shift.findMany({
      where: {
        userId,
        startTime: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 5,
    });

    const tomorrow = addDays(now, 1);

    return shifts.map((shift) => {
      const duration = differenceInHours(shift.endTime, shift.startTime) - shift.breakMinutes / 60;
      const isToday = isSameDay(shift.startTime, now);
      const isTomorrow = isSameDay(shift.startTime, tomorrow);

      return {
        id: shift.id,
        date: format(shift.startTime, 'yyyy-MM-dd'),
        dayName: format(shift.startTime, 'EEEE', { locale: locale === 'no' ? nb : undefined }),
        startTime: format(shift.startTime, 'HH:mm'),
        endTime: format(shift.endTime, 'HH:mm'),
        duration: `${duration.toFixed(1)}t`,
        location: shift.location || '',
        isToday,
        isTomorrow,
      };
    });
  }

  /**
   * Get personalized quick actions based on user's most frequent actions
   */
  private async getQuickActions(userId: string, locale: string): Promise<QuickAction[]> {
    const quickActionSettings = await prisma.userQuickAction.findMany({
      where: { userId, isEnabled: true },
      orderBy: [{ usageCount: 'desc' }, { displayOrder: 'asc' }],
      take: 6,
    });

    // Default actions if user hasn't customized
    const defaultActions: QuickActionType[] = [
      'VIEW_SCHEDULE',
      'REQUEST_TIME_OFF',
      'CLAIM_OPEN_SHIFT',
      'SEND_KUDOS',
      'CHECK_BALANCE',
      'VIEW_TEAM',
    ];

    const actionsToShow =
      quickActionSettings.length > 0
        ? quickActionSettings.map((a) => a.actionType)
        : defaultActions;

    // Get badges for actions
    const openShifts = await prisma.shiftMarketplaceListing.count({
      where: { status: 'AVAILABLE', availableUntil: { gte: new Date() } },
    });

    const unreadMessages = await prisma.message.count({
      where: { recipientId: userId, isRead: false },
    });

    const labels = locale === 'no' ? QUICK_ACTION_LABELS_NO : QUICK_ACTION_LABELS_EN;
    const icons = QUICK_ACTION_ICONS;

    return actionsToShow.map((actionType) => ({
      type: actionType,
      label: labels[actionType],
      icon: icons[actionType],
      badge: actionType === 'CLAIM_OPEN_SHIFT' ? openShifts :
             actionType === 'MESSAGE_MANAGER' ? unreadMessages : undefined,
      isAvailable: true,
    }));
  }

  /**
   * Get team pulse - how the team is feeling and who's working
   */
  private async getTeamPulse(userId: string): Promise<TeamPulse> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const weekAgo = addDays(now, -7);

    // Get team mood average (last 7 days)
    const moodCheckIns = await prisma.moodCheckIn.findMany({
      where: {
        checkInDate: { gte: weekAgo },
      },
    });
    const avgMood = moodCheckIns.length > 0
      ? moodCheckIns.reduce((sum, m) => sum + m.moodScore, 0) / moodCheckIns.length
      : 3.5;

    // Get previous week's mood for trend
    const twoWeeksAgo = addDays(now, -14);
    const prevMoodCheckIns = await prisma.moodCheckIn.findMany({
      where: {
        checkInDate: { gte: twoWeeksAgo, lt: weekAgo },
      },
    });
    const prevAvgMood = prevMoodCheckIns.length > 0
      ? prevMoodCheckIns.reduce((sum, m) => sum + m.moodScore, 0) / prevMoodCheckIns.length
      : avgMood;

    let moodTrend: 'up' | 'down' | 'stable' = 'stable';
    if (avgMood > prevAvgMood + 0.2) moodTrend = 'up';
    if (avgMood < prevAvgMood - 0.2) moodTrend = 'down';

    // Get team members working today
    const todayShifts = await prisma.shift.findMany({
      where: {
        startTime: { gte: startOfDay, lte: endOfDay },
        userId: { not: userId }, // Exclude current user
      },
      include: {
        user: true,
      },
      take: 6,
    });

    const workingToday: TeamMember[] = todayShifts.map((shift) => ({
      id: shift.user.id,
      name: `${shift.user.firstName} ${shift.user.lastName}`,
      initials: `${shift.user.firstName[0]}${shift.user.lastName[0]}`,
      department: shift.department || shift.user.department || '',
      shiftTime: `${format(shift.startTime, 'HH:mm')}-${format(shift.endTime, 'HH:mm')}`,
    }));

    // Recent kudos count
    const recentKudos = await prisma.kudos.count({
      where: {
        createdAt: { gte: weekAgo },
      },
    });

    // Upcoming celebrations (next 7 days)
    const upcomingCelebrations = await prisma.milestone.count({
      where: {
        isPublic: true,
        milestoneDate: {
          gte: now,
          lte: addDays(now, 7),
        },
      },
    });

    return {
      teamMood: Math.round(avgMood * 10) / 10,
      teamMoodTrend: moodTrend,
      workingToday,
      recentKudos,
      upcomingCelebrations,
    };
  }

  /**
   * Get upcoming celebrations (birthdays, anniversaries, milestones)
   */
  private async getUpcomingCelebrations(userId: string, locale: string): Promise<Celebration[]> {
    const now = new Date();
    const twoWeeksFromNow = addDays(now, 14);

    // Get milestones (work anniversaries, achievements)
    const upcomingMilestones = await prisma.milestone.findMany({
      where: {
        isPublic: true,
        milestoneDate: {
          gte: now,
          lte: twoWeeksFromNow,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        milestoneDate: 'asc',
      },
      take: 5,
    });

    // Get birthdays from employee profiles
    const profiles = await prisma.employeeProfile.findMany({
      where: {
        showBirthdayPublicly: true,
        birthday: { not: null },
      },
      include: {
        user: true,
      },
    });

    const celebrations: Celebration[] = [];

    // Add milestones
    for (const milestone of upcomingMilestones) {
      const daysUntil = differenceInDays(milestone.milestoneDate, now);
      celebrations.push({
        id: milestone.id,
        type: milestone.type === 'WORK_ANNIVERSARY' ? 'anniversary' : 'milestone',
        personName: `${milestone.user.firstName} ${milestone.user.lastName}`,
        personInitials: `${milestone.user.firstName[0]}${milestone.user.lastName[0]}`,
        title: milestone.title,
        date: format(milestone.milestoneDate, 'd. MMM', { locale: locale === 'no' ? nb : undefined }),
        daysUntil,
        canCelebrate: milestone.userId !== userId,
      });
    }

    // Check for upcoming birthdays
    for (const profile of profiles) {
      if (!profile.birthday) continue;

      const birthdayThisYear = new Date(
        now.getFullYear(),
        profile.birthday.getMonth(),
        profile.birthday.getDate()
      );

      if (birthdayThisYear >= now && birthdayThisYear <= twoWeeksFromNow) {
        const daysUntil = differenceInDays(birthdayThisYear, now);
        celebrations.push({
          id: `birthday-${profile.userId}`,
          type: 'birthday',
          personName: `${profile.user.firstName} ${profile.user.lastName}`,
          personInitials: `${profile.user.firstName[0]}${profile.user.lastName[0]}`,
          title: locale === 'no' ? 'Bursdag' : 'Birthday',
          date: format(birthdayThisYear, 'd. MMM', { locale: locale === 'no' ? nb : undefined }),
          daysUntil,
          canCelebrate: profile.userId !== userId,
        });
      }
    }

    // Sort by date and take top 5
    return celebrations.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
  }

  /**
   * Get kudos feed for team recognition
   */
  private async getKudosFeed(userId: string, locale: string): Promise<KudosFeedItem[]> {
    const weekAgo = addDays(new Date(), -7);

    const kudos = await prisma.kudos.findMany({
      where: {
        isPublic: true,
        createdAt: { gte: weekAgo },
      },
      include: {
        fromUser: true,
        toUser: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    const labels = locale === 'no' ? KUDOS_LABELS_NO : KUDOS_LABELS_EN;

    return kudos.map((k) => ({
      id: k.id,
      fromName: `${k.fromUser.firstName} ${k.fromUser.lastName}`,
      fromInitials: `${k.fromUser.firstName[0]}${k.fromUser.lastName[0]}`,
      toName: `${k.toUser.firstName} ${k.toUser.lastName}`,
      toInitials: `${k.toUser.firstName[0]}${k.toUser.lastName[0]}`,
      category: labels[k.category],
      categoryEmoji: KUDOS_EMOJI[k.category],
      message: k.message,
      celebrationCount: k.celebrationCount,
      timeAgo: this.getTimeAgo(k.createdAt, locale),
      isOwnKudos: k.fromUserId === userId || k.toUserId === userId,
    }));
  }

  /**
   * Get wellness summary for work-life balance
   */
  private async getWellnessSummary(userId: string, locale: string): Promise<WellnessSummary> {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Get shifts this week
    const weekShifts = await prisma.shift.findMany({
      where: {
        userId,
        startTime: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { startTime: 'asc' },
    });

    // Calculate hours
    const weeklyHours = weekShifts.reduce((sum, shift) => {
      const hours = differenceInHours(shift.endTime, shift.startTime) - shift.breakMinutes / 60;
      return sum + hours;
    }, 0);

    // Calculate average rest between shifts
    let totalRestHours = 0;
    let restPeriods = 0;
    for (let i = 1; i < weekShifts.length; i++) {
      const rest = differenceInHours(weekShifts[i].startTime, weekShifts[i - 1].endTime);
      if (rest > 0 && rest < 72) {
        totalRestHours += rest;
        restPeriods++;
      }
    }
    const averageRestHours = restPeriods > 0 ? totalRestHours / restPeriods : 24;

    // Calculate work-life balance score
    let score = 100;
    if (weeklyHours > 40) score -= (weeklyHours - 40) * 3;
    if (weeklyHours > 45) score -= (weeklyHours - 45) * 5;
    if (averageRestHours < 11) score -= (11 - averageRestHours) * 5;
    score = Math.max(0, Math.min(100, score));

    // Determine status labels
    let scoreLabel: string;
    let scoreColor: string;
    if (score >= 80) {
      scoreLabel = locale === 'no' ? 'Utmerket' : 'Excellent';
      scoreColor = '#4CAF50';
    } else if (score >= 60) {
      scoreLabel = locale === 'no' ? 'God' : 'Good';
      scoreColor = '#8BC34A';
    } else if (score >= 40) {
      scoreLabel = locale === 'no' ? 'Moderat' : 'Moderate';
      scoreColor = '#FFC107';
    } else {
      scoreLabel = locale === 'no' ? 'Trenger oppmerksomhet' : 'Needs attention';
      scoreColor = '#FF5722';
    }

    const weeklyHoursStatus: 'healthy' | 'moderate' | 'high' =
      weeklyHours <= 37.5 ? 'healthy' : weeklyHours <= 42 ? 'moderate' : 'high';

    const restStatus: 'good' | 'ok' | 'needs-attention' =
      averageRestHours >= 11 ? 'good' : averageRestHours >= 9 ? 'ok' : 'needs-attention';

    // Generate insights
    const insights = this.generateWellnessInsights(weeklyHours, averageRestHours, locale);

    return {
      workLifeBalanceScore: Math.round(score),
      scoreLabel,
      scoreColor,
      weeklyHours: Math.round(weeklyHours * 10) / 10,
      weeklyHoursStatus,
      averageRestHours: Math.round(averageRestHours * 10) / 10,
      restStatus,
      insight: insights.insight,
      recommendation: insights.recommendation,
    };
  }

  /**
   * Generate personalized wellness insights
   */
  private generateWellnessInsights(
    weeklyHours: number,
    avgRest: number,
    locale: string
  ): { insight: string; recommendation: string } {
    if (locale === 'no') {
      if (weeklyHours <= 37.5 && avgRest >= 11) {
        return {
          insight: 'Du har en sunn arbeidsbalanse denne uken.',
          recommendation: 'Fortsett det gode arbeidet! Husk å ta pauser.',
        };
      } else if (weeklyHours > 42) {
        return {
          insight: 'Du har jobbet flere timer enn vanlig denne uken.',
          recommendation: 'Vurder å ta en ekstra fridag neste uke for å lade batteriene.',
        };
      } else if (avgRest < 11) {
        return {
          insight: 'Hviletiden mellom skiftene dine har vært kort.',
          recommendation: 'Prøv å få minst 11 timers hvile mellom skift for bedre restitusjon.',
        };
      }
      return {
        insight: 'Arbeidsbelastningen din er innenfor normalen.',
        recommendation: 'Husk å prioritere fritid og familie.',
      };
    } else {
      if (weeklyHours <= 37.5 && avgRest >= 11) {
        return {
          insight: 'You have a healthy work balance this week.',
          recommendation: 'Keep up the good work! Remember to take breaks.',
        };
      } else if (weeklyHours > 42) {
        return {
          insight: 'You\'ve worked more hours than usual this week.',
          recommendation: 'Consider taking an extra day off next week to recharge.',
        };
      } else if (avgRest < 11) {
        return {
          insight: 'Your rest time between shifts has been short.',
          recommendation: 'Try to get at least 11 hours of rest between shifts for better recovery.',
        };
      }
      return {
        insight: 'Your workload is within normal range.',
        recommendation: 'Remember to prioritize leisure and family time.',
      };
    }
  }

  /**
   * Get personal stats for the user
   */
  private async getPersonalStats(userId: string): Promise<PersonalStats> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Shifts this month
    const shiftsThisMonth = await prisma.shift.count({
      where: {
        userId,
        startTime: { gte: monthStart, lte: monthEnd },
      },
    });

    // Hours this month
    const monthShifts = await prisma.shift.findMany({
      where: {
        userId,
        startTime: { gte: monthStart, lte: monthEnd },
      },
    });
    const hoursThisMonth = monthShifts.reduce((sum, shift) => {
      return sum + differenceInHours(shift.endTime, shift.startTime) - shift.breakMinutes / 60;
    }, 0);

    // Kudos counts
    const kudosReceived = await prisma.kudos.count({
      where: { toUserId: userId },
    });
    const kudosGiven = await prisma.kudos.count({
      where: { fromUserId: userId },
    });

    // Vacation days remaining
    const currentYear = now.getFullYear();
    const accrual = await prisma.accrualBalance.findFirst({
      where: {
        userId,
        type: 'VACATION',
        year: currentYear,
      },
    });
    const vacationDaysRemaining = accrual ? Number(accrual.remainingDays) : 25;

    // Current streak (simplified - days since last missed shift)
    const currentStreak = 30; // Placeholder - would need more complex calculation

    return {
      shiftsThisMonth,
      hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
      kudosReceived,
      kudosGiven,
      vacationDaysRemaining,
      currentStreak,
    };
  }

  /**
   * Get relative time string
   */
  private getTimeAgo(date: Date, locale: string): string {
    const now = new Date();
    const hours = differenceInHours(now, date);
    const days = differenceInDays(now, date);

    if (locale === 'no') {
      if (hours < 1) return 'Nettopp';
      if (hours < 24) return `${hours}t siden`;
      if (days === 1) return 'I går';
      if (days < 7) return `${days}d siden`;
      return format(date, 'd. MMM', { locale: nb });
    } else {
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      return format(date, 'MMM d');
    }
  }

  // ==========================================
  // KUDOS MANAGEMENT
  // ==========================================

  /**
   * Send kudos to a colleague
   */
  async sendKudos(
    fromUserId: string,
    toUserId: string,
    category: KudosCategory,
    message: string,
    isPublic: boolean = true
  ) {
    if (fromUserId === toUserId) {
      throw new Error('Cannot send kudos to yourself');
    }

    const kudos = await prisma.kudos.create({
      data: {
        fromUserId,
        toUserId,
        category,
        message,
        isPublic,
      },
      include: {
        fromUser: true,
        toUser: true,
      },
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: toUserId,
        type: 'KUDOS_RECEIVED',
        title: `${kudos.fromUser.firstName} ga deg kudos!`,
        message: `${KUDOS_EMOJI[category]} ${message}`,
        relatedEntityType: 'Kudos',
        relatedEntityId: kudos.id,
      },
    });

    // Check for kudos milestone
    const kudosCount = await prisma.kudos.count({
      where: { toUserId },
    });

    if (kudosCount === 1) {
      await this.createMilestone(toUserId, 'FIRST_KUDOS', 'Første kudos mottatt!');
    } else if (kudosCount === 10) {
      await this.createMilestone(toUserId, 'TEN_KUDOS_RECEIVED', '10 kudos mottatt!');
    }

    return kudos;
  }

  /**
   * Celebrate a kudos or milestone
   */
  async celebrateKudos(kudosId: string, userId: string) {
    return prisma.kudos.update({
      where: { id: kudosId },
      data: { celebrationCount: { increment: 1 } },
    });
  }

  // ==========================================
  // MILESTONE MANAGEMENT
  // ==========================================

  /**
   * Create a milestone for a user
   */
  private async createMilestone(
    userId: string,
    type: MilestoneType,
    title: string,
    description?: string,
    yearsCount?: number
  ) {
    return prisma.milestone.create({
      data: {
        userId,
        type,
        title,
        description,
        yearsCount,
        milestoneDate: new Date(),
        isPublic: true,
      },
    });
  }

  /**
   * Check and create work anniversary milestones
   */
  async checkWorkAnniversaries() {
    const today = new Date();
    const users = await prisma.user.findMany({
      where: {
        hireDate: { not: null },
        isActive: true,
      },
    });

    for (const user of users) {
      if (!user.hireDate) continue;

      const years = differenceInYears(today, user.hireDate);
      const anniversaryDate = new Date(
        today.getFullYear(),
        user.hireDate.getMonth(),
        user.hireDate.getDate()
      );

      // Check if today is anniversary
      if (isSameDay(today, anniversaryDate) && years > 0) {
        // Check if milestone already exists for this year
        const existing = await prisma.milestone.findFirst({
          where: {
            userId: user.id,
            type: 'WORK_ANNIVERSARY',
            yearsCount: years,
          },
        });

        if (!existing) {
          await this.createMilestone(
            user.id,
            'WORK_ANNIVERSARY',
            `${years} ${years === 1 ? 'år' : 'år'} i bedriften!`,
            `Gratulerer med ${years}-årsjubileum!`,
            years
          );
        }
      }
    }
  }

  // ==========================================
  // MOOD CHECK-INS
  // ==========================================

  /**
   * Submit a mood check-in
   */
  async submitMoodCheckIn(userId: string, moodScore: number, tags?: string[], privateNote?: string) {
    if (moodScore < 1 || moodScore > 5) {
      throw new Error('Mood score must be between 1 and 5');
    }

    return prisma.moodCheckIn.create({
      data: {
        userId,
        moodScore,
        tags: tags || [],
        privateNote,
      },
    });
  }

  /**
   * Get user's mood history
   */
  async getMoodHistory(userId: string, days: number = 30) {
    const startDate = addDays(new Date(), -days);

    return prisma.moodCheckIn.findMany({
      where: {
        userId,
        checkInDate: { gte: startDate },
      },
      orderBy: { checkInDate: 'desc' },
    });
  }

  // ==========================================
  // TEAM CALENDAR
  // ==========================================

  /**
   * Get who's working on a specific date
   */
  async getTeamWorkingOn(date: Date, userId: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const shifts = await prisma.shift.findMany({
      where: {
        startTime: { gte: startOfDay, lte: endOfDay },
      },
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
      orderBy: { startTime: 'asc' },
    });

    return shifts.map((shift) => ({
      userId: shift.user.id,
      name: `${shift.user.firstName} ${shift.user.lastName}`,
      initials: `${shift.user.firstName[0]}${shift.user.lastName[0]}`,
      department: shift.department || shift.user.department || '',
      startTime: format(shift.startTime, 'HH:mm'),
      endTime: format(shift.endTime, 'HH:mm'),
      isCurrentUser: shift.user.id === userId,
    }));
  }

  // ==========================================
  // QUICK ACTIONS
  // ==========================================

  /**
   * Track quick action usage for smart sorting
   */
  async trackQuickActionUsage(userId: string, actionType: QuickActionType) {
    await prisma.userQuickAction.upsert({
      where: {
        userId_actionType: {
          userId,
          actionType,
        },
      },
      update: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        actionType,
        usageCount: 1,
        lastUsedAt: new Date(),
      },
    });
  }
}

// Quick action labels
const QUICK_ACTION_LABELS_NO: Record<QuickActionType, string> = {
  REQUEST_TIME_OFF: 'Be om fri',
  SWAP_SHIFT: 'Bytt skift',
  CLAIM_OPEN_SHIFT: 'Ta ledig skift',
  SEND_KUDOS: 'Send ros',
  VIEW_SCHEDULE: 'Se timeplan',
  CHECK_BALANCE: 'Sjekk saldo',
  CLOCK_IN: 'Stemple inn',
  CLOCK_OUT: 'Stemple ut',
  MESSAGE_MANAGER: 'Kontakt leder',
  VIEW_TEAM: 'Se teamet',
};

const QUICK_ACTION_LABELS_EN: Record<QuickActionType, string> = {
  REQUEST_TIME_OFF: 'Request time off',
  SWAP_SHIFT: 'Swap shift',
  CLAIM_OPEN_SHIFT: 'Claim open shift',
  SEND_KUDOS: 'Send kudos',
  VIEW_SCHEDULE: 'View schedule',
  CHECK_BALANCE: 'Check balance',
  CLOCK_IN: 'Clock in',
  CLOCK_OUT: 'Clock out',
  MESSAGE_MANAGER: 'Message manager',
  VIEW_TEAM: 'View team',
};

const QUICK_ACTION_ICONS: Record<QuickActionType, string> = {
  REQUEST_TIME_OFF: 'calendar-plus',
  SWAP_SHIFT: 'swap-horizontal',
  CLAIM_OPEN_SHIFT: 'hand-raised',
  SEND_KUDOS: 'star',
  VIEW_SCHEDULE: 'calendar',
  CHECK_BALANCE: 'wallet',
  CLOCK_IN: 'login',
  CLOCK_OUT: 'logout',
  MESSAGE_MANAGER: 'chat',
  VIEW_TEAM: 'people',
};

const KUDOS_LABELS_EN: Record<KudosCategory, string> = {
  TEAMWORK: 'Teamwork',
  INNOVATION: 'Innovation',
  CUSTOMER_SERVICE: 'Customer Service',
  LEADERSHIP: 'Leadership',
  GOING_EXTRA_MILE: 'Going Extra Mile',
  PROBLEM_SOLVING: 'Problem Solving',
  MENTORSHIP: 'Mentorship',
  POSITIVE_ATTITUDE: 'Positive Attitude',
  RELIABILITY: 'Reliability',
  OTHER: 'Other',
};
