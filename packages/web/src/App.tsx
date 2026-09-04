import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// Layout
import { MainLayout } from './components/layout';

// Pages
import { DashboardPage, InvoicesPage, ServicesPage, SettingsPage } from './pages';

// Customer components
import { CustomerList } from './components/customers';

// Toast provider
import { ToastProvider } from './components/ui/Toast';

/**
 * CandyCapture Photography Invoice Application
 *
 * Main application component that sets up routing and providers.
 * The app uses React Router for navigation and is wrapped with
 * ToastProvider for notifications.
 */
function App() {
  return (
    <Router>
      <ToastProvider>
        <Routes>
          {/* Routes wrapped in MainLayout */}
          <Route element={<MainLayout />}>
            {/* Dashboard - Home */}
            <Route path="/" element={<DashboardPage />} />

            {/* Invoice routes - InvoicesPage handles all modes internally */}
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/new" element={<InvoicesPage />} />
            <Route path="/invoices/:id" element={<InvoicesPage />} />
            <Route path="/invoices/:id/edit" element={<InvoicesPage />} />

            {/* Customer routes */}
            <Route path="/customers" element={<CustomersPageWrapper />} />

            {/* Services routes */}
            <Route path="/services" element={<ServicesPage />} />

            {/* Settings routes */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </Router>
  );
}

/**
 * Wrapper component for CustomerList to provide required props
 * This bridges the gap until a full CustomersPage is created
 */
function CustomersPageWrapper() {
  // TODO: Replace with actual customer data from service
  // For now, using empty array - CustomerList handles empty state
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Customers</h1>
          <p className="text-surface-500 mt-1">
            Manage your customers and view their invoice history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            // TODO: Open customer create modal/form
          }}
          className="flex items-center gap-2 px-4 py-2 text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Customer
        </button>
      </div>
      <CustomerList
        customers={[]}
        isLoading={false}
        onCustomerSelect={(customer) => {
          // Navigate to customer details or open modal
          console.log('Selected customer:', customer);
        }}
        onEdit={(customer) => {
          // Open edit modal/form
          console.log('Edit customer:', customer);
        }}
        onDelete={(customer) => {
          // Show delete confirmation
          console.log('Delete customer:', customer);
        }}
      />
    </div>
  );
}

/**
 * 404 Not Found page component
 */
function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary-500">404</h1>
        <p className="mb-8 text-xl text-surface-600">Page not found</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default App;
