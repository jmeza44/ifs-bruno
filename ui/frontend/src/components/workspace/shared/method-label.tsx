import { cn } from '@/lib/utils';
import { methodTextStyle } from '@/lib/http-method-styles';

export function MethodLabel({ method, className }: { method: string; className?: string }) {
  const upper = method.toUpperCase();
  return (
    <span className={cn('font-mono text-[11px] font-semibold', methodTextStyle(upper), className)}>
      {upper}
    </span>
  );
}
