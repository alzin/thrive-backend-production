import { UserRepository } from "../../../../infrastructure/database/repositories/UserRepository";
import { ProfileRepository } from "../../../../infrastructure/database/repositories/ProfileRepository";
import { SubscriptionRepository } from "../../../../infrastructure/database/repositories/SubscriptionRepository";

interface GetUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    roles?: string[];
    statuses?: string[];
    subscriptions?: string[];
    languageLevels?: string[];
    dateFrom?: string;
    dateTo?: string;
    pointsMin?: number;
    pointsMax?: number;
    levelMin?: number;
    levelMax?: number;
    sortField?: "joined" | "points" | "level" | "name";
    sortOrder?: "asc" | "desc";
}

export class GetUsersUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly profileRepository: ProfileRepository,
        private readonly subscriptionRepository: SubscriptionRepository,

    ) { }

    async execute(options: GetUsersOptions = {}) {
        const page = Number(options.page) > 0 ? Number(options.page) : 1;
        const limit = Number(options.limit) > 0 ? Number(options.limit) : 20;
        const search = (options.search || "").trim().toLowerCase();
        const roles = options.roles || [];
        const statuses = options.statuses || [];
        const subscriptionsFilter = options.subscriptions || [];
        const languageLevels = options.languageLevels || [];
        const sortField = options.sortField || "joined";
        const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";

        const users = await this.userRepository.findAll();
        const profiles = await this.profileRepository.findAll();
        const subscriptions = await this.subscriptionRepository.findAll();


        const usersWithProfiles = users.map(user => {
            const profile = profiles.find(p => p.userId === user.id);
            const subscription = subscriptions.find(s => s.userId === user.id);
            const isTrial = user.trialEndDate && new Date(user.trialEndDate) > new Date() ;
            // console.log(`>>> DEBUG TRIAL STATUS: User ${user.email} isTrial =`, isTrial);
            return {
                ...user,
                profile,
                subscriptionStatus: user.role === "ADMIN" ? "active" : subscription ? subscription.status : isTrial ? "trialing" : "No Subscription"
            };
        });

        const filteredUsers = usersWithProfiles
            .filter((user) => {
                const matchesSearch =
                    !search ||
                    user.email.toLowerCase().includes(search) ||
                    (user.profile?.name || "").toLowerCase().includes(search);

                const matchesRole = roles.length === 0 || roles.includes(user.role);

                const matchesStatus =
                    statuses.length === 0 ||
                    (statuses.includes("Active") && user.isActive) ||
                    (statuses.includes("Inactive") && !user.isActive);

                const matchesSubscription =
                    subscriptionsFilter.length === 0 ||
                    subscriptionsFilter.includes(user.subscriptionStatus);

                const userLanguageLevel = user.profile?.languageLevel || "N5";
                const matchesLanguage =
                    languageLevels.length === 0 ||
                    languageLevels.includes(userLanguageLevel);

                const joinedAt = new Date(user.createdAt).getTime();
                const matchesDateFrom =
                    !options.dateFrom ||
                    joinedAt >= new Date(options.dateFrom).getTime();
                const matchesDateTo =
                    !options.dateTo ||
                    joinedAt <= new Date(`${options.dateTo}T23:59:59`).getTime();

                const userPoints = user.profile?.points || 0;
                const matchesPointsMin =
                    options.pointsMin === undefined ||
                    Number.isNaN(options.pointsMin) ||
                    userPoints >= options.pointsMin;
                const matchesPointsMax =
                    options.pointsMax === undefined ||
                    Number.isNaN(options.pointsMax) ||
                    userPoints <= options.pointsMax;

                const userLevel = user.profile?.level || 1;
                const matchesLevelMin =
                    options.levelMin === undefined ||
                    Number.isNaN(options.levelMin) ||
                    userLevel >= options.levelMin;
                const matchesLevelMax =
                    options.levelMax === undefined ||
                    Number.isNaN(options.levelMax) ||
                    userLevel <= options.levelMax;

                return (
                    matchesSearch &&
                    matchesRole &&
                    matchesStatus &&
                    matchesSubscription &&
                    matchesLanguage &&
                    matchesDateFrom &&
                    matchesDateTo &&
                    matchesPointsMin &&
                    matchesPointsMax &&
                    matchesLevelMin &&
                    matchesLevelMax
                );
            })
            .sort((a, b) => {
                if (sortField === "name") {
                    const nameA = (a.profile?.name || a.email).toLowerCase();
                    const nameB = (b.profile?.name || b.email).toLowerCase();
                    return sortOrder === "asc"
                        ? nameA.localeCompare(nameB)
                        : nameB.localeCompare(nameA);
                }

                let valueA = 0;
                let valueB = 0;

                if (sortField === "points") {
                    valueA = a.profile?.points || 0;
                    valueB = b.profile?.points || 0;
                } else if (sortField === "level") {
                    valueA = a.profile?.level || 1;
                    valueB = b.profile?.level || 1;
                } else {
                    valueA = new Date(a.createdAt).getTime();
                    valueB = new Date(b.createdAt).getTime();
                }

                return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
            });

        const startIndex = (page - 1) * limit;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

        return {
            users: paginatedUsers,
            total: filteredUsers.length,
            page: page,
            totalPages: Math.ceil(filteredUsers.length / limit)
        };
    }
}