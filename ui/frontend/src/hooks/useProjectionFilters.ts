import { useMemo, useState } from 'react';
import { distinctSorted, rankProjections } from '@/lib/projection-search';
import type { IfsProjection } from '@/lib/types';

export const ALL_VALUES = '__all__';

export function useProjectionFilters(projections: IfsProjection[]) {
  const [component, setComponent] = useState<string | null>(null);
  const [apiClass, setApiClass] = useState(ALL_VALUES);
  const [layer, setLayer] = useState(ALL_VALUES);
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const components = useMemo(
    () => distinctSorted(projections.map((p) => p.Component)),
    [projections],
  );
  const apiClasses = useMemo(
    () => distinctSorted(projections.map((p) => p.ApiClass)),
    [projections],
  );
  const layers = useMemo(() => distinctSorted(projections.map((p) => p.Layer)), [projections]);

  const filteredProjections = useMemo(
    () =>
      projections.filter((p) => {
        if (component !== null && p.Component !== component) return false;
        if (apiClass !== ALL_VALUES && p.ApiClass !== apiClass) return false;
        if (layer !== ALL_VALUES && p.Layer !== layer) return false;
        if (!showDeprecated && p.Deprecated === 'TRUE') return false;
        return true;
      }),
    [projections, component, apiClass, layer, showDeprecated],
  );

  const rankedProjections = useMemo(
    () => rankProjections(filteredProjections, searchTerm),
    [filteredProjections, searchTerm],
  );

  return {
    component,
    setComponent,
    apiClass,
    setApiClass,
    layer,
    setLayer,
    showDeprecated,
    setShowDeprecated,
    searchTerm,
    setSearchTerm,
    components,
    apiClasses,
    layers,
    rankedProjections,
  };
}
