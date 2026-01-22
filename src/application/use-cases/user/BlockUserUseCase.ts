export interface BlockUserRequest {
    userId: string;
}

export class BlockUserUseCase {
    constructor() {
        // Add necessary repositories when block functionality is implemented
    }

    async execute(request: BlockUserRequest): Promise<void> {
        const { userId } = request;
        // TODO: Implement block logic when requirements are defined
        console.log(`Blocking user: ${userId}`);
    }
}