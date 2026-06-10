/**
 * Contact data model for the address book and recent recipients.
 */

/** A contact entry in the user's address book. */
export interface Contact {
  id: string;
  name: string;
  email: string;
  favorite: boolean;
  lastSent?: Date;
  totalSent: number;
}


