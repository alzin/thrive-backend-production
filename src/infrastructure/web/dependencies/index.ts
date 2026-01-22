// backend/src/infrastructure/web/dependencies/index.ts

// This file is responsible for setting up and exporting all dependencies
// such as repositories, services, use cases, and controllers.

// ========== REPOSITORIES (21) ==========
import { AnnouncementLikeRepository } from "../../database/repositories/AnnouncementLikeRepository";
import { AnnouncementRepository } from "../../database/repositories/AnnouncementRepository";
import { BookingRepository } from "../../database/repositories/BookingRepository";
import { CommentRepository } from "../../database/repositories/CommentRepository";
import { CourseRepository } from "../../database/repositories/CourseRepository";
import { EnrollmentRepository } from "../../database/repositories/EnrollmentRepository";
import { FeedbackLikeRepository } from "../../database/repositories/FeedbackLikeRepository";
import { FeedbackRepository } from "../../database/repositories/FeedbackRepository";
import { KeywordRepository } from "../../database/repositories/KeywordRepository";
import { LessonRepository } from "../../database/repositories/LessonRepository";
import { PostLikeRepository } from "../../database/repositories/PostLikeRepository";
import { PostRepository } from "../../database/repositories/PostRepository";
import { ProfileRepository } from "../../database/repositories/ProfileRepository";
import { ProgressRepository } from "../../database/repositories/ProgressRepository";
import { RecentActivityRepository } from "../../database/repositories/RecentActivityRepository";
import { SessionRepository } from "../../database/repositories/SessionRepository";
import { SubscriptionRepository } from "../../database/repositories/SubscriptionRepository";
import { UserRepository } from "../../database/repositories/UserRepository";
import { VideoRepository } from "../../database/repositories/VideoRepository";

// ========== SERVICES (9) ==========
import { ActivityService } from "../../services/ActivityService";
import { EmailService } from "../../services/EmailService";
import { ResendEmailService } from "../../services/ResendEmailService";
import { PaymentService } from "../../services/PaymentService";
import { PasswordService } from "../../services/PasswordService";
import { TokenService } from "../../services/TokenService";
import { S3StorageService } from "../../services/S3StorageService";
import { BookingValidationService } from "../../services/BookingValidationService";

// ========== USE CASES (47) ==========

// Activity Use Cases
import { GetUserActivitiesUseCase } from "../../../application/use-cases/activity/GetUserActivitiesUseCase";
import { GetGlobalActivitiesUseCase } from "../../../application/use-cases/activity/GetGlobalActivitiesUseCase";
import { GetMyRecentActivitiesUseCase } from "../../../application/use-cases/activity/GetMyRecentActivitiesUseCase";

// Admin Use Cases - User Management
import { GetUsersUseCase } from "../../../application/use-cases/admin/user-managment/GetUsersUseCase";
import { UpdateUserStatusUseCase } from "../../../application/use-cases/admin/user-managment/UpdateUserStatusUseCase";
import { ManagePointsUseCase } from "../../../application/use-cases/admin/user-managment/ManagePointsUseCase";

// Admin Use Cases - Course Management
import { CreateCourseUseCase } from "../../../application/use-cases/admin/course-managment/CreateCourseUseCase";
import { UpdateCourseUseCase } from "../../../application/use-cases/admin/course-managment/UpdateCourseUseCase";
import { DeleteCourseUseCase } from "../../../application/use-cases/admin/course-managment/DeleteCourseUseCase";

// Admin Use Cases - Lesson Management
import { CreateLessonUseCase } from "../../../application/use-cases/admin/lesson-managment/CreateLessonUseCase";
import { UpdateLessonUseCase } from "../../../application/use-cases/admin/lesson-managment/UpdateLessonUseCase";
import { DeleteLessonUseCase } from "../../../application/use-cases/admin/lesson-managment/DeleteLessonUseCase";
import { GetLessonWithKeywordsUseCase } from "../../../application/use-cases/admin/lesson-managment/GetLessonWithKeywordsUseCase";

// Admin Use Cases - Session Management
import { CreateSingleSessionUseCase } from "../../../application/use-cases/admin/session-managment/CreateSingleSessionUseCase";
import { DeleteSessionUseCase } from "../../../application/use-cases/admin/session-managment/DeleteSessionUseCase";
import { CreateRecurringSessionUseCase } from "../../../application/use-cases/admin/session-managment/CreateRecurringSessionUseCase";
import { UpdateSessionUseCase } from "../../../application/use-cases/admin/session-managment/UpdateSessionUseCase";
import { GetSessionsWithPaginationUseCase } from "../../../application/use-cases/admin/session-managment/GetSessionsWithPaginationUseCase";
import { GetRecurringSessionDetailsUseCase } from "../../../application/use-cases/admin/session-managment/GetRecurringSessionDetailsUseCase";

// Admin Use Cases - Post Management
import { GetFlaggedPostsUseCase } from "../../../application/use-cases/admin/post-managment/GetFlaggedPostsUseCase";
import { DeletePostUseCase } from "../../../application/use-cases/admin/post-managment/DeletePostUseCase";
import { UnflagPostUseCase } from "../../../application/use-cases/admin/post-managment/UnflagPostUseCase";

// Admin Use Cases - Analytics
import { GetAnalyticsOverviewUseCase } from "../../../application/use-cases/admin/analytics-managment/GetAnalyticsOverviewUseCase";
import { GetRevenueAnalyticsUseCase } from "../../../application/use-cases/admin/analytics-managment/GetRevenueAnalyticsUseCase";
import { GetEngagementAnalyticsUseCase } from "../../../application/use-cases/admin/analytics-managment/GetEngagementAnalyticsUseCase";


// Announcement Use Cases
import { CreateAnnouncementUseCase } from "../../../application/use-cases/announcement/CreateAnnouncementUseCase";
import { ToggleAnnouncementLikeUseCase } from "../../../application/use-cases/announcement/ToggleAnnouncementLikeUseCase";
import { GetAnnouncementsUseCase } from "../../../application/use-cases/announcement/GetAnnouncementsUseCase";
import { GetAnnouncementByIdUseCase } from "../../../application/use-cases/announcement/GetAnnouncementByIdUseCase";
import { DeleteAnnouncementUseCase } from "../../../application/use-cases/announcement/DeleteAnnouncementUseCase";
import { UpdateAnnouncementUseCase } from "../../../application/use-cases/announcement/UpdateAnnouncementUseCase";
import { UpdateAnnouncementCommentUseCase } from "../../../application/use-cases/announcement/UpdateAnnouncementCommentUseCase";
import { GetAnnouncementCommentCountUseCase } from "../../../application/use-cases/announcement/GetAnnouncementCommentCountUseCase";
import { DeleteAnnouncementCommentUseCase } from "../../../application/use-cases/announcement/DeleteAnnouncementCommentUseCase";

