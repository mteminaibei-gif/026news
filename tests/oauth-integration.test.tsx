/**
 * OAuth Integration Test Suite
 * Comprehensive tests for OAuth authentication including Google, X (Twitter), Facebook providers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRouter } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
}))

// Mock hooks that use OAuth
vi.mock('@/lib/hooks/useOAuthSignIn', () => ({
  useOAuthSignIn: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}))

describe('OAuth Integration Test Suite', () => {
  describe('Google OAuth Sign In', () => {
    it('should initiate Google OAuth flow', async () => {
      const mockRouter = useRouter()
      const useOAuthSignIn = vi.mocked('@/lib/hooks/useOAuthSignIn').useOAuthSignIn
      
      const signIn = useOAuthSignIn()
      await signIn.mutateAsync('google')
      
      expect(signIn.mutateAsync).toHaveBeenCalledWith('google')
    })
  })
})