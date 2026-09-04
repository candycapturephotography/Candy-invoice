/**
 * CandyCapture Photography Invoice Application
 * CustomerSearch Component
 *
 * Typeahead search component for selecting customers during invoice creation.
 * Provides search with 2+ character trigger and "Create New Customer" option.
 *
 * @requirements 8.6 Search with 2+ characters and display within 500ms
 * @requirements 8.7 Option to create new customer when no match found
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Customer } from '../../types/models';
import { Input, LoadingSpinner } from '../ui';
import { cn } from '../../lib/utils';
import { formatDate } from '../../utils/date';

export interface CustomerSearchProps {
  /** Callback to search customers (should return within 500ms) */
  onSearch: (query: string) => Promise<Customer[]> | Customer[];
  /** Callback when a customer is selected */
  onSelect: (customer: Customer) => void;
  /** Callback when "Create New Customer" is clicked */
  onCreateNew?: () => void;
  /** Currently selected customer (for display) */
  selectedCustomer?: Customer | null;
  /** Callback to clear selection */
  onClear?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Label text */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Minimum characters to trigger search (default: 2) */
  minSearchLength?: number;
  /** Search debounce delay in ms (default: 200ms to ensure results within 500ms) */
  searchDebounceMs?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CustomerSearch Component
 *
 * Provides typeahead search for customers during invoice creation with:
 * - Search triggers at 2+ characters
 * - Results displayed within 500ms
 * - "Create New Customer" option when no match found
 * - Displays selected customer with option to clear
 */
export function CustomerSearch({
  onSearch,
  onSelect,
  onCreateNew,
  selectedCustomer,
  onClear,
  placeholder = 'Search by name or mobile...',
  disabled = false,
  error,
  label = 'Customer',
  required = false,
  minSearchLength = 2,
  searchDebounceMs = 200,
  className,
}: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Perform search with debounce
   * @requirements 8.6 Display matching customers within 500ms
   */
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minSearchLength) {
        setResults([]);
        setIsDropdownOpen(false);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await onSearch(searchQuery);
        setResults(searchResults);
        setIsDropdownOpen(true);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error('Customer search failed:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [onSearch, minSearchLength]
  );

  /**
   * Handle input change with debounce
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the search
      debounceTimerRef.current = setTimeout(() => {
        performSearch(value);
      }, searchDebounceMs);
    },
    [performSearch, searchDebounceMs]
  );

  /**
   * Handle customer selection
   */
  const handleSelect = useCallback(
    (customer: Customer) => {
      onSelect(customer);
      setQuery('');
      setResults([]);
      setIsDropdownOpen(false);
    },
    [onSelect]
  );

  /**
   * Handle create new customer
   */
  const handleCreateNew = useCallback(() => {
    onCreateNew?.();
    setQuery('');
    setResults([]);
    setIsDropdownOpen(false);
  }, [onCreateNew]);

  /**
   * Handle clearing the selection
   */
  const handleClear = useCallback(() => {
    onClear?.();
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  }, [onClear]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isDropdownOpen) return;

      const totalItems = results.length + (onCreateNew ? 1 : 0);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < totalItems - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            if (highlightedIndex < results.length) {
              const customer = results[highlightedIndex];
              if (customer) {
                handleSelect(customer);
              }
            } else if (onCreateNew) {
              handleCreateNew();
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsDropdownOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [
      isDropdownOpen,
      results,
      highlightedIndex,
      handleSelect,
      handleCreateNew,
      onCreateNew,
    ]
  );

  /**
   * Handle click outside to close dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Show "Create New" option when no results and query has sufficient length
  const showCreateNewOption = useMemo(
    () =>
      onCreateNew &&
      query.length >= minSearchLength &&
      results.length === 0 &&
      !isSearching,
    [onCreateNew, query.length, minSearchLength, results.length, isSearching]
  );

  // If customer is selected, show selection view
  if (selectedCustomer) {
    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label className="text-sm font-medium text-surface-700">
            {label}
            {required && (
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div
          className={cn(
            'flex items-center justify-between p-3 rounded-md border bg-surface-50',
            'border-surface-300',
            error && 'border-red-500'
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-surface-900 truncate">
                  {selectedCustomer.name}
                </span>
                <span className="text-sm text-surface-500 truncate">
                  {selectedCustomer.mobile} • {selectedCustomer.eventType}
                </span>
              </div>
            </div>
          </div>

          {onClear && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'ml-2 p-1.5 rounded-md text-surface-500 transition-colors',
                'hover:bg-surface-200 hover:text-surface-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
              aria-label="Clear selection"
              title="Clear selection"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

  // Search input view
  return (
    <div className={cn('relative', className)}>
      <Input
        ref={inputRef}
        label={label}
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0 || showCreateNewOption) {
            setIsDropdownOpen(true);
          }
        }}
        disabled={disabled}
        required={required}
        error={error}
        fullWidth
        leftIcon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
        rightIcon={
          isSearching ? (
            <LoadingSpinner size="sm" className="text-primary-500" />
          ) : undefined
        }
        helperText={
          query.length > 0 && query.length < minSearchLength
            ? `Type ${minSearchLength - query.length} more character${minSearchLength - query.length > 1 ? 's' : ''} to search`
            : undefined
        }
      />

      {/* Dropdown Results */}
      {isDropdownOpen && (results.length > 0 || showCreateNewOption) && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-surface-200',
            'max-h-72 overflow-y-auto'
          )}
          role="listbox"
        >
          {/* Customer Results */}
          {results.map((customer, index) => (
            <div
              key={customer.id}
              role="option"
              aria-selected={highlightedIndex === index}
              className={cn(
                'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
                highlightedIndex === index
                  ? 'bg-primary-50 text-primary-900'
                  : 'hover:bg-surface-50',
                index !== results.length - 1 && 'border-b border-surface-100'
              )}
              onClick={() => handleSelect(customer)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-surface-900 truncate">
                  {customer.name}
                </div>
                <div className="text-sm text-surface-500 truncate">
                  {customer.mobile} • {customer.eventType} • {formatDate(customer.eventDate)}
                </div>
              </div>
              {customer.invoiceCount > 0 && (
                <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full flex-shrink-0">
                  {customer.invoiceCount} invoice{customer.invoiceCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          ))}

          {/* Create New Customer Option */}
          {showCreateNewOption && (
            <div
              role="option"
              aria-selected={highlightedIndex === results.length}
              className={cn(
                'flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors',
                'border-t border-surface-200',
                highlightedIndex === results.length
                  ? 'bg-primary-50 text-primary-900'
                  : 'hover:bg-surface-50'
              )}
              onClick={handleCreateNew}
              onMouseEnter={() => setHighlightedIndex(results.length)}
            >
              <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-primary-600">
                  Create New Customer
                </div>
                <div className="text-sm text-surface-500">
                  No customer found matching &ldquo;{query}&rdquo;
                </div>
              </div>
            </div>
          )}

          {/* No results state (when create new is not available) */}
          {!showCreateNewOption &&
            results.length === 0 &&
            query.length >= minSearchLength &&
            !isSearching && (
              <div className="px-3 py-4 text-center text-surface-500">
                <p>No customers found matching &ldquo;{query}&rdquo;</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default CustomerSearch;
