import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { RequireProfile } from '@/components/layout/RequireProfile'
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen'
import { SignUpScreen } from '@/screens/auth/SignUpScreen'
import { SignInScreen } from '@/screens/auth/SignInScreen'
import { CheckInboxScreen } from '@/screens/auth/CheckInboxScreen'
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen'
import { AuthCallbackScreen } from '@/screens/auth/AuthCallbackScreen'
import { HomeScreen } from '@/screens/home/HomeScreen'

// Implemented in plan 01-05
const OnboardingWelcomeScreen = () => null
const OnboardingProfileScreen = () => null
const OnboardingPCOSScreen = () => null
const OnboardingDoneScreen = () => null
const ProfileScreen = () => null

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes — no tab bar */}
          <Route element={<AuthLayout />}>
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/signup" element={<SignUpScreen />} />
            <Route path="/signin" element={<SignInScreen />} />
            <Route path="/check-inbox" element={<CheckInboxScreen />} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />
            <Route path="/auth/callback" element={<AuthCallbackScreen />} />
          </Route>

          {/* Authenticated: onboarding (profile not yet complete) */}
          <Route element={<RequireAuth />}>
            <Route path="/onboarding/welcome" element={<OnboardingWelcomeScreen />} />
            <Route path="/onboarding/profile" element={<OnboardingProfileScreen />} />
            <Route path="/onboarding/pcos" element={<OnboardingPCOSScreen />} />
            <Route path="/onboarding/done" element={<OnboardingDoneScreen />} />
          </Route>

          {/* Authenticated + profile complete: main app with tab bar */}
          <Route element={<RequireProfile />}>
            <Route element={<AppLayout />}>
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
            </Route>
          </Route>

          <Route index element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
