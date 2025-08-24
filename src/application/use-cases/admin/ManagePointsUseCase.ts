import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserRole } from '../../../domain/entities/User';

export interface ManagePointsDTO {
  adminId: string;
  targetUserId: string;
  points: number; // positive to add, negative to remove
  reason: string;
}

export class ManagePointsUseCase {
  constructor(
    private profileRepository: IProfileRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: ManagePointsDTO): Promise<void> {
    // Verify admin
    const admin = await this.userRepository.findById(dto.adminId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized');
    }

    // Update target user's points
    const profile = await this.profileRepository.updatePoints(dto.targetUserId, dto.points);
    if (!profile) {
      throw new Error('User profile not found');
    }

    // TODO: Log this action for audit trail
  }
}