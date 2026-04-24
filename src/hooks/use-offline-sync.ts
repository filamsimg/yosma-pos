"use client"

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'

export interface QueueItem {
  id: string
  type: 'ORDER' | 'CHECKIN'
  payload: any
  createdAt: string
  status: SyncStatus
  retryCount: number
}

const STORAGE_KEY = 'yosma_sync_queue'

export function useOfflineSync(onSyncItem: (item: QueueItem) => Promise<any>) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isOnline, setIsOnline] = useState(true)

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem(STORAGE_KEY)
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue))
      } catch (e) {
        console.error('Failed to parse sync queue', e)
      }
    }

    // Monitor connectivity
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  }, [queue])

  const addToQueue = useCallback((type: 'ORDER' | 'CHECKIN', payload: any) => {
    const newItem: QueueItem = {
      id: crypto.randomUUID(),
      type,
      payload,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0
    }

    setQueue(prev => [...prev, newItem])
    return newItem.id
  }, [])

  const syncItem = useCallback(async (item: QueueItem) => {
    // Update status to SYNCING
    setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'SYNCING' } : i))

    try {
      await onSyncItem(item)
      // Success: Remove from queue
      setQueue(prev => prev.filter(i => i.id !== item.id))
      return true
    } catch (error) {
      console.error(`Failed to sync item ${item.id}`, error)
      // Failed: Update retry count and status
      setQueue(prev => prev.map(i => i.id === item.id ? { 
        ...i, 
        status: 'FAILED', 
        retryCount: i.retryCount + 1 
      } : i))
      return false
    }
  }, [onSyncItem])

  // Automatic sync when online
  useEffect(() => {
    if (isOnline) {
      const pendingItems = queue.filter(item => item.status === 'PENDING' || item.status === 'FAILED')
      if (pendingItems.length > 0) {
        // Sync items sequentially to avoid race conditions or heavy load
        const runSync = async () => {
          for (const item of pendingItems) {
            await syncItem(item)
          }
        }
        runSync()
      }
    }
  }, [isOnline, queue, syncItem])

  const clearSynced = useCallback(() => {
    setQueue(prev => prev.filter(item => item.status !== 'SYNCED'))
  }, [])

  return {
    queue,
    isOnline,
    addToQueue,
    syncItem,
    clearSynced,
    pendingCount: queue.length
  }
}
