import { IBookingValidationService, BookingLimitsInfo } from "../../../domain/services/IBookingValidationService";

export class GetBookingLimitsUseCase {
  constructor(
    private bookingValidationService: IBookingValidationService
  ) { }

  async execute(params: { userId: string }): Promise<BookingLimitsInfo> {
    return this.bookingValidationService.getBookingLimits(params.userId);
  }
}
