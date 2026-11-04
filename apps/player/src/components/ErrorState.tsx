import { EmptyState } from './EmptyState';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** A failed load. The calm default copy never shows raw error text to players. */
export function ErrorState({
  title = 'Something went wrong',
  message = 'Check your connection and try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <EmptyState
      title={title}
      message={message}
      actionLabel={onRetry === undefined ? undefined : 'Try again'}
      onAction={onRetry}
    />
  );
}
