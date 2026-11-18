const files = import.meta.glob('/docs/resource/icon_tag/*.{svg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export interface SubjectIconEntry {
  key: string;
  label: string;
  url: string;
}

export const SUBJECT_ICONS: SubjectIconEntry[] = Object.entries(files)
  .map(([p, url]) => {
    const key = p.split('/').pop()!;
    const label = key
      .replace(/\.(svg|png)$/i, '')
      .replace(/_/g, ' ');
    return { key, label, url };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

const ICON_MAP = new Map(SUBJECT_ICONS.map((item) => [item.key, item.url]));

export function getSubjectIconUrl(key: string): string | undefined {
  return ICON_MAP.get(key) ?? SUBJECT_ICONS[0]?.url;
}
