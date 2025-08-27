import { IVideoRepository } from '../../../domain/repositories/IVideoRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserRole } from '../../../domain/entities/User';

export interface DeleteVideoDTO {
  userId: string;
}

export class DeleteVideoUseCase {
  constructor(
    private videoRepository: IVideoRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: DeleteVideoDTO): Promise<boolean> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new Error('Only admins can delete videos');
    }

    return await this.videoRepository.delete();
  }
}
