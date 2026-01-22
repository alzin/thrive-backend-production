export interface UnblockUserRequest {
    userId: string;
}

export class UnblockUserUseCase {
    constructor() {
        // Add necessary repositories when unblock functionality is implemented
    }

    async execute(request: UnblockUserRequest): Promise<void> {
        const { userId } = request;
        // TODO: Implement unblock logic when requirements are defined
        console.log(`Unblocking user: ${userId}`);
    }
}