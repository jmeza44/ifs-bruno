import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { ALL_VALUES } from '@/hooks/useProjectionFilters';

export type ProjectionFiltersBarProps = {
  component: string | null;
  onComponentChange: (value: string | null) => void;
  components: string[];
  apiClass: string;
  onApiClassChange: (value: string) => void;
  apiClasses: string[];
  layer: string;
  onLayerChange: (value: string) => void;
  layers: string[];
  showDeprecated: boolean;
  onShowDeprecatedChange: (value: boolean) => void;
};

export function ProjectionFiltersBar({
  component,
  onComponentChange,
  components,
  apiClass,
  onApiClassChange,
  apiClasses,
  layer,
  onLayerChange,
  layers,
  showDeprecated,
  onShowDeprecatedChange,
}: ProjectionFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Combobox
        items={components}
        itemToStringLabel={(item: string) => item}
        value={component}
        onValueChange={(value) => onComponentChange(value as string | null)}
      >
        <ComboboxInput placeholder="Component" showClear className="h-7 w-32">
          <ComboboxContent side="bottom" align="start">
            <ComboboxEmpty>No components found</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </ComboboxInput>
      </Combobox>

      <Select value={apiClass} onValueChange={onApiClassChange}>
        <SelectTrigger size="sm">
          <SelectValue placeholder="ApiClass" />
        </SelectTrigger>
        <SelectContent position="popper" side="bottom" align="start">
          <SelectItem value={ALL_VALUES}>All API classes</SelectItem>
          {apiClasses.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={layer} onValueChange={onLayerChange}>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Layer" />
        </SelectTrigger>
        <SelectContent position="popper" side="bottom" align="start">
          <SelectItem value={ALL_VALUES}>All layers</SelectItem>
          {layers.map((l) => (
            <SelectItem key={l} value={l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Toggle
        size="sm"
        variant="outline"
        className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        pressed={showDeprecated}
        onPressedChange={onShowDeprecatedChange}
        aria-label="Show deprecated projections"
      >
        Show deprecated
      </Toggle>
    </div>
  );
}
