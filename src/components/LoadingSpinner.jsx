/**
 * Simple loading spinner for "Typing..." indication.
 */
export default function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2">
      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></span>
      <span>Typing...</span>
    </div>
  );
}