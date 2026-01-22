import { UserRepository } from "../../../../infrastructure/database/repositories/UserRepository";

export class UpdateUserStatusUseCase {
    constructor(
        private readonly userRepository: UserRepository
    ) { }

    async execute(userId: string, isActive: boolean) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        user.isActive = isActive;
        user.updatedAt = new Date();
        await this.userRepository.update(user);

        return { message: 'User status updated' };
    }
}