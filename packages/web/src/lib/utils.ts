/**
 * CandyCapture Photography Invoice Application
 * Utility functions for class name management
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 * This allows for conditional classes and proper Tailwind class merging
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
