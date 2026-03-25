import { ResearchOutputType } from '@prisma/client';
import { FIELD_MAP } from './researchOutputFieldMap';
import type { AuthorObject } from '@/lib/researchOutputTypes';

export type ResearchOutputMeta = Record<string, unknown> & {
  editorsJson?: AuthorObject[];
};

export function buildMetaForType(
  type: ResearchOutputType,
  formValues: Record<string, unknown>,
  existingMetaJson: Record<string, unknown> = {},
): Record<string, unknown> {
  const mapConfig = FIELD_MAP[type];
  if (!mapConfig) {
    return existingMetaJson;
  }

  const newMeta: Record<string, unknown> = { ...existingMetaJson };

  // Strip keys from OTHER map configs to prevent cross-contamination when changing types
  const allKnownKeys = new Set<string>();
  for (const t of Object.keys(FIELD_MAP) as ResearchOutputType[]) {
    FIELD_MAP[t].fields.forEach((f) => allKnownKeys.add(f.key));
    if (FIELD_MAP[t].hasEditors) allKnownKeys.add('editorsJson');
  }

  for (const key of allKnownKeys) {
    // Determine if the *current* type needs this key
    const isCurrentTypeKey =
      mapConfig.fields.some((f) => f.key === key) ||
      (key === 'editorsJson' && mapConfig.hasEditors);

    if (isCurrentTypeKey) {
      if (formValues[key] !== undefined && formValues[key] !== '') {
        newMeta[key] = formValues[key];
      } else {
        delete newMeta[key];
      }
    } else {
      // Key belongs to our map system, but NOT to the current type. Remove it from meta.
      delete newMeta[key];
    }
  }

  return newMeta;
}

export function extractMetaForType(
  type: ResearchOutputType,
  metaJson: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!metaJson) return {};

  const mapConfig = FIELD_MAP[type];
  if (!mapConfig) return {};

  const extracted: Record<string, unknown> = {};

  mapConfig.fields.forEach((field) => {
    if (metaJson[field.key] !== undefined) {
      extracted[field.key] = metaJson[field.key];
    }
  });

  if (mapConfig.hasEditors && metaJson.editorsJson) {
    extracted.editorsJson = metaJson.editorsJson;
  }

  return extracted;
}