// Auth Use Cases
import { LoginUseCase } from "../../../application/use-cases/auth/LoginUseCase";
import { RefreshTokenUseCase } from "../../../application/use-cases/auth/RefreshTokenUseCase";
import { RegisterUserUseCase } from "../../../application/use-cases/auth/RegisterUserUseCase";
import { RegisterWithVerificationUseCase } from "../../../application/use-cases/auth/RegisterWithVerificationUseCase";
import { RequestPasswordResetUseCase } from "../../../application/use-cases/auth/RequestPasswordResetUseCase";
import { ResendVerificationCodeUseCase } from "../../../application/use-cases/auth/ResendVerificationCodeUseCase";
import { ResetPasswordUseCase } from "../../../application/use-cases/auth/ResetPasswordUseCase";
import { VerifyEmailUseCase } from "../../../application/use-cases/auth/VerifyEmailUseCase";

import { CheckAuthUseCase } from "../../../application/use-cases/auth/CheckAuthUseCase";
import { ValidateResetTokenUseCase } from "../../../application/use-cases/auth/ValidateResetTokenUseCase";
import { VerifyEmailWithCodeUseCase } from "../../../application/use-cases/auth/VerifyEmailWithCodeUseCase";

// Booking Use Cases
import { CancelBookingUseCase } from "../../../application/use-cases/booking/CancelBookingUseCase";
import { CreateBookingUseCase } from "../../../application/use-cases/booking/CreateBookingUseCase";
import { GetMyBookingsUseCase } from "../../../application/use-cases/booking/GetMyBookingsUseCase";
import { GetBookingLimitsUseCase } from "../../../application/use-cases/booking/GetBookingLimitsUseCase";

// Calendar Use Cases
import { GetCalendarSessionsUseCase } from "../../../application/use-cases/calendar/GetCalendarSessionsUseCase";
import { GetSessionsByDayUseCase } from "../../../application/use-cases/calendar/GetSessionsByDayUseCase";
import { CheckBookingEligibilityUseCase } from "../../../application/use-cases/calendar/CheckBookingEligibilityUseCase";
import { GetUpcomingBookingsUseCase } from "../../../application/use-cases/calendar/GetUpcomingBookingsUseCase";
import { GetSessionAttendeesUseCase } from "../../../application/use-cases/calendar/GetSessionAttendeesUseCase";

// Comment Use Cases 
import { GetCommentsByPostUseCase } from "../../../application/use-cases/comment/GetCommentsByPostUseCase";
import { GetCommentWithRepliesUseCase } from "../../../application/use-cases/comment/GetCommentWithRepliesUseCase";
import { GetCommentByIdUseCase } from "../../../application/use-cases/comment/GetCommentByIdUseCase";
import { UpdateCommentUseCase } from "../../../application/use-cases/comment/UpdateCommentUseCase";
import { DeleteCommentUseCase } from "../../../application/use-cases/comment/DeleteCommentUseCase";
import { GetRepliesUseCase } from "../../../application/use-cases/comment/GetRepliesUseCase";
import { GetCommentCountUseCase } from "../../../application/use-cases/comment/GetCommentCountUseCase";

// Community Use Cases
import { CreateCommentUseCase } from "../../../application/use-cases/community/CreateCommentUseCase";
import { CreatePostUseCase } from "../../../application/use-cases/community/CreatePostUseCase";
import { GetCommentsUseCase } from "../../../application/use-cases/community/GetCommentsUseCase";
import { ToggleLikeUseCase } from "../../../application/use-cases/community/ToggleLikeUseCase";
import { UploadMediaUseCase } from "../../../application/use-cases/community/UploadMediaUseCase";
import { DeleteMediaUseCase } from "../../../application/use-cases/community/DeleteMediaUseCase";
import { GetPostsUseCase } from "../../../application/use-cases/community/GetPostsUseCase";
import { DeletePostUseCase as CommunityDeletePostUseCase } from "../../../application/use-cases/community/DeletePostUseCase";
import { EditPostUseCase } from "../../../application/use-cases/community/EditPostUseCase";
import { UpdateCommentUseCase as CommunityUpdateCommentUseCase } from "../../../application/use-cases/community/UpdateCommentUseCase";
import { GetCommentByIdUseCase as CommunityGetCommentByIdUseCase } from "../../../application/use-cases/community/GetCommentByIdUseCase";
import { DeleteCommentUseCase as CommunityDeleteCommentUseCase } from "../../../application/use-cases/community/DeleteCommentUseCase";
import { GetRepliesUseCase as CommunityGetRepliesUseCase } from "../../../application/use-cases/community/GetRepliesUseCase";
import { GetCommentCountUseCase as CommunityGetCommentCountUseCase } from "../../../application/use-cases/community/GetCommentCountUseCase";
import { CreateCommentForAllUseCase } from "../../../application/use-cases/community/CreateCommentForAllUseCase";

// Course Use Cases
import { EnrollInCourseUseCase } from "../../../application/use-cases/course/EnrollInCourseUseCase";
import { GetAllCoursesUseCase } from "../../../application/use-cases/course/GetAllCoursesUseCase";
import { GetCourseByIdUseCase } from "../../../application/use-cases/course/GetCourseByIdUseCase";
import { GetCourseLessonsUseCase } from "../../../application/use-cases/course/GetCourseLessonsUseCase";
import { GetMyEnrollmentsUseCase } from "../../../application/use-cases/course/GetMyEnrollmentsUseCase";
import { CheckEnrollmentUseCase } from "../../../application/use-cases/course/CheckEnrollmentUseCase";
import { GetLessonByIdUseCase } from "../../../application/use-cases/course/GetLessonByIdUseCase";
import { CompleteLessonUseCase } from "../../../application/use-cases/course/CompleteLessonUseCase";

// Dashboard Use Cases
import { GetDashboardDataUseCase } from "../../../application/use-cases/dashboard/GetDashboardDataUseCase";

