/**
 * CandyCapture Photography Invoice Application
 * Services Page
 *
 * @description Page component for managing photography services
 * @requirements 6.1-6.11 Service management
 */

import { ServiceManager } from '../components/services';
import { ToastProvider } from '../components/ui';

/**
 * ServicesPage - Page for managing photography services
 *
 * Wraps ServiceManager component with page-level layout and toast provider
 */
export function ServicesPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-50">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-surface-900 md:text-3xl">
              Service Management
            </h1>
            <p className="mt-1 text-sm text-surface-600">
              Configure photography services available for invoices
            </p>
          </div>

          {/* Service Manager Component */}
          <ServiceManager />
        </div>
      </div>
    </ToastProvider>
  );
}

export default ServicesPage;
