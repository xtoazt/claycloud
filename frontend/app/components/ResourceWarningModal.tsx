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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Resource Limit Reached</h2>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-700">
            Your current session has reached its resource limits. We're automatically setting up a new account for you.
          </p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm font-semibold text-yellow-800 mb-2">Important:</p>
            <p className="text-sm text-yellow-700">
              Please save any work to your local device before we switch to the new account. 
              Your current session data will not be transferred.
            </p>
          </div>
          
          {isRegenerating && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>Setting up new account...</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onSave}
            disabled={isRegenerating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            I've Saved My Work
          </button>
          <button
            onClick={onDismiss}
            disabled={isRegenerating}
            className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
