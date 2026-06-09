import { cn } from '@/lib/utils';
import { methodTextStyle } from '@/lib/http-method-styles';

export function MethodLabel({ method }: { method: string }) {
  const upper = method.toUpperCase();
  return (
    <span
      className={cn('w-12 shrink-0 font-mono text-[11px] font-semibold', methodTextStyle(upper))}
    >
      {upper}
    </span>
  );
}
