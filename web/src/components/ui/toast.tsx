import toast from 'react-hot-toast';

export function showToast(message: string, type: 'success' | 'error' | 'loading' | 'info' = 'info') {
  switch (type) {
    case 'success': return toast.success(message);
    case 'error': return toast.error(message);
    case 'loading': return toast.loading(message);
    default: return toast(message);
  }
}

export { toast };