// Feedback Use Cases
import { CreateFeedbackUseCase } from "../../../application/use-cases/feedback/CreateFeedbackUseCase";
import { GetFeedbackListUseCase } from "../../../application/use-cases/feedback/GetFeedbackListUseCase";
import { ToggleFeedbackLikeUseCase } from "../../../application/use-cases/feedback/ToggleFeedbackLikeUseCase";
import { UploadMediaUseCase as FeedbackUploadMediaUseCase } from "../../../application/use-cases/feedback/UploadMediaUseCase";
import { DeleteMediaUseCase as FeedbackDeleteMediaUseCase } from "../../../application/use-cases/feedback/DeleteMediaUseCase";
import { GetFeedbackByIdUseCase } from "../../../application/use-cases/feedback/GetFeedbackByIdUseCase";
import { UpdateFeedbackUseCase } from "../../../application/use-cases/feedback/UpdateFeedbackUseCase";
import { DeleteFeedbackUseCase } from "../../../application/use-cases/feedback/DeleteFeedbackUseCase";
import { GetCommentsByFeedbackUseCase } from "../../../application/use-cases/feedback/GetCommentsByFeedbackUseCase";
import { CreateCommentOnFeedbackUseCase } from "../../../application/use-cases/feedback/CreateCommentOnFeedbackUseCase";
import { GetCommentCountUseCase as FeedbackGetCommentCountUseCase } from "../../../application/use-cases/feedback/GetCommentCountUseCase";

// Payment Use Cases
import { CreatePaymentIntentUseCase } from "../../../application/use-cases/payment/CreatePaymentIntentUseCase";
import { CreateCheckoutSessionUseCase } from "../../../application/use-cases/payment/CreateCheckoutSessionUseCase";
import { VerifyCheckoutSessionUseCase } from "../../../application/use-cases/payment/VerifyCheckoutSessionUseCase";
import { CreateCustomerPortalUseCase } from "../../../application/use-cases/payment/CreateCustomerPortalUseCase";
import { CheckDiscountEligibilityUseCase } from "../../../application/use-cases/payment/CheckDiscountEligibilityUseCase";
import { EndTrialUseCase } from "../../../application/use-cases/payment/EndTrialUseCase";
import { HandleWebhookUseCase } from "../../../application/use-cases/payment/HandleWebhookUseCase";

// Profile Use Cases
import { GetMyProfileUseCase } from "../../../application/use-cases/profile/GetMyProfileUseCase";
import { UpdateProfileUseCase } from "../../../application/use-cases/profile/UpdateProfileUseCase";
import { UploadProfilePhotoUseCase } from "../../../application/use-cases/profile/UploadProfilePhotoUseCase";
import { DeleteProfilePhotoUseCase } from "../../../application/use-cases/profile/DeleteProfilePhotoUseCase";
import { GetUserProfileUseCase } from "../../../application/use-cases/profile/GetUserProfileUseCase";

// Public Profile Use Cases
import { GetPublicProfileUseCase } from "../../../application/use-cases/publicProfile/GetPublicProfileUseCase";

// Session Use Cases
import { GetUpcomingSessionsUseCase } from "../../../application/use-cases/session/GetUpcomingSessionsUseCase";
import { GetSessionByIdUseCase } from "../../../application/use-cases/session/GetSessionByIdUseCase";
import { GetSessionsByDateRangeUseCase } from "../../../application/use-cases/session/GetSessionsByDateRangeUseCase";
import { GetAllSessionsUseCase } from "../../../application/use-cases/session/GetAllSessionsUseCase";

// User Use Cases
import { GetUserProfileUseCase as UserGetUserProfileUseCase } from "../../../application/use-cases/user/GetUserProfileUseCase";
import { SearchUsersUseCase } from "../../../application/use-cases/user/SearchUsersUseCase";
import { BlockUserUseCase } from "../../../application/use-cases/user/BlockUserUseCase";
import { UnblockUserUseCase } from "../../../application/use-cases/user/UnblockUserUseCase";

// Subscription Use Cases
import { CheckUserSubscriptionUseCase } from "../../../application/use-cases/subscription/CheckUserSubscriptionUseCase";
import { HandleSubscriptionWebhookUseCase } from "../../../application/use-cases/subscription/HandleSubscriptionWebhookUseCase";

// Video Use Cases
import { CheckTourVideoStatusUseCase } from "../../../application/use-cases/video/CheckTourVideoStatusUseCase";
import { CreateOrUpdateVideoUseCase } from "../../../application/use-cases/video/CreateOrUpdateVideoUseCase";
import { DeleteVideoUseCase } from "../../../application/use-cases/video/DeleteVideoUseCase";
import { GetVideoUseCase } from "../../../application/use-cases/video/GetVideosUseCase";
import { MarkTourVideoViewedUseCase } from "../../../application/use-cases/video/MarkTourVideoViewedUseCase";

// ========== CONTROLLERS (18) ==========
import { ActivityController } from "../controllers/activity.controller";
import { AdminController } from "../controllers/admin.controller";
import { AnnouncementController } from "../controllers/announcement.controller";
import { AuthController } from "../controllers/auth.controller";
import { BookingController } from "../controllers/booking.controller";
import { CalendarController } from "../controllers/calendar.controller";
import { CommentController } from "../controllers/comment.controller";
import { CommunityController } from "../controllers/community.controller";
import { CourseController } from "../controllers/course.controller";
import { DashboardController } from "../controllers/dashboard.controller";
import { FeedbackController } from "../controllers/feedback.controller";
import { PaymentController } from "../controllers/payment.controller";
import { ProfileController } from "../controllers/profile.controller";
import { PublicProfileController } from "../controllers/publicProfile.controller";
import { SessionController } from "../controllers/session.controller";
import { SubscriptionController } from "../controllers/subscription.controller";
import { UserController } from "../controllers/user.controller";
import { VideoController } from "../controllers/video.controller";

// Dependency Container Interface
export interface DependencyContainer {
    // Repositories
    repositories: {
        announcementLike: AnnouncementLikeRepository;
        announcement: AnnouncementRepository;
        booking: BookingRepository;
        comment: CommentRepository;
        course: CourseRepository;
        enrollment: EnrollmentRepository;
        feedbackLike: FeedbackLikeRepository;
        feedback: FeedbackRepository;
        keyword: KeywordRepository;
        lesson: LessonRepository;
        postLike: PostLikeRepository;
        post: PostRepository;
        profile: ProfileRepository;
        progress: ProgressRepository;
        recentActivity: RecentActivityRepository;
        session: SessionRepository;
        subscription: SubscriptionRepository;
        user: UserRepository;
        video: VideoRepository;
    };

