import { splitByMatch, splitByRanges } from '@/lib/text-highlight';

export type HighlightedTextProps = {
  text: string;
  searchTerm: string;
  /** Fuzzy match ranges (from fuzzySearch/fuzzyMatch) to highlight instead of a plain substring. */
  ranges?: [number, number][];
  className?: string;
  title?: string;
};

export function HighlightedText({
  text,
  searchTerm,
  ranges,
  className,
  title,
}: HighlightedTextProps) {
  const segments = ranges ? splitByRanges(text, ranges) : splitByMatch(text, searchTerm);
  return (
    <span className={className} title={title}>
      {segments.map((segment, index) =>
        segment.matched ? (
          <span key={index} className="text-primary!">
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
