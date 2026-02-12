import { IBrevoService } from '../../domain/services/IBrevoService';
import { ENV_CONFIG } from '../config/env.config';
import axios from 'axios';

export class BrevoService implements IBrevoService {
  async syncContactToLists(email: string, name: string, marketingOptIn: boolean): Promise<void> {
    if (!ENV_CONFIG.BREVO_API_KEY) {
      console.log('Brevo API key not configured, skipping sync');
      return;
    }

    const listIds = [ENV_CONFIG.BREVO_TRANSACTIONAL_LIST_ID]; // Always add to Transactional
    if (marketingOptIn) {
      listIds.push(ENV_CONFIG.BREVO_MARKETING_LIST_ID); // Add to Marketing if opted in
    }

    try {
      await axios.post(
        'https://api.brevo.com/v3/contacts',
        {
          email: email,
          attributes: { FIRSTNAME: name },
          listIds: listIds,
          updateEnabled: true
        },
        {
          headers: {
            'api-key': ENV_CONFIG.BREVO_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`Synced ${email} to Brevo lists: ${listIds}`);
    } catch (error: any) {
      console.error('Brevo Sync Failed:', error?.response?.data || error.message);
      // We do NOT throw error here to avoid blocking registration if Brevo is down
    }
  }
}