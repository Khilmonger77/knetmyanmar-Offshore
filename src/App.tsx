import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { BankConfigProvider } from './contexts/BankConfigContext'
import { AppLayout } from './components/AppLayout'
import { PublicLayout } from './components/PublicLayout'
import { AccountDetailPage } from './pages/AccountDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { DebitCardPage } from './pages/DebitCardPage'
import { HomePage } from './pages/HomePage'
import { PersonalPage } from './pages/PersonalPage'
import { SmallBusinessPage } from './pages/SmallBusinessPage'
import { WealthPage } from './pages/WealthPage'
import { InvestPage } from './pages/InvestPage'
import { PayTransferPage } from './pages/PayTransferPage'
import { ProtectedRoute } from './pages/ProtectedRoute'
import { SettingsPage } from './pages/SettingsPage'
import { KycUploadPage } from './pages/KycUploadPage'
import { SupportPage } from './pages/SupportPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { AdminApprovalsPage } from './pages/AdminApprovalsPage'
import { AdminTransactionsPage } from './pages/AdminTransactionsPage'
import { AdminCardsPage } from './pages/AdminCardsPage'
import { AdminBankSettingsPage } from './pages/AdminBankSettingsPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminDepositsFeesPage } from './pages/AdminDepositsFeesPage'
import { AdminKycPage } from './pages/AdminKycPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminLoansPage } from './pages/AdminLoansPage'
import { AdminSearchPage } from './pages/AdminSearchPage'
import { AdminSupportTicketsPage } from './pages/AdminSupportTicketsPage'
import { AdminCustomerDetailPage } from './pages/AdminCustomerDetailPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AdminWithdrawalsPage } from './pages/AdminWithdrawalsPage'
import { AdminOtpPolicyPage } from './pages/AdminOtpPolicyPage'

export default function App() {
  return (
    <AuthProvider>
      <BankConfigProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/search" element={<AdminSearchPage />} />
            <Route path="/admin/loans" element={<AdminLoansPage />} />
            <Route path="/admin/cards" element={<AdminCardsPage />} />
            <Route path="/admin/support" element={<AdminSupportTicketsPage />} />
            <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
            <Route path="/admin/approvals" element={<AdminApprovalsPage />} />
            <Route
              path="/admin/users/:userId"
              element={<AdminCustomerDetailPage />}
            />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
            <Route
              path="/admin/deposits-fees"
              element={<AdminDepositsFeesPage />}
            />
            <Route path="/admin/kyc" element={<AdminKycPage />} />
            <Route path="/admin/otp-policy" element={<AdminOtpPolicyPage />} />
            <Route path="/admin/settings" element={<AdminBankSettingsPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />

            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/personal" element={<PersonalPage />} />
              <Route path="/small-business" element={<SmallBusinessPage />} />
              <Route path="/wealth" element={<WealthPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="accounts/:accountId" element={<AccountDetailPage />} />
                <Route path="debit-card" element={<DebitCardPage />} />
                <Route path="pay" element={<PayTransferPage />} />
                <Route path="invest" element={<InvestPage />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="kyc" element={<KycUploadPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </BankConfigProvider>
    </AuthProvider>
  )
}
