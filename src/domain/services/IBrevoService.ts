export interface IBrevoService {
  syncContactToLists(email: string, name: string, marketingOptIn: boolean): Promise<void>;
}