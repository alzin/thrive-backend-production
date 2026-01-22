// backend/src/application/use-cases/admin/DeleteSessionUseCase.ts
import { ISessionRepository } from '../../../../domain/repositories/ISessionRepository';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';

export interface DeleteSessionRequest {
  adminId: string;
  sessionId: string;
  deleteOption: 'single' | 'promote' | 'deleteAll' | 'child';
}

export interface DeleteSessionResponse {
  success: boolean;
  message: string;
  deletedCount: number;
  newParentId?: string;
  remainingInSeries?: number;
  deletedParentAndPromoted?: boolean;
  deletedRecurringSeries?: boolean;
  deletedFromSeries?: boolean;
}

export class DeleteSessionUseCase {
  constructor(
    private sessionRepository: ISessionRepository,
    private userRepository: IUserRepository
  ) { }

  async execute(request: DeleteSessionRequest): Promise<DeleteSessionResponse> {
    const { adminId, sessionId, deleteOption } = request;

    // Verify admin exists and has permission
    const admin = await this.userRepository.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get the session to delete
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get series information
    const seriesInfo = await this.sessionRepository.getRecurringSeriesInfo(sessionId);

    switch (deleteOption) {
      case 'single':
        // Delete a non-recurring session
        if (session.isRecurring) {
          throw new Error('Cannot use single delete option for recurring sessions');
        }

        await this.sessionRepository.delete(sessionId);
        return {
          success: true,
          message: 'Session deleted successfully',
          deletedCount: 1
        };

      case 'child':
        // Delete a child session from a recurring series
        if (!session.isRecurring || seriesInfo.isParent) {
          throw new Error('This option is only for child sessions in a recurring series');
        }

        await this.sessionRepository.delete(sessionId);
        return {
          success: true,
          message: 'Session removed from recurring series',
          deletedCount: 1,
          deletedFromSeries: true
        };

      case 'promote':
        // Delete parent and promote first child
        if (!seriesInfo.isParent) {
          throw new Error('Can only promote child sessions when deleting a parent session');
        }

        if (seriesInfo.childrenCount === 0) {
          throw new Error('No child sessions available for promotion');
        }

        const result = await this.sessionRepository.deleteParentAndPromoteChild(sessionId);
        return {
          success: result.success,
          message: 'Parent session deleted and first child promoted to parent',
          deletedCount: 1,
          newParentId: result.newParentId,
          remainingInSeries: seriesInfo.totalInSeries - 1,
          deletedParentAndPromoted: true
        };

      case 'deleteAll':
        // Delete entire recurring series
        if (!seriesInfo.isParent) {
          throw new Error('Can only delete entire series from the parent session');
        }

        // Delete all child sessions first
        await this.sessionRepository.deleteByRecurringParentId(sessionId);
        // Then delete the parent
        await this.sessionRepository.delete(sessionId);

        return {
          success: true,
          message: 'Entire recurring session series deleted',
          deletedCount: seriesInfo.totalInSeries,
          deletedRecurringSeries: true
        };

      default:
        throw new Error(`Invalid delete option: ${deleteOption}`);
    }
  }

  // Helper method to get recommended delete options for a session
  async getDeleteOptions(sessionId: string): Promise<{
    session: any;
    seriesInfo: any;
    availableOptions: Array<{
      value: string;
      label: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      recommended?: boolean;
    }>;
  }> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const seriesInfo = await this.sessionRepository.getRecurringSeriesInfo(sessionId);
    const availableOptions = [];

    if (!session.isRecurring) {
      availableOptions.push({
        value: 'single',
        label: 'Delete Session',
        description: 'Delete this single session permanently.',
        severity: 'medium' as const,
        recommended: true
      });
    } else if (seriesInfo.isParent) {
      // Parent session options
      if (seriesInfo.childrenCount > 0) {
        availableOptions.push({
          value: 'promote',
          label: 'Delete & Promote Next',
          description: `Delete this session and promote the next scheduled session as the new parent. ${seriesInfo.childrenCount} sessions will remain in the series.`,
          severity: 'low' as const,
          recommended: true
        });
      }

      availableOptions.push({
        value: 'deleteAll',
        label: 'Delete Entire Series',
        description: `Delete this session and all ${seriesInfo.childrenCount} related sessions permanently. This action cannot be undone.`,
        severity: 'high' as const,
        recommended: false
      });
    } else {
      // Child session options
      availableOptions.push({
        value: 'child',
        label: 'Remove from Series',
        description: 'Remove this session from the recurring series. Other sessions will remain unaffected.',
        severity: 'low' as const,
        recommended: true
      });
    }

    return {
      session,
      seriesInfo,
      availableOptions
    };
  }
}