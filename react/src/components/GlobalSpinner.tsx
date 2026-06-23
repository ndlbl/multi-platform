import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export default function GlobalSpinner() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const busy = isFetching + isMutating > 0;

  if (!busy) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
      <div className="h-full w-1/3 animate-pulse bg-indigo-600 [animation-duration:1s]" />
    </div>
  );
}
