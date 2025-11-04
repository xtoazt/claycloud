import { Account } from './AccountManager';
import { ColabService, ColabSession } from './ColabService';

// WebVM types based on the actual library
interface WebVMInstance {
  runCommand(command: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
  executeScript(script: string): Promise<string>;
}

export class WebVMService {
  private colabService: ColabService;
  private vms: Map<string, { vm: any; session: ColabSession }> = new Map();

  constructor() {
    this.colabService = new ColabService();
  }

  /**
   * Create a Colab session for computing (after account is created)
   * Note: Account generation happens in WebVM on the client side
   */
  async createVM(account: Account): Promise<string> {
    try {
      // Account should already be created by WebVM on client side
      // Now we create a Colab session for computing
      const colabSession = await this.colabService.createNotebook(account);
      
      // Store the session
      const vmId = `vm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.vms.set(vmId, { vm: null, session: colabSession });

      return vmId;
    } catch (error: any) {
      console.error('Error creating Colab session:', error);
      throw new Error(`Failed to create Colab session: ${error.message}`);
    }
  }

  /**
   * Execute code in Colab (for computing, not account generation)
   */
  async executeCode(vmId: string, code: string): Promise<string> {
    const vmData = this.vms.get(vmId);
    if (!vmData) {
      throw new Error('VM not found');
    }
    
    return this.runCommandInColab(vmData.session, code);
  }

  /**
   * Create Python script for account generation (reference only - runs in client WebVM)
   */
  private createAccountGeneratorScript(account: Account): string {
    return `
import os
import sys
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import subprocess

# Account info
account_info = {
    "firstName": "${account.firstName}",
    "lastName": "${account.lastName}",
    "email": "${account.email}",
    "password": "${account.password}",
}

def setup_chrome():
    """Setup Chrome in headless mode"""
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging', 'enable-automation'])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Try to use system chromedriver
    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"Error setting up Chrome: {e}", file=sys.stderr)
        return None

def create_account(driver, account):
    """Create Google account"""
    try:
        # Navigate to signup page
        driver.get('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp')
        
        # Wait for page and fill form
        wait = WebDriverWait(driver, 10)
        
        # First name
        first_name = wait.until(EC.presence_of_element_located((By.NAME, 'firstName')))
        first_name.send_keys(account['firstName'])
        
        # Last name
        last_name = driver.find_element(By.NAME, 'lastName')
        last_name.send_keys(account['lastName'])
        
        # Click next
        next_btn = driver.find_element(By.ID, 'collectNameNext')
        next_btn.click()
        
        # Wait for username page
        username_input = wait.until(EC.presence_of_element_located((By.ID, 'username')))
        username_input.clear()
        username_input.send_keys(account['email'].split('@')[0])
        
        # Click next
        username_next = driver.find_element(By.ID, 'next')
        username_next.click()
        
        # Wait for password page
        password_input = wait.until(EC.presence_of_element_located((By.NAME, 'Passwd')))
        password_input.send_keys(account['password'])
        
        confirm_password = driver.find_element(By.NAME, 'ConfirmPasswd')
        confirm_password.send_keys(account['password'])
        
        # Click next
        password_next = driver.find_element(By.ID, 'createpasswordNext')
        password_next.click()
        
        print(json.dumps({"status": "success", "email": account['email']}))
        return True
        
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}), file=sys.stderr)
        return False

def main():
    driver = setup_chrome()
    if not driver:
        sys.exit(1)
    
    try:
        success = create_account(driver, account_info)
        sys.exit(0 if success else 1)
    finally:
        driver.quit()

if __name__ == '__main__':
    main()
`;
  }

  /**
   * Run command in Colab
   */
  private async runCommandInColab(session: ColabSession, command: string): Promise<string> {
    const code = `!${command}`;
    const result = await this.colabService.executeCode(session, code);
    return result.output || '';
  }

  /**
   * Write file in Colab
   */
  private async writeFileInColab(session: ColabSession, path: string, content: string): Promise<void> {
    const code = `
with open('${path}', 'w') as f:
    f.write('''${content.replace(/'/g, "\\'")}''')
`;
    await this.colabService.executeCode(session, code);
  }

  /**
   * Read file in Colab
   */
  private async readFileInColab(session: ColabSession, path: string): Promise<string> {
    const code = `
with open('${path}', 'r') as f:
    print(f.read())
`;
    const result = await this.colabService.executeCode(session, code);
    return result.output || '';
  }

  /**
   * Execute Python script in Colab
   */
  private async executeScriptInColab(session: ColabSession, scriptPath: string): Promise<string> {
    const code = `exec(open('${scriptPath}').read())`;
    const result = await this.colabService.executeCode(session, code);
    return result.output || '';
  }

  /**
   * Get VM URL for frontend access
   */
  getVMUrl(vmId: string): string {
    const vmData = this.vms.get(vmId);
    if (!vmData) {
      throw new Error('VM not found');
    }
    
    // Return Colab notebook URL
    return `https://colab.research.google.com/drive/${vmData.session.notebookId}`;
  }

  /**
   * Get Colab session for a VM
   */
  async getColabSession(vmId: string): Promise<ColabSession | null> {
    const vmData = this.vms.get(vmId);
    return vmData?.session || null;
  }

  /**
   * Delete VM
   */
  async deleteVM(vmId: string): Promise<void> {
    const vmData = this.vms.get(vmId);
    if (vmData) {
      // Cleanup Colab session
      // In production, you'd close the notebook
      this.vms.delete(vmId);
    }
  }
}