    // Services
    services: {
        activity: ActivityService;
        // email: EmailService;
        email: ResendEmailService;
        payment: PaymentService;
        password: PasswordService;
        token: TokenService;
        s3Storage: S3StorageService;
        bookingValidation: BookingValidationService;
    };

    // Use Cases
    useCases: {

        // Activity
        getUserActivities: GetUserActivitiesUseCase;
        getGlobalActivities: GetGlobalActivitiesUseCase;
        getMyRecentActivities: GetMyRecentActivitiesUseCase;

        // Admin - User Management
        getUsers: GetUsersUseCase;
        updateUserStatus: UpdateUserStatusUseCase;
        managePoints: ManagePointsUseCase;

        // Admin - Course Management
        createCourse: CreateCourseUseCase;
        updateCourse: UpdateCourseUseCase;
        deleteCourse: DeleteCourseUseCase;

        // Admin - Lesson Management
        createLesson: CreateLessonUseCase;
        updateLesson: UpdateLessonUseCase;
        deleteLesson: DeleteLessonUseCase;
        getLessonWithKeywords: GetLessonWithKeywordsUseCase;

        // Admin - Session Management
        createSingleSession: CreateSingleSessionUseCase;
        createRecurringSession: CreateRecurringSessionUseCase;
        updateSession: UpdateSessionUseCase;
        deleteSession: DeleteSessionUseCase;
        getSessionsWithPagination: GetSessionsWithPaginationUseCase;
        getRecurringSessionDetails: GetRecurringSessionDetailsUseCase;

        // Admin - Post Management
        getFlaggedPosts: GetFlaggedPostsUseCase;
        deletePost: DeletePostUseCase;
        unflagPost: UnflagPostUseCase;

        // Admin - Analytics
        getAnalyticsOverview: GetAnalyticsOverviewUseCase;
        getRevenueAnalytics: GetRevenueAnalyticsUseCase;
        getEngagementAnalytics: GetEngagementAnalyticsUseCase;


        // Announcement
        createAnnouncement: CreateAnnouncementUseCase;
        toggleAnnouncementLike: ToggleAnnouncementLikeUseCase;
        getAnnouncements: GetAnnouncementsUseCase;
        getAnnouncementById: GetAnnouncementByIdUseCase;
        deleteAnnouncement: DeleteAnnouncementUseCase;
        updateAnnouncement: UpdateAnnouncementUseCase;
        updateAnnouncementComment: UpdateAnnouncementCommentUseCase;
        getAnnouncementCommentCount: GetAnnouncementCommentCountUseCase;
        deleteAnnouncementComment: DeleteAnnouncementCommentUseCase;

        // Auth
        login: LoginUseCase;
        refreshToken: RefreshTokenUseCase;
        registerUser: RegisterUserUseCase;
        registerWithVerification: RegisterWithVerificationUseCase;
        requestPasswordReset: RequestPasswordResetUseCase;
        resendVerificationCode: ResendVerificationCodeUseCase;
        resetPassword: ResetPasswordUseCase;
        verifyEmail: VerifyEmailUseCase;
        checkAuth: CheckAuthUseCase;
        validateResetToken: ValidateResetTokenUseCase;
        verifyEmailWithCode: VerifyEmailWithCodeUseCase;

        // Booking
        cancelBooking: CancelBookingUseCase;
        createBooking: CreateBookingUseCase;
        getMyBookings: GetMyBookingsUseCase;
        getBookingLimits: GetBookingLimitsUseCase;

        // Calendar
        getCalendarSessions: GetCalendarSessionsUseCase;
        getSessionsByDay: GetSessionsByDayUseCase;
        checkBookingEligibility: CheckBookingEligibilityUseCase;
        getUpcomingBookings: GetUpcomingBookingsUseCase;
        getSessionAttendees: GetSessionAttendeesUseCase;

        // Comment
        getCommentsByPost: GetCommentsByPostUseCase;
        getCommentWithReplies: GetCommentWithRepliesUseCase;
        getCommentById: GetCommentByIdUseCase;
        updateComment: UpdateCommentUseCase;
        deleteComment: DeleteCommentUseCase;
        getReplies: GetRepliesUseCase;
        getCommentCount: GetCommentCountUseCase;

        // Community
        createComment: CreateCommentUseCase;
        createPost: CreatePostUseCase;
        getComments: GetCommentsUseCase;
        toggleLike: ToggleLikeUseCase;
        uploadMedia: UploadMediaUseCase;
        deleteMedia: DeleteMediaUseCase;
        getPosts: GetPostsUseCase;
        communityDeletePost: CommunityDeletePostUseCase;
        editPost: EditPostUseCase;
        communityUpdateComment: CommunityUpdateCommentUseCase;
        communityGetCommentById: CommunityGetCommentByIdUseCase;
        communityDeleteComment: CommunityDeleteCommentUseCase;
        communityGetReplies: CommunityGetRepliesUseCase;
        communityGetCommentCount: CommunityGetCommentCountUseCase;
        createCommentForAll: CreateCommentForAllUseCase

        // Course
        enrollInCourse: EnrollInCourseUseCase;
        getAllCourses: GetAllCoursesUseCase;
        getCourseById: GetCourseByIdUseCase;
        getCourseLessons: GetCourseLessonsUseCase;
        getMyEnrollments: GetMyEnrollmentsUseCase;
        checkEnrollment: CheckEnrollmentUseCase;
        getLessonById: GetLessonByIdUseCase;

        // Dashboard
        getDashboardData: GetDashboardDataUseCase;

        // Feedback
        createFeedback: CreateFeedbackUseCase;
        getFeedbackList: GetFeedbackListUseCase;
        toggleFeedbackLike: ToggleFeedbackLikeUseCase;
        feedbackUploadMedia: FeedbackUploadMediaUseCase;
        feedbackDeleteMedia: FeedbackDeleteMediaUseCase;
        getFeedbackById: GetFeedbackByIdUseCase;
        updateFeedback: UpdateFeedbackUseCase;
        deleteFeedback: DeleteFeedbackUseCase;
        getCommentsByFeedback: GetCommentsByFeedbackUseCase;
        createCommentOnFeedback: CreateCommentOnFeedbackUseCase;
        feedbackGetCommentCount: FeedbackGetCommentCountUseCase;

        // Lesson
        completeLesson: CompleteLessonUseCase;

        // Payment
        createPaymentIntent: CreatePaymentIntentUseCase;
        createCheckoutSession: CreateCheckoutSessionUseCase;
        verifyCheckoutSession: VerifyCheckoutSessionUseCase;
        createCustomerPortal: CreateCustomerPortalUseCase;
        checkDiscountEligibility: CheckDiscountEligibilityUseCase;
        endTrial: EndTrialUseCase;
        handleWebhook: HandleWebhookUseCase;

        // Profile
        getMyProfile: GetMyProfileUseCase;
        updateProfile: UpdateProfileUseCase;
        uploadProfilePhoto: UploadProfilePhotoUseCase;
        deleteProfilePhoto: DeleteProfilePhotoUseCase;
        getUserProfile: GetUserProfileUseCase;

        // Public Profile
        getPublicProfile: GetPublicProfileUseCase;

        // Session
        getUpcomingSessions: GetUpcomingSessionsUseCase;
        getSessionById: GetSessionByIdUseCase;
        getSessionsByDateRange: GetSessionsByDateRangeUseCase;
        getAllSessions: GetAllSessionsUseCase;

        // Subscription
        checkUserSubscription: CheckUserSubscriptionUseCase;
        handleSubscriptionWebhook: HandleSubscriptionWebhookUseCase;

        // User
        userGetUserProfile: UserGetUserProfileUseCase;
        searchUsers: SearchUsersUseCase;
        blockUser: BlockUserUseCase;
        unblockUser: UnblockUserUseCase;

        // Video
        checkTourVideoStatus: CheckTourVideoStatusUseCase;
        createOrUpdateVideo: CreateOrUpdateVideoUseCase;
        deleteVideo: DeleteVideoUseCase;
        getVideo: GetVideoUseCase;
        markTourVideoViewed: MarkTourVideoViewedUseCase;
    };

