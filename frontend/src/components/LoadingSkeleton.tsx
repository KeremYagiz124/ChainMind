import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'text' | 'avatar' | 'chart';
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'card', 
  count = 1,
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ${className}`}>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${className}`}>
            <div className="animate-pulse flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        );

      case 'avatar':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        );

      case 'chart':
        return (
          <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ${className}`}>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
              <div className="flex items-end justify-between space-x-2 h-64">
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 rounded"
                    style={{ height: `${Math.random() * 60 + 40}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default LoadingSkeleton;
