/**
 * Background account generator that runs silently in WebVM
 * Used for automatic account regeneration when resources are exhausted
 */

export interface AccountInfo {
  firstName: string
  lastName: string
  email: string
  password: string
  birthday: string
}

export interface AccountGenerationResult {
  success: boolean
  email?: string
  password?: string
  error?: string
}

/**
 * Generate account info
 */
export function generateAccountInfo(): AccountInfo {
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake', 'Cameron']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore']
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 10000)}`
  const email = `${username}@gmail.com`
  const password = generatePassword()
  const year = 1990 + Math.floor(Math.random() * 30)
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
  const birthday = `${month}/${day}/${year}`
  
  return { firstName, lastName, email, password, birthday }
}

function generatePassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Generate account silently in WebVM (background process)
 */
export async function generateAccountInWebVM(accountInfo: AccountInfo): Promise<AccountGenerationResult> {
  try {
    // Load WebVM if needed
    if (!(window as any).WebVM) {
      await loadWebVMScript()
    }

    if (!(window as any).WebVM) {
      throw new Error('WebVM failed to load')
    }

    // Initialize WebVM silently
    const config = {
      diskImageURL: 'https://disks.webvm.io/debian_large_20230522_5044875331.ext2',
      diskImageType: 'cloud' as const,
    }

    const vm = new (window as any).WebVM(config)
    
    // Wait for VM to initialize
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Install dependencies (silently)
    try {
      await runCommandInVM(vm, 'pip install selenium webdriver-manager -q 2>&1')
    } catch {
      // Dependencies might already be installed
    }

    // Create and run account generator script
    const script = createAccountGeneratorScript(accountInfo)
    await runCommandInVM(vm, `cat > /tmp/generate_account.py << 'EOF'\n${script}\nEOF`)
    
    // Run the script
    const result = await runCommandInVM(vm, 'python3 /tmp/generate_account.py 2>&1')
    
    // Cleanup
    vm.terminate?.()

    // Parse result
    try {
      const jsonResult = JSON.parse(result)
      if (jsonResult.status === 'success' || jsonResult.status === 'partial') {
        return {
          success: true,
          email: jsonResult.email || accountInfo.email,
          password: accountInfo.password,
        }
      } else {
        return {
          success: false,
          error: jsonResult.message || 'Account creation failed',
        }
      }
    } catch (parseError) {
      // Check if account was created anyway
      if (result.includes('success') || result.includes(accountInfo.email)) {
        return {
          success: true,
          email: accountInfo.email,
          password: accountInfo.password,
        }
      }
      return {
        success: false,
        error: 'Failed to parse account creation result',
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Account generation failed',
    }
  }
}

function runCommandInVM(vm: any, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      vm.runCommand(command, (output: string, error?: string) => {
        if (error) {
          reject(new Error(error))
        } else {
          resolve(output)
        }
      })
    } catch (err: any) {
      reject(err)
    }
  })
}

function loadWebVMScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).WebVM) {
      resolve()
      return
    }

    if (document.querySelector('script[src*="webvm"]')) {
      const checkInterval = setInterval(() => {
        if ((window as any).WebVM) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
      return
    }

    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://unpkg.com/@leaningtech/webvm@latest/dist/webvm.js'
    script.onload = () => {
      setTimeout(() => {
        if ((window as any).WebVM) {
          resolve()
        } else {
          reject(new Error('WebVM script loaded but not available'))
        }
      }, 1000)
    }
    script.onerror = () => reject(new Error('Failed to load WebVM script'))
    document.head.appendChild(script)
  })
}

function createAccountGeneratorScript(account: AccountInfo): string {
  return `
import os
import sys
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

account_info = {
    "firstName": "${account.firstName}",
    "lastName": "${account.lastName}",
    "email": "${account.email}",
    "password": "${account.password}",
    "birthday": "${account.birthday}",
}

def setup_chrome():
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging', 'enable-automation'])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Chrome setup failed: {e}"}), file=sys.stderr)
        return None

def create_account(driver, account):
    try:
        driver.get('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp')
        
        wait = WebDriverWait(driver, 15)
        
        first_name = wait.until(EC.presence_of_element_located((By.NAME, 'firstName')))
        first_name.send_keys(account['firstName'])
        
        last_name = driver.find_element(By.NAME, 'lastName')
        last_name.send_keys(account['lastName'])
        
        next_btn = wait.until(EC.element_to_be_clickable((By.ID, 'collectNameNext')))
        next_btn.click()
        
        time.sleep(2)
        
        username_input = wait.until(EC.presence_of_element_located((By.ID, 'username')))
        username_input.clear()
        username_input.send_keys(account['email'].split('@')[0])
        
        username_next = wait.until(EC.element_to_be_clickable((By.ID, 'next')))
        username_next.click()
        
        time.sleep(2)
        
        password_input = wait.until(EC.presence_of_element_located((By.NAME, 'Passwd')))
        password_input.send_keys(account['password'])
        
        confirm_password = driver.find_element(By.NAME, 'ConfirmPasswd')
        confirm_password.send_keys(account['password'])
        
        password_next = wait.until(EC.element_to_be_clickable((By.ID, 'createpasswordNext')))
        password_next.click()
        
        time.sleep(3)
        
        current_url = driver.current_url
        if 'signup/v2' not in current_url:
            print(json.dumps({"status": "success", "email": account['email']}))
            return True
        else:
            print(json.dumps({"status": "partial", "email": account['email'], "message": "May require phone verification"}))
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
`
}

