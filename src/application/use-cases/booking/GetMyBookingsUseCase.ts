import { BookingRepository } from "../../../infrastructure/database/repositories/BookingRepository";

export class GetMyBookingsUseCase {
    constructor(
        private bookingRepository: BookingRepository
    ) { }

    async execute(params: {
        userId: string;
    }) {
        const { userId } = params;

        const bookings = await this.bookingRepository.findByUserId(userId);

        return bookings;
    }
}