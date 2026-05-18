import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

const { mockGetSession, mockOnAuthStateChange, mockSignOut, mockUnsubscribe } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignOut: vi.fn(),
  mockUnsubscribe: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  },
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
  })

  it('renders null while getSession() is pending', () => {
    mockGetSession.mockReturnValue(new Promise(() => {})) // never resolves

    const { container } = render(
      <AuthProvider>
        <div>children</div>
      </AuthProvider>
    )

    expect(screen.queryByText('children')).toBeNull()
    expect(container.firstChild).toBeNull()
  })

  it('renders children after getSession() resolves with null session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    render(
      <AuthProvider>
        <div>children</div>
      </AuthProvider>
    )

    await screen.findByText('children')
  })

  it('exposes session and user after getSession() resolves', async () => {
    const mockSession = { user: { id: 'user-1', email: 'test@example.com' } }
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })

    let capturedAuth: ReturnType<typeof useAuth> | null = null

    function Consumer() {
      capturedAuth = useAuth()
      return <div>ready</div>
    }

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    await screen.findByText('ready')
    expect(capturedAuth!.session).toEqual(mockSession)
    expect(capturedAuth!.user).toEqual(mockSession.user)
    expect(capturedAuth!.loading).toBe(false)
  })

  it('throws when useAuth() is called outside AuthProvider', () => {
    function BadComponent() {
      useAuth()
      return null
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<BadComponent />)).toThrow('useAuth must be used within AuthProvider')
    spy.mockRestore()
  })

  it('calls supabase.auth.signOut() and clears session', async () => {
    const mockSession = { user: { id: 'user-1', email: 'test@example.com' } }
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
    mockSignOut.mockResolvedValue({ error: null })

    let capturedAuth: ReturnType<typeof useAuth> | null = null

    function Consumer() {
      capturedAuth = useAuth()
      return <div>ready</div>
    }

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    await screen.findByText('ready')

    await act(async () => {
      await capturedAuth!.signOut()
    })

    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(capturedAuth!.session).toBeNull()
  })

  it('cleans up subscription on unmount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    const { unmount } = render(
      <AuthProvider>
        <div>children</div>
      </AuthProvider>
    )

    await screen.findByText('children')
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledOnce()
  })
})
