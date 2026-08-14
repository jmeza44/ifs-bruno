import { splitByMatch } from '@/lib/text-highlight';
import { cn } from '@/lib/utils';

export type HighlightedTextProps = {
  text: string;
  searchTerm: string;
  className?: string;
  title?: string;
};

export function HighlightedText({ text, searchTerm, className, title }: HighlightedTextProps) {
  const segments = splitByMatch(text, searchTerm);
  return (
    <span className={className} title={title}>
      {segments.map((segment, index) =>
        segment.matched ? (
          <span key={index} className={cn('text-primary')}>
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
