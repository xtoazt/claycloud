'use client'

interface ResourceWarningModalProps {
  isOpen: boolean
  onDismiss: () => void
  onSave: () => void
  isRegenerating?: boolean
}

export function ResourceWarningModal({ 
  isOpen, 
  onDismiss, 
  onSave,
  isRegenerating = false 
}: ResourceWarningModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-6">
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-bounce">⚠️</div>
            <h2 className="text-2xl font-bold text-white">Resource Limit Reached</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Your current session has reached its resource limits. We&apos;re automatically setting up a new account for you.
          </p>
          
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <p className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Important:
            </p>
            <p className="text-sm text-yellow-700">
              Please save any work to your local device before we switch to the new account. 
              Your current session data will not be transferred.
            </p>
          </div>
          
          {isRegenerating && (
            <div className="flex items-center justify-center space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-75"></div>
                <div className="relative animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
              </div>
              <span className="text-sm font-medium text-purple-700">Setting up new account...</span>
            </div>
          )}
        </div>
        
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onSave}
            disabled={isRegenerating}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
          >
            I&apos;ve Saved My Work
          </button>
          <button
            onClick={onDismiss}
            disabled={isRegenerating}
            className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 disabled:from-gray-100 disabled:to-gray-200 text-gray-800 font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
