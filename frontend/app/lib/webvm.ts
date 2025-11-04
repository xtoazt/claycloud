/**
 * WebVM integration for running account generator
 * WebVM runs client-side in the browser
 */

export interface WebVMConfig {
  diskImageURL?: string
  diskImageType?: 'cloud' | 'bytes'
}

export interface WebVMInstance {
  runCommand(command: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  readFile(path: string): Promise<string>
  terminate(): void
}

declare global {
  interface Window {
    WebVM?: any
  }
}

/**
 * Initialize WebVM instance
 */
export async function initializeWebVM(config?: WebVMConfig): Promise<WebVMInstance> {
  // Load WebVM if not already loaded
  if (!window.WebVM) {
    await loadWebVMScript()
  }

  if (!window.WebVM) {
    throw new Error('WebVM failed to load')
  }

  const defaultConfig: WebVMConfig = {
    diskImageURL: 'https://disks.webvm.io/debian_large_20230522_5044875331.ext2',
    diskImageType: 'cloud',
    ...config,
  }

  const vm = new window.WebVM(defaultConfig)
  
  // Wait for VM to initialize
  await new Promise(resolve => setTimeout(resolve, 3000))

  return {
    runCommand: async (command: string) => {
      return new Promise((resolve, reject) => {
        try {
          // WebVM API for running commands
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
    },
    writeFile: async (path: string, content: string) => {
      return vm.runCommand(`cat > ${path} << 'EOF'\n${content}\nEOF`)
    },
    readFile: async (path: string) => {
      return vm.runCommand(`cat ${path}`)
    },
    terminate: () => {
      vm.terminate?.()
    },
  }
}

/**
 * Load WebVM script dynamically
 */
function loadWebVMScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.WebVM) {
      resolve()
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="webvm"]')) {
      const checkInterval = setInterval(() => {
        if (window.WebVM) {
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
      // Wait a bit for WebVM to initialize
      setTimeout(() => {
        if (window.WebVM) {
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

