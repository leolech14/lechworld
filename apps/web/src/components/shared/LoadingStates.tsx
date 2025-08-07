import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', color = 'blue', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const borderColorClass = `border-${color}-600`;

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 ${borderColorClass} ${sizeClasses[size]}`}></div>
    </div>
  );
}

interface LoadingCardProps {
  rows?: number;
  showAvatar?: boolean;
  className?: string;
}

export function LoadingCard({ rows = 3, showAvatar = false, className = '' }: LoadingCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
      <div className="flex items-start gap-4">
        {showAvatar && (
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          </div>
        )}
        <div className="flex-1 space-y-3">
          {[...Array(rows)].map((_, index) => (
            <div key={index} className="space-y-2">
              {index === 0 ? (
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              ) : (
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface LoadingTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function LoadingTable({ rows = 5, columns = 4, className = '' }: LoadingTableProps) {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(columns)].map((_, index) => (
              <div key={index} className="h-3 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        <div className="divide-y divide-gray-200">
          {[...Array(rows)].map((_, rowIndex) => (
            <div key={rowIndex} className="px-6 py-4">
              <div className="grid grid-cols-4 gap-4">
                {[...Array(columns)].map((_, colIndex) => (
                  <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface LoadingListProps {
  items?: number;
  showIcon?: boolean;
  className?: string;
}

export function LoadingList({ items = 3, showIcon = true, className = '' }: LoadingListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(items)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4 animate-pulse">
          <div className="flex items-center gap-3">
            {showIcon && (
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function LoadingPage({ title = 'Loading...', description, children }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        {children}
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({ visible, message = 'Loading...', fullScreen = false }: LoadingOverlayProps) {
  if (!visible) return null;

  const containerClass = fullScreen
    ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    : 'absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg';

  return (
    <div className={containerClass}>
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
        <LoadingSpinner size="md" className="mb-3" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function LoadingButton({ 
  loading, 
  children, 
  loadingText = 'Loading...', 
  className = '', 
  onClick,
  disabled = false 
}: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className = '', 
  variant = 'text', 
  width, 
  height 
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`animate-pulse bg-gray-200 ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

interface LoadingGridProps {
  items?: number;
  columns?: number;
  className?: string;
}

export function LoadingGrid({ items = 6, columns = 3, className = '' }: LoadingGridProps) {
  const gridColsClass = `grid-cols-${columns}`;
  
  return (
    <div className={`grid ${gridColsClass} gap-4 ${className}`}>
      {[...Array(items)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4 animate-pulse">
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface LoadingFormProps {
  fields?: number;
  className?: string;
}

export function LoadingForm({ fields = 4, className = '' }: LoadingFormProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
      <div className="space-y-6">
        {[...Array(fields)].map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
        <div className="flex gap-3">
          <div className="h-10 bg-gray-300 rounded px-8 w-24"></div>
          <div className="h-10 bg-gray-200 rounded px-8 w-24"></div>
        </div>
      </div>
    </div>
  );
}

// Composite loading state for complex layouts
interface LoadingDashboardProps {
  className?: string;
}

export function LoadingDashboard({ className = '' }: LoadingDashboardProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LoadingTable rows={5} columns={4} />
        </div>
        <div>
          <LoadingCard rows={4} showAvatar={true} />
        </div>
      </div>
    </div>
  );
}

// Export all loading components
export const LoadingStates = {
  Spinner: LoadingSpinner,
  Card: LoadingCard,
  Table: LoadingTable,
  List: LoadingList,
  Page: LoadingPage,
  Overlay: LoadingOverlay,
  Button: LoadingButton,
  Skeleton,
  Grid: LoadingGrid,
  Form: LoadingForm,
  Dashboard: LoadingDashboard,
};