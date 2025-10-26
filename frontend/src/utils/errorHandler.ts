import toast from 'react-hot-toast';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export const handleApiError = (error: any): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error.response) {
    // HTTP error response
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return new AppError(data.error || 'Invalid request', 'BAD_REQUEST', data);
      case 401:
        return new AppError('Authentication required', 'UNAUTHORIZED', data);
      case 403:
        return new AppError('Access denied', 'FORBIDDEN', data);
      case 404:
        return new AppError(data.error || 'Resource not found', 'NOT_FOUND', data);
      case 429:
        return new AppError('Too many requests. Please try again later', 'RATE_LIMIT', data);
      case 500:
        return new AppError('Server error. Please try again', 'SERVER_ERROR', data);
      case 503:
        return new AppError('Service temporarily unavailable', 'SERVICE_UNAVAILABLE', data);
      default:
        return new AppError(data.error || 'An error occurred', 'API_ERROR', data);
    }
  }

  if (error.request) {
    // Network error
    return new AppError('Network error. Please check your connection', 'NETWORK_ERROR');
  }

  // Generic error
  return new AppError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    error
  );
};

export const showErrorToast = (error: any, customMessage?: string) => {
  const appError = handleApiError(error);
  toast.error(customMessage || appError.message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#EF4444',
      color: '#fff',
    },
    icon: '❌',
  });
  return appError;
};

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#10B981',
      color: '#fff',
    },
    icon: '✅',
  });
};

export const showInfoToast = (message: string) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
    icon: 'ℹ️',
  });
};

export const showWarningToast = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#F59E0B',
      color: '#fff',
    },
    icon: '⚠️',
  });
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    position: 'top-right',
  });
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};
