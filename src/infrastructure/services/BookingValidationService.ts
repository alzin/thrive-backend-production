// backend/src/infrastructure/services/BookingValidationService.ts

import { IBookingValidationService, BookingValidationResult, BookingLimitsInfo } from '../../domain/services/IBookingValidationService';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { IBookingRepository } from '../../domain/repositories/IBookingRepository';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { SessionType } from '../../domain/entities/Session';
import { SubscriptionPlan } from '../../domain/entities/Subscription';

export class BookingValidationService implements IBookingValidationService {
  // Business rule constants
  public readonly STANDARD_PLAN_MONTHLY_LIMIT = 4;
  public readonly STANDARD_PLAN_ACTIVE_LIMIT = 4;
  public readonly PREMIUM_PLAN_ACTIVE_LIMIT = 2;
  public readonly TRIAL_LIFETIME_LIMIT = 1;
  public readonly MINIMUM_HOURS_NOTICE = 24;

  constructor(
    private sessionRepository: ISessionRepository,
    private bookingRepository: IBookingRepository,
    private subscriptionRepository: ISubscriptionRepository,
    private profileRepository: IProfileRepository
  ) { }

  private isPremiumPlan(plan: SubscriptionPlan): boolean {
    return ['premium', 'monthly', 'yearly'].includes(plan);
  }

  // --- NEW SAFE HELPER: Only calculates limits for ACTIVE users ---
  private getActivePlanLimits(plan: SubscriptionPlan) {
    if (this.isPremiumPlan(plan)) {
      return {
        maxActive: this.PREMIUM_PLAN_ACTIVE_LIMIT,
        monthlyLimit: null, // Unlimited
        canAccessAllTypes: true
      };
    }
    return {
      maxActive: this.STANDARD_PLAN_ACTIVE_LIMIT,
      monthlyLimit: this.STANDARD_PLAN_MONTHLY_LIMIT,
      canAccessAllTypes: false
    };
  }

