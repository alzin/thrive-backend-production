export class AnnouncementLike {
  constructor(
    public id: string,
    public userId: string,
    public announcementId: string,
    public createdAt: Date
  ) {}
}