    // Controllers
    controllers: {
        activity: ActivityController;
        admin: AdminController;
        announcement: AnnouncementController;
        auth: AuthController;
        booking: BookingController;
        calendar: CalendarController;
        comment: CommentController;
        community: CommunityController;
        course: CourseController;
        dashboard: DashboardController;
        feedback: FeedbackController;
        payment: PaymentController;
        profile: ProfileController;
        publicProfile: PublicProfileController;
        session: SessionController;
        subscription: SubscriptionController;
        user: UserController;
        video: VideoController;
    };
}

// Singleton instance
let dependencyContainer: DependencyContainer | null = null;

export const setupDependencies = (): DependencyContainer => {
    // Return existing container if already initialized
    if (dependencyContainer) {
        return dependencyContainer;
    }

    // ========== Initialize Repositories ==========
    const repositories = {
        announcementLike: new AnnouncementLikeRepository(),
        announcement: new AnnouncementRepository(),
        booking: new BookingRepository(),
        comment: new CommentRepository(),
        course: new CourseRepository(),
        enrollment: new EnrollmentRepository(),
        feedbackLike: new FeedbackLikeRepository(),
        feedback: new FeedbackRepository(),
        keyword: new KeywordRepository(),
        lesson: new LessonRepository(),
        postLike: new PostLikeRepository(),
        post: new PostRepository(),
        profile: new ProfileRepository(),
        progress: new ProgressRepository(),
        recentActivity: new RecentActivityRepository(),
        session: new SessionRepository(),
        subscription: new SubscriptionRepository(),
        user: new UserRepository(),
        video: new VideoRepository(),
    };

    // ========== Initialize Services ==========
    const services = {
        activity: new ActivityService(),
        // email: new EmailService(),
        email: new ResendEmailService(),
        payment: new PaymentService(),
        password: new PasswordService(),
        token: new TokenService(),
        s3Storage: new S3StorageService(),
        bookingValidation: new BookingValidationService(
            repositories.session,
            repositories.booking,
            repositories.subscription,
            repositories.profile
        ),
    };

    // ========== Initialize Use Cases ==========
    const useCases = {

        // Activity Use Cases
        getUserActivities: new GetUserActivitiesUseCase(
            repositories.recentActivity
        ),
        getGlobalActivities: new GetGlobalActivitiesUseCase(
            repositories.recentActivity,
            repositories.user,
            repositories.profile
        ),
        getMyRecentActivities: new GetMyRecentActivitiesUseCase(
            repositories.recentActivity
        ),

        // Admin - User Management
        getUsers: new GetUsersUseCase(
            repositories.user,
            repositories.profile,
            repositories.subscription
        ),
        updateUserStatus: new UpdateUserStatusUseCase(
            repositories.user
        ),
        managePoints: new ManagePointsUseCase(
            repositories.profile,
            repositories.user
        ),

        // Admin - Course Management
        createCourse: new CreateCourseUseCase(
            repositories.course
        ),
        updateCourse: new UpdateCourseUseCase(
            repositories.course
        ),
        deleteCourse: new DeleteCourseUseCase(
            repositories.course
        ),

        // Admin - Lesson Management
        createLesson: new CreateLessonUseCase(
            repositories.lesson,
            repositories.keyword
        ),
        updateLesson: new UpdateLessonUseCase(
            repositories.lesson,
            repositories.keyword
        ),
        deleteLesson: new DeleteLessonUseCase(
            repositories.lesson
        ),
        getLessonWithKeywords: new GetLessonWithKeywordsUseCase(
            repositories.lesson,
            repositories.keyword
        ),

        // Admin - Session Management
        createSingleSession: new CreateSingleSessionUseCase(
            repositories.session
        ),
        createRecurringSession: new CreateRecurringSessionUseCase(
            repositories.session,
            repositories.user
        ),
        updateSession: new UpdateSessionUseCase(
            repositories.session
        ),
        deleteSession: new DeleteSessionUseCase(
            repositories.session,
            repositories.user
        ),
        getSessionsWithPagination: new GetSessionsWithPaginationUseCase(
            repositories.session,
            repositories.user,
            repositories.profile
        ),
        getRecurringSessionDetails: new GetRecurringSessionDetailsUseCase(
            repositories.session
        ),

        // Admin - Post Management
        getFlaggedPosts: new GetFlaggedPostsUseCase(
            repositories.post
        ),
        deletePost: new DeletePostUseCase(
            repositories.post
        ),
        unflagPost: new UnflagPostUseCase(),

        // Admin - Analytics
        getAnalyticsOverview: new GetAnalyticsOverviewUseCase(
            repositories.user,
            repositories.profile,
            repositories.progress,
            repositories.course,
            repositories.lesson
        ),
        getRevenueAnalytics: new GetRevenueAnalyticsUseCase(),
        getEngagementAnalytics: new GetEngagementAnalyticsUseCase(
            repositories.progress,
            repositories.post,
            repositories.user
        ),

        // Announcement Use Cases
        createAnnouncement: new CreateAnnouncementUseCase(
            repositories.announcement,
            repositories.user,
            repositories.profile,
            services.activity
        ),
        toggleAnnouncementLike: new ToggleAnnouncementLikeUseCase(
            repositories.announcement,
            repositories.announcementLike
        ),
        getAnnouncements: new GetAnnouncementsUseCase(
            repositories.announcement
        ),
        getAnnouncementById: new GetAnnouncementByIdUseCase(
            repositories.announcement
        ),
        deleteAnnouncement: new DeleteAnnouncementUseCase(
            repositories.announcement
        ),
        updateAnnouncement: new UpdateAnnouncementUseCase(
            repositories.announcement
        ),
        updateAnnouncementComment: new UpdateAnnouncementCommentUseCase(
            repositories.comment,
            repositories.user,
            repositories.profile
        ),
        getAnnouncementCommentCount: new GetAnnouncementCommentCountUseCase(
            repositories.comment
        ),
        deleteAnnouncementComment: new DeleteAnnouncementCommentUseCase(
            repositories.comment,
            repositories.announcement
        ),

        // Auth Use Cases 
        login: new LoginUseCase(
            repositories.user,
            services.password,
            services.token
        ),
        refreshToken: new RefreshTokenUseCase(
            repositories.user,
            services.token
        ),
        registerUser: new RegisterUserUseCase(
            repositories.user,
            repositories.profile,
            services.email,
            services.password,
        ),
        registerWithVerification: new RegisterWithVerificationUseCase(
            repositories.user,
            services.password,
            services.email,
            repositories.profile
        ),
        requestPasswordReset: new RequestPasswordResetUseCase(
            repositories.user,
            services.email,
            services.token
        ),
        resendVerificationCode: new ResendVerificationCodeUseCase(
            repositories.user,
            services.email
        ),
        resetPassword: new ResetPasswordUseCase(
            repositories.user,
            services.password,
            services.token
        ),
        verifyEmail: new VerifyEmailUseCase(
            repositories.user,
            services.token
        ),

        checkAuth: new CheckAuthUseCase(
            services.token
        ),
        validateResetToken: new ValidateResetTokenUseCase(
            services.token,
            repositories.user
        ),
        verifyEmailWithCode: new VerifyEmailWithCodeUseCase(
            repositories.user,
            services.token
        ),

        // Booking Use Cases
        cancelBooking: new CancelBookingUseCase(
            repositories.session,
            repositories.booking,
            repositories.profile
        ),
        createBooking: new CreateBookingUseCase(
            repositories.session,
            repositories.booking,
            repositories.profile,
            services.activity,
            services.bookingValidation
        ),
        getMyBookings: new GetMyBookingsUseCase(
            repositories.booking
        ),
        getBookingLimits: new GetBookingLimitsUseCase(
            services.bookingValidation
        ),

        // Calendar Use Cases
        getCalendarSessions: new GetCalendarSessionsUseCase(
            repositories.session,
            repositories.booking
        ),
        getSessionsByDay: new GetSessionsByDayUseCase(
            repositories.session,
            repositories.booking
        ),
        checkBookingEligibility: new CheckBookingEligibilityUseCase(
            repositories.session,
            repositories.profile,
            services.bookingValidation
        ),
        getUpcomingBookings: new GetUpcomingBookingsUseCase(
            repositories.booking,
            repositories.session
        ),
        getSessionAttendees: new GetSessionAttendeesUseCase(
            repositories.booking,
            repositories.profile
        ),

        // Comment Use Cases
        getCommentsByPost: new GetCommentsByPostUseCase(
            new GetCommentsUseCase(
                repositories.comment,
                repositories.user,
                repositories.profile
            ),
            repositories.comment
        ),
        getCommentWithReplies: new GetCommentWithRepliesUseCase(
            repositories.comment,
            repositories.user,
            repositories.profile
        ),
        getCommentById: new GetCommentByIdUseCase(
            repositories.comment,
            repositories.user,
            repositories.profile
        ),
        updateComment: new UpdateCommentUseCase(
            repositories.comment,
            repositories.user,
            repositories.profile
        ),
        deleteComment: new DeleteCommentUseCase(
            repositories.comment
        ),
        getReplies: new GetRepliesUseCase(
            repositories.comment,
            repositories.user,
            repositories.profile
        ),
        getCommentCount: new GetCommentCountUseCase(
            repositories.comment
        ),

        // Community Use Cases
        createComment: new CreateCommentUseCase(
            repositories.comment,
            repositories.post, // Default to post repository, can be switched to announcement
            repositories.user,
            repositories.profile,
            repositories.subscription
        ),
        createPost: new CreatePostUseCase(
            repositories.post,
            repositories.user,
            repositories.profile,
            repositories.subscription,
            services.activity
        ),
        getComments: new GetCommentsUseCase(
            repositories.comment,
            repositories.user,
            repositories.profile
        ),
        toggleLike: new ToggleLikeUseCase(
            repositories.post,
            repositories.postLike
        ),
        uploadMedia: new UploadMediaUseCase(
            services.s3Storage
        ),
        deleteMedia: new DeleteMediaUseCase(
            services.s3Storage
        ),
        getPosts: new GetPostsUseCase(
            repositories.post
        ),
        communityDeletePost: new CommunityDeletePostUseCase(
            repositories.post,
            repositories.user,
            services.s3Storage
        ),
        editPost: new EditPostUseCase(
            repositories.post,
            services.s3Storage
        ),
        communityUpdateComment: new CommunityUpdateCommentUseCase(
            repositories.comment,
            repositories.user,
            repositories.profile
        ),
        communityGetCommentById: new CommunityGetCommentByIdUseCase(
            repositories.comment,
            repositories.user,
            repositories.profile
        ),
        communityDeleteComment: new CommunityDeleteCommentUseCase(
            repositories.comment
        ),
        communityGetReplies: new CommunityGetRepliesUseCase(
            repositories.comment,
            repositories.user,
            repositories.profile
        ),
        communityGetCommentCount: new CommunityGetCommentCountUseCase(
            repositories.comment
        ),

        createCommentForAll: new CreateCommentForAllUseCase(
            repositories.post,
            repositories.user,
            repositories.profile,
            repositories.comment,
        ),

        // Course Use Cases
        enrollInCourse: new EnrollInCourseUseCase(
            repositories.course,
            repositories.enrollment,
            repositories.user
        ),
        getAllCourses: new GetAllCoursesUseCase(
            repositories.course
        ),
        getCourseById: new GetCourseByIdUseCase(
            repositories.course
        ),
        getCourseLessons: new GetCourseLessonsUseCase(
            repositories.lesson,
            repositories.progress,
            repositories.keyword
        ),
        getMyEnrollments: new GetMyEnrollmentsUseCase(
            repositories.enrollment,
            repositories.course
        ),
        checkEnrollment: new CheckEnrollmentUseCase(
            repositories.enrollment
        ),
        getLessonById: new GetLessonByIdUseCase(
            repositories.lesson,
            repositories.keyword,
            repositories.progress
        ),

        // Dashboard Use Cases
        getDashboardData: new GetDashboardDataUseCase(
            repositories.user,
            repositories.profile,
            repositories.progress,
            repositories.course,
            repositories.lesson,
            repositories.post,
            repositories.session,
            repositories.booking,
            repositories.enrollment,
            repositories.recentActivity
        ),

        // Feedback Use Cases
        createFeedback: new CreateFeedbackUseCase(
            repositories.feedback,
            repositories.user,
            repositories.profile
        ),
        getFeedbackList: new GetFeedbackListUseCase(
            repositories.feedback
        ),
        toggleFeedbackLike: new ToggleFeedbackLikeUseCase(
            repositories.feedback,
            repositories.feedbackLike
        ),
        feedbackUploadMedia: new FeedbackUploadMediaUseCase(
            services.s3Storage
        ),
        feedbackDeleteMedia: new FeedbackDeleteMediaUseCase(
            services.s3Storage
        ),
        getFeedbackById: new GetFeedbackByIdUseCase(
            repositories.feedback
        ),
        updateFeedback: new UpdateFeedbackUseCase(
            repositories.feedback,
            services.s3Storage
        ),
        deleteFeedback: new DeleteFeedbackUseCase(
            repositories.feedback,
            services.s3Storage
        ),
        getCommentsByFeedback: new GetCommentsByFeedbackUseCase(
            new GetCommentsUseCase(
                repositories.comment,
                repositories.user,
                repositories.profile
            ),
            repositories.comment
        ),
        createCommentOnFeedback: new CreateCommentOnFeedbackUseCase(
            new CreateCommentUseCase(
                repositories.comment,
                repositories.feedback, // FeedbackRepository implements ICommentableRepository
                repositories.user,
                repositories.profile,
                repositories.subscription
            )
        ),
        feedbackGetCommentCount: new FeedbackGetCommentCountUseCase(
            repositories.comment
        ),

        // Lesson Use Cases
        completeLesson: new CompleteLessonUseCase(
            repositories.lesson,
            repositories.progress,
            repositories.profile,
            services.activity
        ),

        // Payment Use Cases
        createPaymentIntent: new CreatePaymentIntentUseCase(
            services.payment
        ),
        createCheckoutSession: new CreateCheckoutSessionUseCase(
            services.payment,
            repositories.subscription
        ),
        verifyCheckoutSession: new VerifyCheckoutSessionUseCase(
            services.payment
        ),
        createCustomerPortal: new CreateCustomerPortalUseCase(
            services.payment,
            repositories.subscription
        ),
        checkDiscountEligibility: new CheckDiscountEligibilityUseCase(
            repositories.subscription
        ),
        endTrial: new EndTrialUseCase(
            services.payment,
            repositories.subscription
        ),
        handleWebhook: new HandleWebhookUseCase(
            services.payment,
            repositories.subscription,
            repositories.user
        ),

        // Profile Use Cases
        getMyProfile: new GetMyProfileUseCase(
            repositories.profile
        ),
        updateProfile: new UpdateProfileUseCase(
            repositories.profile
        ),
        uploadProfilePhoto: new UploadProfilePhotoUseCase(
            repositories.profile,
            services.s3Storage
        ),
        deleteProfilePhoto: new DeleteProfilePhotoUseCase(
            repositories.profile,
            services.s3Storage
        ),
        getUserProfile: new GetUserProfileUseCase(
            repositories.profile
        ),

        // Public Profile Use Cases
        getPublicProfile: new GetPublicProfileUseCase(
            repositories.profile,
            repositories.user,
            repositories.progress,
            repositories.post,
            repositories.lesson,
            repositories.course,
            repositories.enrollment,
            repositories.booking,
            repositories.recentActivity
        ),

        // Session Use Cases
        getUpcomingSessions: new GetUpcomingSessionsUseCase(
            repositories.session,
            repositories.user,
            repositories.profile
        ),
        getSessionById: new GetSessionByIdUseCase(
            repositories.session,
            repositories.user,
            repositories.profile
        ),
        getSessionsByDateRange: new GetSessionsByDateRangeUseCase(
            repositories.session
        ),
        getAllSessions: new GetAllSessionsUseCase(
            repositories.session,
            repositories.user,
            repositories.profile
        ),

        // Subscription Use Cases
        checkUserSubscription: new CheckUserSubscriptionUseCase(
            repositories.subscription,
            repositories.user
        ),
        handleSubscriptionWebhook: new HandleSubscriptionWebhookUseCase(
            repositories.subscription,
            repositories.user,
            services.payment
        ),

        // User Use Cases
        userGetUserProfile: new UserGetUserProfileUseCase(
            repositories.profile
        ),
        searchUsers: new SearchUsersUseCase(
            repositories.profile
        ),
        blockUser: new BlockUserUseCase(),
        unblockUser: new UnblockUserUseCase(),

        // Video Use Cases
        checkTourVideoStatus: new CheckTourVideoStatusUseCase(
            repositories.user
        ),
        createOrUpdateVideo: new CreateOrUpdateVideoUseCase(
            repositories.video,
            repositories.user
        ),
        deleteVideo: new DeleteVideoUseCase(
            repositories.video,
            repositories.user
        ),
        getVideo: new GetVideoUseCase(
            repositories.video
        ),
        markTourVideoViewed: new MarkTourVideoViewedUseCase(
            repositories.user
        )
    };

    // ========== Initialize Controllers ==========
    const controllers = {
        activity: new ActivityController(
            useCases.getUserActivities,
            useCases.getGlobalActivities,
            useCases.getMyRecentActivities
        ),
        admin: new AdminController(
            // User Management
            useCases.getUsers,
            useCases.updateUserStatus,
            useCases.managePoints,
            // Course Management
            useCases.createCourse,
            useCases.updateCourse,
            useCases.deleteCourse,
            // Lesson Management
            useCases.createLesson,
            useCases.updateLesson,
            useCases.deleteLesson,
            useCases.getLessonWithKeywords,
            // Session Management
            useCases.createSingleSession,
            useCases.createRecurringSession,
            useCases.updateSession,
            useCases.deleteSession,
            useCases.getSessionsWithPagination,
            useCases.getRecurringSessionDetails,
            // Post Management
            useCases.getFlaggedPosts,
            useCases.deletePost,
            useCases.unflagPost,
            // Analytics
            useCases.getAnalyticsOverview,
            useCases.getRevenueAnalytics,
            useCases.getEngagementAnalytics,
            // Community
            useCases.createPost
        ),
        announcement: new AnnouncementController(
            useCases.createAnnouncement,
            useCases.toggleAnnouncementLike,
            useCases.getAnnouncements,
            useCases.getAnnouncementById,
            useCases.deleteAnnouncement,
            useCases.updateAnnouncement,
            useCases.createComment,
            useCases.getComments,
            useCases.updateAnnouncementComment,
            useCases.getAnnouncementCommentCount,
            useCases.deleteAnnouncementComment
        ),
        auth: new AuthController(
            useCases.registerUser,
            useCases.login,
            useCases.refreshToken,
            useCases.requestPasswordReset,
            useCases.resetPassword,
            useCases.validateResetToken,
            useCases.registerWithVerification,
            useCases.verifyEmailWithCode,
            useCases.resendVerificationCode,
            useCases.checkAuth
        ),

        booking: new BookingController(
            useCases.createBooking,
            useCases.getMyBookings,
            useCases.cancelBooking,
            useCases.getBookingLimits
        ),
        calendar: new CalendarController(
            useCases.getCalendarSessions,
            useCases.getSessionsByDay,
            useCases.checkBookingEligibility,
            useCases.getUpcomingBookings,
            useCases.getSessionAttendees
        ),
        comment: new CommentController(
            useCases.getCommentsByPost,
            useCases.getCommentWithReplies,
            useCases.createComment,
            useCases.getCommentById,
            useCases.updateComment,
            useCases.deleteComment,
            useCases.getReplies,
            useCases.getCommentCount
        ),

        community: new CommunityController(
            // Media operations
            useCases.uploadMedia,
            useCases.deleteMedia,
            // Post operations
            useCases.createPost,
            useCases.getPosts,
            useCases.toggleLike,
            useCases.communityDeletePost,
            useCases.editPost,
            // Comment operations
            useCases.getComments,
            useCases.createCommentForAll,
            useCases.communityUpdateComment,
            useCases.communityGetCommentById,
            useCases.communityDeleteComment,
            useCases.communityGetReplies,
            useCases.communityGetCommentCount
        ),

        course: new CourseController(
            useCases.getAllCourses,
            useCases.getCourseById,
            useCases.getCourseLessons,
            useCases.completeLesson,
            useCases.enrollInCourse,
            useCases.getMyEnrollments,
            useCases.checkEnrollment,
            useCases.getLessonById
        ),

        dashboard: new DashboardController(
            useCases.getDashboardData
        ),

        feedback: new FeedbackController(
            useCases.feedbackUploadMedia,
            useCases.feedbackDeleteMedia,
            useCases.createFeedback,
            useCases.getFeedbackList,
            useCases.getFeedbackById,
            useCases.toggleFeedbackLike,
            useCases.updateFeedback,
            useCases.deleteFeedback,
            useCases.getCommentsByFeedback,
            useCases.createCommentOnFeedback,
            useCases.feedbackGetCommentCount
        ),
        payment: new PaymentController(
            useCases.createPaymentIntent,
            useCases.createCheckoutSession,
            useCases.verifyCheckoutSession,
            useCases.createCustomerPortal,
            useCases.checkDiscountEligibility,
            useCases.endTrial,
            useCases.handleWebhook
        ),
        profile: new ProfileController(
            useCases.getMyProfile,
            useCases.updateProfile,
            useCases.uploadProfilePhoto,
            useCases.deleteProfilePhoto,
            useCases.getUserProfile
        ),
        publicProfile: new PublicProfileController(
            useCases.getPublicProfile
        ),

        session: new SessionController(
            useCases.getUpcomingSessions,
            useCases.getSessionById,
            useCases.getSessionsByDateRange,
            useCases.getAllSessions
        ),
        subscription: new SubscriptionController(
            useCases.checkUserSubscription
        ),
        user: new UserController(
            useCases.userGetUserProfile,
            useCases.searchUsers,
            useCases.blockUser,
            useCases.unblockUser
        ),
        video: new VideoController(
            useCases.createOrUpdateVideo,
            useCases.getVideo,
            useCases.deleteVideo,
            useCases.checkTourVideoStatus,
            useCases.markTourVideoViewed,
        ),
    };

    // Create and cache the container
    dependencyContainer = {
        repositories,
        services,
        useCases,
        controllers,
    };

    return dependencyContainer;
};

// Export a function to get the initialized container
export const getDependencies = (): DependencyContainer => {
    if (!dependencyContainer) {
        throw new Error('Dependencies not initialized. Call setupDependencies() first.');
    }
    return dependencyContainer;
};

// Optional: Export individual getters for convenience
export const getRepositories = () => getDependencies().repositories;
export const getServices = () => getDependencies().services;
export const getUseCases = () => getDependencies().useCases;
export const getControllers = () => getDependencies().controllers;