import { ISessionRepository } from "../../../domain/repositories/ISessionRepository";
import { IProfileRepository } from "../../../domain/repositories/IProfileRepository";
import { IBookingValidationService } from "../../../domain/services/IBookingValidationService";

export class CheckBookingEligibilityUseCase {
    constructor(
        private sessionRepository: ISessionRepository,
        private profileRepository: IProfileRepository,
        private bookingValidationService: IBookingValidationService
    ) { }

    async execute(params: {
        sessionId: string;
        userId: string;
    }) {
        const { sessionId, userId } = params;

        // Validate booking using the comprehensive validation service
        const validationResult = await this.bookingValidationService.validateBooking({
            userId,
            sessionId
        });

        // Get session details for response
        const session = await this.sessionRepository.findById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        // Get user profile for points
        const profile = await this.profileRepository.findByUserId(userId);
        const { validationDetails } = validationResult;

        // Construct eligibility response with all relevant information
        return {
            canBook: validationResult.canBook,
            reasons: validationResult.reasons,
            session: {
                id: session.id,
                title: session.title,
                type: session.type,
                pointsRequired: session.pointsRequired,
                spotsAvailable: validationDetails.spotsAvailable,
            },
            user: {
                points: profile?.points || 0,
                activeBookings: validationDetails.activeBookingsCount,
                // Plan information
                plan: validationDetails.userPlan,
                hasActiveSubscription: validationDetails.hasActiveSubscription,
                // Active booking limits
                maxActiveBookings: validationDetails.maxActiveBookings,
                activeBookingsRemaining: validationDetails.activeBookingsRemaining,
                // Monthly limits (for Standard plan)
                monthlyBookingCount: validationDetails.monthlyBookingCount,
                monthlyBookingLimit: validationDetails.monthlyBookingLimit,
                remainingMonthlyBookings: validationDetails.remainingMonthlyBookings,
                currentMonth: validationDetails.currentMonth,
            },
            // Additional validation details for frontend
            validation: {
                meetsMinimumNotice: validationDetails.meetsMinimumNotice,
                hoursUntilSession: Math.floor(validationDetails.hoursUntilSession),
                canAccessSessionType: validationDetails.canAccessSessionType,
                isAlreadyBooked: validationDetails.isAlreadyBooked,
            }
        };
    }
}