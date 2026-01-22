import { SubscriptionPlan } from '../entities/Subscription';
import { SessionType } from '../entities/Session';

export interface BookingValidationResult {
  canBook: boolean;
  reasons: string[];
  validationDetails: {
    // Plan information
    userPlan: SubscriptionPlan | null;
    hasActiveSubscription: boolean;

    // Active bookings
    activeBookingsCount: number;
    maxActiveBookings: number;
    activeBookingsRemaining: number;

    // Monthly limits (Standard plan only)
    monthlyBookingCount: number;
    monthlyBookingLimit: number | null;
    remainingMonthlyBookings: number | null;
    currentMonth: string; // Format: "YYYY-MM"
    sessionMonth: string; // Format: "YYYY-MM" - the month of the session being booked

    // 24-hour rule
    hoursUntilSession: number;
    meetsMinimumNotice: boolean;

    // Session access
    canAccessSessionType: boolean;
    sessionType: SessionType;

    // Other
    hasEnoughPoints: boolean;
    spotsAvailable: number;
    isSessionActive: boolean;
    isAlreadyBooked: boolean;
  };
}

export interface BookingLimitsInfo {
  userPlan: SubscriptionPlan | null;
  hasActiveSubscription: boolean;
  activeBookingsCount: number;
  maxActiveBookings: number;
  activeBookingsRemaining: number;
  monthlyBookingCount: number;
  monthlyBookingLimit: number | null;
  remainingMonthlyBookings: number | null;
  currentMonth: string;
}

export interface IBookingValidationService {
  /**
   * Validates if a user can book a specific session
   */
  validateBooking(params: {
    userId: string;
    sessionId: string;
  }): Promise<BookingValidationResult>;

  /**
   * Gets the booking limits information for a user
   * Useful for displaying limits in the UI
   */
  getBookingLimits(userId: string): Promise<BookingLimitsInfo>;

  /**
   * Constants for booking limits
   */
  readonly STANDARD_PLAN_MONTHLY_LIMIT: number;
  readonly STANDARD_PLAN_ACTIVE_LIMIT: number;
  readonly PREMIUM_PLAN_ACTIVE_LIMIT: number;
  readonly MINIMUM_HOURS_NOTICE: number;
}
