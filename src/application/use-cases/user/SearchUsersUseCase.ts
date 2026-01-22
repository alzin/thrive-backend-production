import { ProfileRepository } from "../../../infrastructure/database/repositories/ProfileRepository";

export interface SearchUsersRequest {
    query: string;
}

export class SearchUsersUseCase {
    constructor(private profileRepository: ProfileRepository) { }

    async execute(request: SearchUsersRequest): Promise<any[]> {
        const { query } = request;

        if (!query || typeof query !== 'string') {
            return [];
        }

        const profiles = await this.profileRepository.findAll();

        const filtered = profiles.filter(profile =>
            profile.name.toLowerCase().includes(query.toLowerCase())
        );

        return filtered;
    }
}