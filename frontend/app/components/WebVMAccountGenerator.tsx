'use client'

import { useEffect, useRef, useState } from 'react'

interface WebVMAccountGeneratorProps {
  accountInfo: {
    firstName: string
    lastName: string
    email: string
    password: string
    birthday: string
  }
  onAccountCreated: (result: { success: boolean; email?: string; error?: string }) => void
}

export function WebVMAccountGenerator({ accountInfo, onAccountCreated }: WebVMAccountGeneratorProps) {
  const [status, setStatus] = useState<string>('Initializing WebVM...')
  const [loading, setLoading] = useState(true)
  const webvmRef = useRef<any>(null)

  useEffect(() => {
    initializeWebVM()
    return () => {
      // Cleanup
      if (webvmRef.current) {
        webvmRef.current.terminate?.()
      }
    }
  }, [])

  const initializeWebVM = async () => {
    try {
      setStatus('Loading WebVM...')
      
      // Dynamically import WebVM
      // Note: WebVM is typically loaded as a script tag, so we'll use a different approach
      // For now, we'll use the WebVM API if available, or load it dynamically
      
      // Check if WebVM is available globally
      if (typeof window !== 'undefined' && (window as any).WebVM) {
        await runAccountGenerator((window as any).WebVM)
      } else {
        // Load WebVM script dynamically
        await loadWebVMScript()
      }
    } catch (error: any) {
      console.error('Error initializing WebVM:', error)
      onAccountCreated({ success: false, error: error.message })
      setLoading(false)
    }
  }

  const loadWebVMScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@leaningtech/webvm@latest/dist/webvm.js'
      script.onload = () => {
        if ((window as any).WebVM) {
          runAccountGenerator((window as any).WebVM).then(resolve).catch(reject)
        } else {
          reject(new Error('WebVM failed to load'))
        }
      }
      script.onerror = () => reject(new Error('Failed to load WebVM script'))
      document.head.appendChild(script)
    })
  }

  const runAccountGenerator = async (WebVM: any) => {
    try {
      setStatus('Creating WebVM instance...')
      
      // Initialize WebVM
      const config = {
        // Use default Debian image
        diskImageURL: 'https://disks.webvm.io/debian_large_20230522_5044875331.ext2',
        diskImageType: 'cloud',
      }

      const vm = new WebVM(config)
      webvmRef.current = vm

      setStatus('WebVM started. Installing dependencies...')
      
      // Wait for VM to be ready
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Install Python dependencies
      await vm.runCommand('pip install selenium webdriver-manager -q')
      setStatus('Dependencies installed. Creating account generator script...')

      // Create the account generator script
      const script = createAccountGeneratorScript(accountInfo)
      
      // Write script to VM
      await vm.runCommand(`cat > /tmp/generate_account.py << 'EOF'\n${script}\nEOF`)
      
      setStatus('Running account generator...')
      
      // Run the script
      const result = await vm.runCommand('python3 /tmp/generate_account.py')
      
      // Parse result
      try {
        const jsonResult = JSON.parse(result)
        if (jsonResult.status === 'success') {
          setStatus('Account created successfully!')
          onAccountCreated({ success: true, email: jsonResult.email })
        } else {
          throw new Error(jsonResult.message || 'Account creation failed')
        }
      } catch (parseError) {
        // If JSON parse fails, check if account was created
        if (result.includes('success') || result.includes(accountInfo.email)) {
          onAccountCreated({ success: true, email: accountInfo.email })
        } else {
          throw new Error('Failed to parse account creation result')
        }
      }
    } catch (error: any) {
      console.error('Error running account generator:', error)
      onAccountCreated({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const createAccountGeneratorScript = (account: typeof accountInfo): string => {
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
from selenium.webdriver.chrome.service import Service

account_info = {
    "firstName": "${account.firstName}",
    "lastName": "${account.lastName}",
    "email": "${account.email}",
    "password": "${account.password}",
    "birthday": "${account.birthday}",
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
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Chrome setup failed: {e}"}), file=sys.stderr)
        return None

def create_account(driver, account):
    """Create Google account"""
    try:
        driver.get('https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp')
        
        wait = WebDriverWait(driver, 15)
        
        # First name
        first_name = wait.until(EC.presence_of_element_located((By.NAME, 'firstName')))
        first_name.send_keys(account['firstName'])
        
        # Last name
        last_name = driver.find_element(By.NAME, 'lastName')
        last_name.send_keys(account['lastName'])
        
        # Click next
        next_btn = wait.until(EC.element_to_be_clickable((By.ID, 'collectNameNext')))
        next_btn.click()
        
        time.sleep(2)
        
        # Username
        username_input = wait.until(EC.presence_of_element_located((By.ID, 'username')))
        username_input.clear()
        username_input.send_keys(account['email'].split('@')[0])
        
        # Click next
        username_next = wait.until(EC.element_to_be_clickable((By.ID, 'next')))
        username_next.click()
        
        time.sleep(2)
        
        # Password
        password_input = wait.until(EC.presence_of_element_located((By.NAME, 'Passwd')))
        password_input.send_keys(account['password'])
        
        confirm_password = driver.find_element(By.NAME, 'ConfirmPasswd')
        confirm_password.send_keys(account['password'])
        
        # Click next
        password_next = wait.until(EC.element_to_be_clickable((By.ID, 'createpasswordNext')))
        password_next.click()
        
        time.sleep(3)
        
        # Check if account was created (may need phone verification)
        current_url = driver.current_url
        if 'signup/v2' not in current_url:
            print(json.dumps({"status": "success", "email": account['email']}))
            return True
        else:
            # May need phone verification
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

  return (
    <div className="bg-white rounded-lg p-6 mb-4">
      <h3 className="text-lg font-semibold mb-2">Account Generator Status</h3>
      <div className="space-y-2">
        {loading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="text-sm text-gray-600">{status}</span>
          </div>
        )}
      </div>
    </div>
  )
}

