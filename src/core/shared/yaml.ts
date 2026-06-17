import yaml from 'js-yaml';

export function dumpYaml(obj: unknown): string {
  return yaml.dump(obj, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}
