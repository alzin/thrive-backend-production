export interface ILevel {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export class Level implements ILevel {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public createdAt: Date
  ) {}
}
