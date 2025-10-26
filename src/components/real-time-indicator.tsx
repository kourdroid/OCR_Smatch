'use client'

import { formatDistanceToNow } from 'date-fns'
import { Wifi, WifiOff, Activity, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealTimeIndicatorProps {
  isConnected: boolean
  lastUpdate: Date
  newDocumentCount: number
  className?: string
}

export function RealTimeIndicator({ 
  isConnected, 
  lastUpdate, 
  newDocumentCount,
  className 
}: RealTimeIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      {/* Connection Status */}
      <div className="flex items-center gap-1.5">
        {isConnected ? (
          <>
            <div className="relative">
              <Wifi className="h-4 w-4 text-green-600" />
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="text-green-700 font-medium">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-red-600 font-medium">Disconnected</span>
          </>
        )}
      </div>

      {/* Last Update */}
      <div className="flex items-center gap-1.5 text-gray-600">
        <Clock className="h-4 w-4" />
        <span>
          Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
        </span>
      </div>

      {/* New Documents Counter */}
      {newDocumentCount > 0 && (
        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-full animate-slide-down">
          <Activity className="h-4 w-4" />
          <span className="font-medium">
            {newDocumentCount} new document{newDocumentCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Processing Indicator */}
      {isConnected && (
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-gray-500 text-xs">Processing</span>
        </div>
      )}
    </div>
  )
}