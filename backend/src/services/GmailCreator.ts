import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { Service } from 'selenium-webdriver/chrome';
import { execSync } from 'child_process';

interface AccountInfo {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthday: string;
}

export class GmailCreator {
  private driver: WebDriver | null = null;

  async createAccount(accountInfo: AccountInfo): Promise<void> {
    try {
      // Initialize browser (headless mode)
      const options = new ChromeOptions();
      options.addArguments('--headless');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-blink-features=AutomationControlled');
      options.setExperimentalOption('excludeSwitches', ['enable-logging', 'enable-automation']);
      options.setExperimentalOption('useAutomationExtension', false);

      // Use system chromedriver or download if needed
      // In production, ensure chromedriver is installed
      let chromeDriverPath = process.env.CHROME_DRIVER_PATH || 'chromedriver';
      
      try {
        // Try to find chromedriver in PATH
        execSync('which chromedriver', { stdio: 'ignore' });
      } catch {
        // If not found, you may need to install it
        console.warn('ChromeDriver not found in PATH. Please install it.');
      }

      const service = new Service(chromeDriverPath);
      this.driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .setChromeService(service)
        .build();

      // Navigate to Google account creation
      await this.driver.get('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp');

      // Wait for page to load
      await this.driver.wait(until.elementLocated(By.name('firstName')), 10000);

      // Fill in first name
      const firstNameInput = await this.driver.findElement(By.name('firstName'));
      await firstNameInput.sendKeys(accountInfo.firstName);

      // Fill in last name
      const lastNameInput = await this.driver.findElement(By.name('lastName'));
      await lastNameInput.sendKeys(accountInfo.lastName);

      // Click next
      const nextButton = await this.driver.findElement(By.id('collectNameNext'));
      await nextButton.click();

      // Wait for username/email page
      await this.driver.wait(until.elementLocated(By.id('username')), 10000);

      // Fill in username (email)
      const usernameInput = await this.driver.findElement(By.id('username'));
      await usernameInput.clear();
      await usernameInput.sendKeys(accountInfo.email.split('@')[0]);

      // Click next
      const usernameNextButton = await this.driver.findElement(By.id('next'));
      await usernameNextButton.click();

      // Wait for password page
      await this.driver.wait(until.elementLocated(By.name('Passwd')), 10000);

      // Fill in password
      const passwordInput = await this.driver.findElement(By.name('Passwd'));
      await passwordInput.sendKeys(accountInfo.password);

      // Fill in confirm password
      const confirmPasswordInput = await this.driver.findElement(By.name('ConfirmPasswd'));
      await confirmPasswordInput.sendKeys(accountInfo.password);

      // Click next
      const passwordNextButton = await this.driver.findElement(By.id('createpasswordNext'));
      await passwordNextButton.click();

      // Note: Phone verification would be handled here if needed
      // For now, we'll assume the account creation process continues
      // In a real implementation, you'd integrate with SMS services like sms-activate.org

      console.log(`Account creation initiated for ${accountInfo.email}`);
    } catch (error: any) {
      console.error('Error creating Gmail account:', error);
      throw new Error(`Failed to create Gmail account: ${error.message}`);
    } finally {
      if (this.driver) {
        await this.driver.quit();
      }
    }
  }

  // Alternative method using requests (more efficient but harder to detect)
  // This would require reverse engineering Google's API endpoints
  async createAccountViaAPI(accountInfo: AccountInfo): Promise<void> {
    // This is a placeholder for a more advanced implementation
    // that would use direct API calls instead of Selenium
    throw new Error('API-based account creation not implemented yet');
  }
}

