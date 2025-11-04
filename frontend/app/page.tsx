'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { sessionsApi, type Session } from './lib/api'
import { WebVMAccountGenerator } from './components/WebVMAccountGenerator'
import { ResourceWarningModal } from './components/ResourceWarningModal'
import { generateAccountInWebVM, generateAccountInfo } from './lib/accountGenerator'


export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountInfo, setAccountInfo] = useState<{
    firstName: string
    lastName: string
    email: string
    password: string
    birthday: string
  } | null>(null)
  const [accountCreated, setAccountCreated] = useState(false)
  const [showResourceWarning, setShowResourceWarning] = useState(false)
  const [isRegeneratingAccount, setIsRegeneratingAccount] = useState(false)
  const resourceCheckInterval = useRef<NodeJS.Timeout | null>(null)

  const createSession = async () => {
    setLoading(true)
    setError(null)
    setAccountCreated(false)
    
    try {
      // Step 1: Create account structure on backend
      const newSession = await sessionsApi.create()
      setSession(newSession)
      
      // Step 2: Generate account info
      const info = generateAccountInfo()
      setAccountInfo(info)
      
      // Step 3: Account will be created in WebVM (client-side)
      // Step 4: Once created, authenticate and set up Colab session
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create session')
      setLoading(false)
    }
  }

  const generateAccountInfo = () => {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']
    
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

  const generatePassword = () => {
    const length = 16
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const handleAccountCreated = async (result: { success: boolean; email?: string; error?: string }) => {
    if (result.success && result.email && session) {
      setAccountCreated(true)
      // Now set up Colab session for computing
      try {
        await setupColabSession(result.email)
      } catch (err: any) {
        setError(err.message || 'Failed to set up Colab session')
        setLoading(false)
      }
    } else {
      setError(result.error || 'Account creation failed')
      setLoading(false)
    }
  }

  const setupColabSession = async (email: string) => {
    if (!session) return
    
    try {
      // Complete session setup - backend will create Colab session
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to complete session setup')
      }
      
      const updatedSession = await response.json()
      setSession(updatedSession)
      
      if (updatedSession.status === 'ready') {
        setLoading(false)
      } else {
        // Poll for completion
        pollSessionStatus(session.id)
      }
    } catch (err: any) {
      setError('Failed to set up Colab session')
      setLoading(false)
    }
  }

  const pollSessionStatus = async (sessionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const updatedSession = await sessionsApi.get(sessionId)
        setSession(updatedSession)
        
        if (updatedSession.status === 'ready' || updatedSession.status === 'error') {
          clearInterval(pollInterval)
          setLoading(false)
          
          // Start monitoring resources if session is ready
          if (updatedSession.status === 'ready') {
            startResourceMonitoring(sessionId)
          }
        }
      } catch (err) {
        clearInterval(pollInterval)
        setError('Failed to check session status')
        setLoading(false)
      }
    }, 2000)

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (session?.status === 'creating') {
        setError('Session creation timed out')
        setLoading(false)
      }
    }, 300000)
  }

  // Switch to new account when resources are exhausted
  const switchToNewAccount = useCallback(async (sessionId: string, email: string, password: string) => {
    try {
      // Switch to new account (backend handles Colab session creation)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/sessions/${sessionId}/switch-account`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to switch account')
      }

      const updatedSession = await response.json()
      
      // Update session silently (user doesn't see account details)
      setSession(updatedSession)
      setShowResourceWarning(false)
      setIsRegeneratingAccount(false)

      // Clear any errors
      setError(null)

    } catch (err: any) {
      console.error('Account switch failed:', err)
      setShowResourceWarning(false)
      setIsRegeneratingAccount(false)
      throw err
    }
  }, [])

  // Monitor resources and auto-regenerate account if exhausted
  const handleResourceExhausted = useCallback(async (sessionId: string) => {
    // Prevent multiple simultaneous regenerations
    if (isRegeneratingAccount) {
      return
    }

    // Stop resource monitoring
    if (resourceCheckInterval.current) {
      clearInterval(resourceCheckInterval.current)
      resourceCheckInterval.current = null
    }

    // Show warning modal immediately
    setShowResourceWarning(true)
    setIsRegeneratingAccount(true)

    try {
      // Generate new account silently in background (runs in WebVM, not visible to user)
      const newAccountInfo = generateAccountInfo()
      
      // Generate account in WebVM (silent, no UI shown)
      const result = await generateAccountInWebVM(newAccountInfo)

      if (result.success && result.email) {
        // Switch to new account seamlessly
        await switchToNewAccount(sessionId, result.email, result.password || newAccountInfo.password)
        
        // Restart resource monitoring for new account after switch completes
        setTimeout(() => {
          startResourceMonitoring(sessionId)
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to generate new account')
      }
    } catch (err: any) {
      console.error('Account regeneration failed:', err)
      setError('Failed to regenerate account. Please try creating a new session.')
      setShowResourceWarning(false)
      setIsRegeneratingAccount(false)
    }
  }, [isRegeneratingAccount, switchToNewAccount, startResourceMonitoring])

  // Monitor resources and auto-regenerate account if exhausted
  const startResourceMonitoring = useCallback((sessionId: string) => {
    // Clear any existing interval
    if (resourceCheckInterval.current) {
      clearInterval(resourceCheckInterval.current)
    }

    // Check resources every 30 seconds
    resourceCheckInterval.current = setInterval(async () => {
      // Don't check if already regenerating
      if (isRegeneratingAccount) {
        return
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/sessions/${sessionId}/resources`,
          { method: 'GET' }
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.exhausted) {
            // Resources exhausted - show warning and regenerate
            handleResourceExhausted(sessionId)
          }
        }
      } catch (err) {
        // Silently fail - don't interrupt user experience
        console.error('Resource check failed:', err)
      }
    }, 30000) // Check every 30 seconds
  }, [isRegeneratingAccount, handleResourceExhausted])

  const handleResourceWarningDismiss = () => {
    if (isRegeneratingAccount) {
      // Wait for regeneration to complete - don't allow dismissal during regeneration
      return
    }
    // User chose to continue anyway - proceed with account switch
    setShowResourceWarning(false)
  }

  const handleResourceWarningSave = () => {
    // User confirmed they've saved their work
    // Account switch will proceed automatically when regeneration completes
    // Modal will close when switchToNewAccount completes
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resourceCheckInterval.current) {
        clearInterval(resourceCheckInterval.current)
      }
    }
  }, [])

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Clay Cloud</h1>
          <p className="text-xl text-white/90 mb-8">
            Free cloud computing with automated account management
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          {!session ? (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Get started with a free cloud computing session. We'll automatically
                set up everything you need using WebVM.
              </p>
              <button
                onClick={createSession}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating Session...' : 'Start Free Session'}
              </button>
              {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <>
              {accountInfo && !accountCreated && (
                <WebVMAccountGenerator
                  accountInfo={accountInfo}
                  onAccountCreated={handleAccountCreated}
                />
              )}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Session Status</h2>
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Status:</span>{' '}
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      session.status === 'ready' ? 'bg-green-100 text-green-800' :
                      session.status === 'creating' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {session.status.toUpperCase()}
                    </span>
                  </p>
                  {/* Don't show account email - keep it hidden from user */}
                  {session.vmUrl && (
                    <p>
                      <span className="font-semibold">VM URL:</span>{' '}
                      <a
                        href={session.vmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {session.vmUrl}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {session.status === 'ready' && session.vmUrl && (
                <div className="border-t pt-6">
                  <iframe
                    src={session.vmUrl}
                    className="w-full h-[600px] border rounded-lg"
                    title="Cloud VM"
                  />
                </div>
              )}

              {session.status === 'creating' && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="mt-4 text-gray-600">Setting up your cloud environment...</p>
                </div>
              )}

              <button
                onClick={() => {
                  setSession(null)
                  setError(null)
                  setAccountInfo(null)
                  setAccountCreated(false)
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Create New Session
              </button>
            </div>
            </>
          )}
        </div>
      </div>

      <ResourceWarningModal
        isOpen={showResourceWarning}
        onDismiss={handleResourceWarningDismiss}
        onSave={handleResourceWarningSave}
        isRegenerating={isRegeneratingAccount}
      />
    </main>
  )
}

