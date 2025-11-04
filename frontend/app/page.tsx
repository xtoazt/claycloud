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
  const handleResourceExhaustedRef = useRef<((sessionId: string) => Promise<void>) | null>(null)
  const startResourceMonitoringRef = useRef<((sessionId: string) => void) | null>(null)

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
  const handleResourceExhausted = useCallback(async (sessionId: string): Promise<void> => {
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
          if (startResourceMonitoringRef.current) {
            startResourceMonitoringRef.current(sessionId)
          }
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
    // generateAccountInfo is a pure function, safe to call without dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegeneratingAccount, switchToNewAccount])

  // Store ref for handleResourceExhausted
  handleResourceExhaustedRef.current = handleResourceExhausted

  // Monitor resources and auto-regenerate account if exhausted
  const startResourceMonitoring = useCallback((sessionId: string): void => {
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
            if (handleResourceExhaustedRef.current) {
              await handleResourceExhaustedRef.current(sessionId)
            }
          }
        }
      } catch (err) {
        // Silently fail - don't interrupt user experience
        console.error('Resource check failed:', err)
      }
    }, 30000) // Check every 30 seconds
  }, [isRegeneratingAccount])

  // Store ref for startResourceMonitoring
  startResourceMonitoringRef.current = startResourceMonitoring

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
    <main className="min-h-screen p-4 md:p-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="inline-block mb-6 animate-float">
            <div className="text-7xl md:text-8xl mb-4">☁️</div>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-lg">
            Clay Cloud
          </h1>
          <p className="text-xl md:text-2xl text-white/95 mb-2 font-light">
            Free cloud computing with automated account management
          </p>
          <p className="text-lg text-white/80 font-light">
            Powered by WebVM • Zero configuration required
          </p>
        </div>

        {/* Main Content Card */}
        <div className="glass-strong rounded-3xl shadow-2xl p-6 md:p-10 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10">
            {!session ? (
              <div className="text-center py-8 md:py-12">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                      Get Started in Seconds
                    </h2>
                    <p className="text-lg text-gray-600 mb-2">
                      We&apos;ll automatically set up everything you need
                    </p>
                    <p className="text-base text-gray-500">
                      Free cloud computing powered by Google Colab and WebVM
                    </p>
                  </div>
                  
                  <button
                    onClick={createSession}
                    disabled={loading}
                    className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 bg-pos-0 hover:bg-pos-100 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                    style={{
                      backgroundSize: '200% 100%',
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Creating Session...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Start Free Session</span>
                          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  
                  {error && (
                    <div className="mt-6 max-w-md mx-auto p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-700 font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                      <div className="text-4xl mb-3">⚡</div>
                      <h3 className="font-bold text-gray-800 mb-2">Instant Setup</h3>
                      <p className="text-sm text-gray-600">Automated account creation and configuration</p>
                    </div>
                    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
                      <div className="text-4xl mb-3">🔄</div>
                      <h3 className="font-bold text-gray-800 mb-2">Auto-Recovery</h3>
                      <p className="text-sm text-gray-600">Seamless account switching when resources are exhausted</p>
                    </div>
                    <div className="p-6 rounded-xl bg-gradient-to-br from-pink-50 to-orange-50 border border-pink-100">
                      <div className="text-4xl mb-3">💰</div>
                      <h3 className="font-bold text-gray-800 mb-2">100% Free</h3>
                      <p className="text-sm text-gray-600">No credit card, no hidden fees</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {accountInfo && !accountCreated && (
                  <WebVMAccountGenerator
                    accountInfo={accountInfo}
                    onAccountCreated={handleAccountCreated}
                  />
                )}
                
                <div className="space-y-8">
                  {/* Session Status Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <span>📊</span>
                      <span>Session Status</span>
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Status:</span>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                          session.status === 'ready' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                          session.status === 'creating' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                          'bg-gradient-to-r from-red-400 to-red-600 text-white'
                        }`}>
                          {session.status === 'ready' ? '✓ READY' :
                           session.status === 'creating' ? '⏳ CREATING' :
                           '✗ ERROR'}
                        </span>
                      </div>
                      {session.vmUrl && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <span className="font-semibold text-gray-700">VM URL:</span>
                          <a
                            href={session.vmUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-2"
                          >
                            <span>Open VM</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VM Iframe */}
                  {session.status === 'ready' && session.vmUrl && (
                    <div className="bg-gray-900 rounded-2xl p-4 shadow-2xl border border-gray-700">
                      <div className="flex items-center gap-2 mb-3 px-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-4 text-gray-400 text-sm font-mono">cloud-vm</span>
                      </div>
                      <iframe
                        src={session.vmUrl}
                        className="w-full h-[600px] rounded-lg border border-gray-700 bg-white"
                        title="Cloud VM"
                      />
                    </div>
                  )}

                  {/* Loading State */}
                  {session.status === 'creating' && (
                    <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                      <div className="inline-block relative mb-6">
                        <div className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-75"></div>
                        <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
                      </div>
                      <p className="text-xl font-semibold text-gray-700 mb-2">Setting up your cloud environment...</p>
                      <p className="text-gray-500">This may take a few moments</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      setSession(null)
                      setError(null)
                      setAccountInfo(null)
                      setAccountCreated(false)
                    }}
                    className="w-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Create New Session
                  </button>
                </div>
              </>
            )}
          </div>
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