  // ... (Date helpers remain the same)
  private getCurrentMonthString(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  private getMonthString(date: Date): string {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  private getHoursUntilSession(scheduledAt: Date): number {
    const now = new Date();
    return (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  }

  async getBookingLimits(userId: string): Promise<BookingLimitsInfo> {
    const subscription = await this.subscriptionRepository.findActiveByUserId(userId);

    if (!subscription) {
      return this.getEmptyBookingLimits();
    }

    const userPlan = subscription.subscriptionPlan;
    const isTrial = subscription.status === 'trialing';

    // 1. TRIAL LOGIC (Overrides Plan Limits)
    if (isTrial) {
      const allBookings = await this.bookingRepository.findByUserId(userId);
      const validHistoryCount = allBookings.filter(b => b.status !== 'CANCELLED').length;
      const activeBookings = await this.bookingRepository.findActiveByUserId(userId);

      return {
        userPlan,
        hasActiveSubscription: true,
        activeBookingsCount: activeBookings.length,
        maxActiveBookings: this.TRIAL_LIFETIME_LIMIT,
        activeBookingsRemaining: validHistoryCount >= this.TRIAL_LIFETIME_LIMIT ? 0 : 1,
        monthlyBookingCount: validHistoryCount,
        monthlyBookingLimit: this.TRIAL_LIFETIME_LIMIT,
        remainingMonthlyBookings: Math.max(0, this.TRIAL_LIFETIME_LIMIT - validHistoryCount),
        currentMonth: this.getCurrentMonthString()
      };
    }

    // 2. ACTIVE LOGIC (Uses Plan Limits)
    const limits = this.getActivePlanLimits(userPlan);
    const activeBookings = await this.bookingRepository.findActiveByUserId(userId);
    const activeBookingsRemaining = Math.max(0, limits.maxActive - activeBookings.length);

    // Monthly count logic
    const now = new Date();
    const monthlyBookingCount = await this.bookingRepository.countMonthlyStandardSessionBookings(
      userId,
      now.getUTCFullYear(),
      now.getUTCMonth() + 1
    );

    const remainingMonthlyBookings = limits.monthlyLimit !== null
      ? Math.max(0, limits.monthlyLimit - monthlyBookingCount)
      : null;

    return {
      userPlan,
      hasActiveSubscription: true,
      activeBookingsCount: activeBookings.length,
      maxActiveBookings: limits.maxActive,
      activeBookingsRemaining,
      monthlyBookingCount,
      monthlyBookingLimit: limits.monthlyLimit,
      remainingMonthlyBookings,
      currentMonth: this.getCurrentMonthString()
    };
  }

  async validateBooking(params: {
    userId: string;
    sessionId: string;
  }): Promise<BookingValidationResult> {
    const { userId, sessionId } = params;
    const reasons: string[] = [];

    const [session, subscription, activeBookings, profile] = await Promise.all([
      this.sessionRepository.findById(sessionId),
      this.subscriptionRepository.findActiveByUserId(userId),
      this.bookingRepository.findActiveByUserId(userId),
      this.profileRepository.findByUserId(userId)
    ]);

    if (!session) {
      return { canBook: false, reasons: ['Session not found'], validationDetails: this.getEmptyValidationDetails() };
    }

    // --- Basic Checks (Time, Capacity, Points) ---
    const now = new Date();
    const hoursUntilSession = this.getHoursUntilSession(session.scheduledAt);
    const sessionEndTime = new Date(session.scheduledAt.getTime() + session.duration * 60000);
    const isPast = sessionEndTime < now;

    const hasActiveSubscription = subscription !== null;
    const userPlan = subscription?.subscriptionPlan || null;
    const subStatus = subscription?.status;

    if (!hasActiveSubscription) reasons.push('Active subscription required to book sessions');
    
    const isAlreadyBooked = activeBookings.some(b => b.sessionId === sessionId);
    if (isAlreadyBooked) reasons.push('You have already booked this session');

    const meetsMinimumNotice = hoursUntilSession >= this.MINIMUM_HOURS_NOTICE;
    if (!meetsMinimumNotice && !isPast) {
      reasons.push(`Sessions must be booked at least ${this.MINIMUM_HOURS_NOTICE} hours in advance.`);
    }

    if (isPast) reasons.push('This session has already ended');
    if (!session.isActive) reasons.push('This session is not currently active');

    const spotsAvailable = session.maxParticipants - session.currentParticipants;
    if (spotsAvailable <= 0) reasons.push('This session is full');

    const hasEnoughPoints = session.pointsRequired <= 0 || (profile !== null && profile.points >= session.pointsRequired);
    if (!hasEnoughPoints) reasons.push(`Insufficient points.`);

    // --- SUBSCRIPTION SPECIFIC VALIDATION ---
    
    let canAccessSessionType = false;
    let maxActiveBookings = 0;
    let monthlyLimit: number | null = null;
    let activeBookingsRemaining = 0;
    let monthlyBookingCount = 0;
    let remainingMonthlyBookings: number | null = null;

    if (hasActiveSubscription && userPlan && subStatus) {

      // === CASE 1: TRIAL USERS ===
      if (subStatus === 'trialing') {
        maxActiveBookings = this.TRIAL_LIFETIME_LIMIT;
        canAccessSessionType = true; // Trial can access everything

        const allHistory = await this.bookingRepository.findByUserId(userId);
        const validHistory = allHistory.filter(b => b.status !== 'CANCELLED');
        
        if (validHistory.length >= this.TRIAL_LIFETIME_LIMIT) {
          reasons.push('Trial users can only book one session for the entire trial duration.');
        }
        
        activeBookingsRemaining = Math.max(0, this.TRIAL_LIFETIME_LIMIT - validHistory.length);
      } 
      
      // === CASE 2: ACTIVE USERS ===
      else if (subStatus === 'active') {
        const limits = this.getActivePlanLimits(userPlan); // Use the safe helper here

        maxActiveBookings = limits.maxActive;
        monthlyLimit = limits.monthlyLimit;
        
        // Session Type Check
        if (limits.canAccessAllTypes) {
           canAccessSessionType = true;
        } else {
           canAccessSessionType = session.type === SessionType.STANDARD;
           if (!canAccessSessionType) {
             reasons.push('Standard plans can only access Standard sessions. Upgrade to Premium for access.');
           }
        }

        // Active Limit Check
        if (activeBookings.length >= maxActiveBookings) {
           reasons.push(`${userPlan === 'premium' ? 'Premium' : 'Standard'} users can only have ${maxActiveBookings} active upcoming sessions at a time.`);
        }

        // Monthly Limit Check
        if (monthlyLimit !== null) {
          const sessionYear = session.scheduledAt.getUTCFullYear();
          const sessionMonth = session.scheduledAt.getUTCMonth() + 1;
          
          monthlyBookingCount = await this.bookingRepository.countMonthlyStandardSessionBookings(
            userId,
            sessionYear,
            sessionMonth
          );

          if (monthlyBookingCount >= monthlyLimit) {
            reasons.push(`Monthly booking limit reached (${monthlyLimit}) for this month.`);
          }
          remainingMonthlyBookings = Math.max(0, monthlyLimit - monthlyBookingCount);
        }
        
        activeBookingsRemaining = Math.max(0, maxActiveBookings - activeBookings.length);
      } 
      
      else {
        reasons.push('Your subscription is not in a valid state for booking.');
      }
    }

    return {
      canBook: reasons.length === 0,
      reasons,
      validationDetails: {
        userPlan,
        hasActiveSubscription,
        activeBookingsCount: activeBookings.length,
        maxActiveBookings,
        activeBookingsRemaining,
        monthlyBookingCount,
        monthlyBookingLimit: monthlyLimit,
        remainingMonthlyBookings,
        currentMonth: this.getCurrentMonthString(),
        sessionMonth: this.getMonthString(session.scheduledAt),
        hoursUntilSession,
        meetsMinimumNotice,
        canAccessSessionType,
        sessionType: session.type,
        hasEnoughPoints,
        spotsAvailable,
        isSessionActive: session.isActive,
        isAlreadyBooked
      }
    };
  }

  // ... (Empty helpers remain the same)
  private getEmptyBookingLimits(): BookingLimitsInfo {
    return {
        userPlan: null,
        hasActiveSubscription: false,
        activeBookingsCount: 0,
        maxActiveBookings: 0,
        activeBookingsRemaining: 0,
        monthlyBookingCount: 0,
        monthlyBookingLimit: null,
        remainingMonthlyBookings: null,
        currentMonth: this.getCurrentMonthString()
    };
  }

  private getEmptyValidationDetails() {
    return {
      userPlan: null,
      hasActiveSubscription: false,
      activeBookingsCount: 0,
      maxActiveBookings: 0,
      activeBookingsRemaining: 0,
      monthlyBookingCount: 0,
      monthlyBookingLimit: null,
      remainingMonthlyBookings: null,
      currentMonth: this.getCurrentMonthString(),
      sessionMonth: this.getCurrentMonthString(),
      hoursUntilSession: 0,
      meetsMinimumNotice: false,
      canAccessSessionType: false,
      sessionType: SessionType.STANDARD,
      hasEnoughPoints: false,
      spotsAvailable: 0,
      isSessionActive: false,
      isAlreadyBooked: false
    };
  }
}