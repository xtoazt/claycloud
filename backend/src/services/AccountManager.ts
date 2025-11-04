import { v4 as uuidv4 } from 'uuid';

export interface Account {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  status: 'creating' | 'ready' | 'error';
  error?: string;
}

export class AccountManager {
  private accounts: Map<string, Account> = new Map();

  async createAccount(): Promise<Account> {
    const accountId = uuidv4();
    
    // Generate random user info
    const firstName = this.generateRandomName();
    const lastName = this.generateRandomName();
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 10000)}`;
    const email = `${username}@gmail.com`;
    const password = this.generatePassword();

    const account: Account = {
      id: accountId,
      email,
      password,
      firstName,
      lastName,
      status: 'creating',
      createdAt: new Date(),
    };

    this.accounts.set(accountId, account);

    // Start async account creation
    this.createGmailAccount(accountId).catch((error) => {
      console.error(`Error creating account ${accountId}:`, error);
      const account = this.accounts.get(accountId);
      if (account) {
        account.status = 'error';
        account.error = error.message;
      }
    });

    return account;
  }

  private async createGmailAccount(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);
    if (!account) return;

    // Account creation now happens inside WebVM via Python script
    // This method is kept for compatibility but the actual creation
    // is handled by WebVMService running the Python script in Colab
    
    account.status = 'ready';
    this.accounts.set(accountId, account);
  }

  getAccount(accountId: string): Account | undefined {
    return this.accounts.get(accountId);
  }

  async deleteAccount(accountId: string): Promise<void> {
    this.accounts.delete(accountId);
  }

  private generateRandomName(): string {
    const names = [
      'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
      'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie',
      'Kai', 'Logan', 'Noah', 'Parker', 'Reese', 'River', 'Sage', 'Skylar'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private generatePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  private generateBirthday(): string {
    const year = 1990 + Math.floor(Math.random() * 30);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${month}/${day}/${year}`;
  }
}

