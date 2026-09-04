/**
 * CustomerSearch Component
 *
 * @description Typeahead search for selecting customers during invoice creation.
 * Displays matching customers within 500ms of typing and offers option to create new customer.
 *
 * @requirements 8.6 Typeahead search with 2+ character trigger
 * @requirements 8.7 Create New Customer option when no match
 * @requirements 19.2 Search results within 500ms
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input, LoadingSpinner } from '../ui';
import { customerService } from '../../services/customerService';
import type { Customer } from '../../types';
import { formatDate } from '../../utils/date';
import { cn } from '../../lib/utils';

export interface CustomerSearchProps {
  /** Currently selected customer */
  selectedCustomer?: Customer;
  /** Callback when a customer is selected */
  onSelect: (customer: Customer) => void;
  /** Callback when user wants to create a new customer */
  onCreateNew: (searchQuery: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Whether this field is required */
  required?: boolean;
}

export function CustomerSearch({
  selectedCustomer,
  onSelect,
  onCreateNew,
  placeholder = 'Search by name or mobile...',
  disabled = false,
  error,
  required = false,
}: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Minimum characters required to trigger search
  const MIN_SEARCH_CHARS = 2;

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < MIN_SEARCH_CHARS) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const customers = await customerService.searchCustomers(query);
      setResults(customers);
      setIsOpen(true);
      setFocusedIndex(-1);
    } catch (err) {
      console.error('Customer search failed:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);

      // Clear any pending search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search to 300ms for responsiveness (within 500ms requirement)
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    },
    [performSearch]
  );

  // Handle customer selection
  const handleSelect = useCallback(
    (customer: Customer) => {
      onSelect(customer);
      setSearchQuery('');
      setIsOpen(false);
      setResults([]);
    },
    [onSelect]
  );

  // Handle create new customer
  const handleCreateNew = useCallback(() => {
    onCreateNew(searchQuery);
    setIsOpen(false);
  }, [onCreateNew, searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      const itemCount = results.length + 1; // +1 for "Create New" option

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % itemCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < results.length) {
            handleSelect(results[focusedIndex]!);
          } else if (focusedIndex === results.length) {
            handleCreateNew();
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    },
    [isOpen, results, focusedIndex, handleSelect, handleCreateNew]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Clear search when customer is deselected externally
  useEffect(() => {
    if (!selectedCustomer) {
      setSearchQuery('');
    }
  }, [selectedCustomer]);

  // If a customer is selected, show their info instead of search
  if (selectedCustomer) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-surface-700">
          Customer
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="flex items-center justify-between p-3 border border-surface-300 rounded-md bg-surface-50">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-surface-900 truncate">
              {selectedCustomer.name}
            </p>
            <p className="text-sm text-surface-600">
              {selectedCustomer.mobile} • {selectedCustomer.eventType} •{' '}
              {formatDate(selectedCustomer.eventDate)}
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onSelect(undefined as unknown as Customer)}
              className="ml-3 text-surface-500 hover:text-surface-700 transition-colors"
              aria-label="Remove customer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        label="Customer"
        value={searchQuery}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (searchQuery.length >= MIN_SEARCH_CHARS && results.length > 0) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        required={required}
        fullWidth
        autoComplete="off"
        rightIcon={isLoading ? <LoadingSpinner size="sm" /> : undefined}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="customer-search-results"
      />

      {/* Search results dropdown */}
      {isOpen && (
        <ul
          id="customer-search-results"
          role="listbox"
          className="absolute z-20 w-full mt-1 max-h-64 overflow-auto bg-white border border-surface-200 rounded-md shadow-lg"
        >
          {results.length > 0 ? (
            <>
              {results.map((customer, index) => (
                <li
                  key={customer.id}
                  role="option"
                  aria-selected={focusedIndex === index}
                  onClick={() => handleSelect(customer)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'px-3 py-2 cursor-pointer transition-colors',
                    focusedIndex === index
                      ? 'bg-primary-50 text-primary-900'
                      : 'hover:bg-surface-50'
                  )}
                >
                  <p className="font-medium text-surface-900">{customer.name}</p>
                  <p className="text-sm text-surface-600">
                    {customer.mobile} • {customer.eventType} • {customer.location}
                  </p>
                </li>
              ))}
              {/* Create new option */}
              <li
                role="option"
                aria-selected={focusedIndex === results.length}
                onClick={handleCreateNew}
                onMouseEnter={() => setFocusedIndex(results.length)}
                className={cn(
                  'px-3 py-2 cursor-pointer border-t border-surface-200 transition-colors',
                  focusedIndex === results.length
                    ? 'bg-primary-50 text-primary-900'
                    : 'hover:bg-surface-50'
                )}
              >
                <p className="font-medium text-primary-600">
                  + Create New Customer "{searchQuery}"
                </p>
              </li>
            </>
          ) : searchQuery.length >= MIN_SEARCH_CHARS && !isLoading ? (
            <li
              role="option"
              aria-selected={focusedIndex === 0}
              onClick={handleCreateNew}
              onMouseEnter={() => setFocusedIndex(0)}
              className={cn(
                'px-3 py-2 cursor-pointer transition-colors',
                focusedIndex === 0
                  ? 'bg-primary-50 text-primary-900'
                  : 'hover:bg-surface-50'
              )}
            >
              <p className="text-surface-600">No customers found</p>
              <p className="font-medium text-primary-600 mt-1">
                + Create New Customer "{searchQuery}"
              </p>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

export default CustomerSearch;
