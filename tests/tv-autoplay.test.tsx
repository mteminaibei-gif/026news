"""TV Auto-Play Functionality Test Suite

Tests for TV station selection, auto-play, HLS support, and widget functionality.
"""

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import React from 'react'
import { TVGlobalProvider } from '@/components/tv/TVGlobalProvider'
import { TVWidget } from '@/components/tv/TVWidget'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  auth: { getUser: () => ({ data: { user: null } }) },
  from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) })
}))

// Mock hls.js for testing
vi.mock('https://cdn.jsdelivr.net/npm/hls.js@latest', () => ({}))

describe('TV Auto-Play Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('TVGlobalProvider', () => {
    it('should initialize with no station selected', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TVGlobalProvider>{children}</TVGlobalProvider>
      )
      const { result } = renderHook(() => require('@/components/tv/TVGlobalProvider').useTVGlobal(), { wrapper })
      expect(result.current.currentStation).toBeNull()
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.status).toBe('idle')
    })

    it('should play station when playStation is called', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TVGlobalProvider>{children}</TVGlobalProvider>
      )
      const { result } = renderHook(() => require('@/components/tv/TVGlobalProvider').useTVGlobal(), { wrapper })
      
      const mockStation = {
        id: 'test-station',
        name: 'Test Station',
        genre: 'Test Genre',
        color: '#ff0000',
        streamUrl: 'https://test.com/stream.m3u8',
        embedType: 'hls' as const,
        website: 'https://test.com',
        logo: '📺',
        region: 'ke',
      }
      
      act(() => {
        result.current.playStation(mockStation)
      })
      
      expect(result.current.currentStation?.id).toBe('test-station')
      expect(result.current.isPlaying).toBe(true)
      expect(result.current.status).toBe('loading')
    })

    it('should toggle play when same station is called twice', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TVGlobalProvider>{children}</TVGlobalProvider>
      )
      const { result } = renderHook(() => require('@/components/tv/TVGlobalProvider').useTVGlobal(), { wrapper })
      
      const mockStation = {
        id: 'test-station',
        name: 'Test Station',
        genre: 'Test Genre',
        color: '#ff0000',
        streamUrl: 'https://test.com/stream.m3u8',
        embedType: 'hls' as const,
        website: 'https://test.com',
        logo: '📺',
        region: 'ke',
      }
      
      act(() => {
        result.current.playStation(mockStation)
      })
      
      act(() => {
        result.current.playStation(mockStation)
      })
      
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.status).toBe('idle')
    })

    it('should stop when stop is called', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TVGlobalProvider>{children}</TVGlobalProvider>
      )
      const { result } = renderHook(() => require('@/components/tv/TVGlobalProvider').useTVGlobal(), { wrapper })
      
      const mockStation = {
        id: 'test-station',
        name: 'Test Station',
        genre: 'Test Genre',
        color: '#ff0000',
        streamUrl: 'https://test.com/stream.m3u8',
        embedType: 'hls' as const,
        website: 'https://test.com',
        logo: '📺',
        region: 'ke',
      }
      
      act(() => {
        result.current.playStation(mockStation)
      })
      
      act(() => {
        result.current.stop()
      })
      
      expect(result.current.currentStation).toBeNull()
      expect(result.current.isPlaying).toBe(false)
    })
  })

  describe('TVWidget', () => {
    it('should not render when no station is selected', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TVGlobalProvider>{children}</TVGlobalProvider>
      )
      const { container } = render(<TVWidget />, { wrapper })
      expect(container.firstChild).toBeNull()
    })

    it('should render minimized view when station is playing', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TVGlobalProvider>{children}</TVGlobalProvider>
      )
      const { result } = renderHook(() => require('@/components/tv/TVGlobalProvider').useTVGlobal(), { wrapper })
      
      const mockStation = {
        id: 'test-station',
        name: 'Test Station',
        genre: 'Test Genre',
        color: '#ff0000',
        streamUrl: 'https://test.com/stream.m3u8',
        embedType: 'hls' as const,
        website: 'https://test.com',
        logo: '📺',
        region: 'ke',
      }
      
      act(() => {
        result.current.playStation(mockStation)
      })
      
      const { container } = render(<TVWidget />, { wrapper })
      expect(container.firstChild).not.toBeNull()
      expect(container.firstChild).toHaveClass('fixed')
    })

    it('should show expand/minimize controls', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TVGlobalProvider>{children}</TVGlobalProvider>
      )
      const { result } = renderHook(() => require('@/components/tv/TVGlobalProvider').useTVGlobal(), { wrapper })
      
      const mockStation = {
        id: 'test-station',
        name: 'Test Station',
        genre: 'Test Genre',
        color: '#ff0000',
        streamUrl: 'https://test.com/stream.m3u8',
        embedType: 'hls' as const,
        website: 'https://test.com',
        logo: '📺',
        region: 'ke',
      }
      
      act(() => {
        result.current.playStation(mockStation)
      })
      
      const { container } = render(<TVWidget />)
      const expandButton = container.querySelector('button[aria-label="Expand"]')
      expect(expandButton).toBeInTheDocument()
    })
  })

  describe('HLS Support', () => {
    it('should detect native HLS support', async () => {
      // Mock canPlayType for native HLS support
      Object.defineProperty(HTMLVideoElement.prototype, 'canPlayType', {
        value: vi.fn().mockReturnValue('maybe')
      })
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TVGlobalProvider>{children}</TVGlobalProvider>
      )
      const { result } = renderHook(() => require('@/components/tv/TVGlobalProvider').useTVGlobal(), { wrapper })
      
      const mockStation = {
        id: 'test-station',
        name: 'Test Station',
        genre: 'Test Genre',
        color: '#ff0000',
        streamUrl: 'https://test.com/stream.m3u8',
        embedType: 'hls' as const,
        website: 'https://test.com',
        logo: '📺',
        region: 'ke',
      }
      
      act(() => {
        result.current.playStation(mockStation)
      })
      
      expect(HTMLVideoElement.prototype.canPlayType).toHaveBeenCalledWith('application/vnd.apple.mpegurl')
    })
  })
})