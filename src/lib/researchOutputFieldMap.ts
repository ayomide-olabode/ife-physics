import { ResearchOutputType } from '@prisma/client';

export type FieldDefinition = {
  key: string;
  label: string;
  inputType: 'text' | 'number';
  required?: boolean;
};

export type FieldMapValue = {
  fields: FieldDefinition[];
  hasEditors?: boolean;
};

export const FIELD_MAP: Record<ResearchOutputType, FieldMapValue> = {
  [ResearchOutputType.BOOK]: {
    fields: [
      { key: 'pagesFrom', label: 'Pages From', inputType: 'text' },
      { key: 'pagesTo', label: 'Pages To', inputType: 'text' },
      { key: 'volume', label: 'Volume', inputType: 'text' },
      { key: 'edition', label: 'Edition', inputType: 'text' },
      { key: 'city', label: 'City', inputType: 'text' },
      { key: 'publisher', label: 'Publisher', inputType: 'text', required: true },
      { key: 'month', label: 'Month', inputType: 'text' },
      { key: 'day', label: 'Day', inputType: 'text' },
    ],
    hasEditors: true,
  },
  [ResearchOutputType.BOOK_CHAPTER]: {
    fields: [
      { key: 'bookTitle', label: 'Book Title', inputType: 'text', required: true },
      { key: 'pagesFrom', label: 'Pages From', inputType: 'text' },
      { key: 'pagesTo', label: 'Pages To', inputType: 'text' },
      { key: 'volume', label: 'Volume', inputType: 'text' },
      { key: 'edition', label: 'Edition', inputType: 'text' },
      { key: 'city', label: 'City', inputType: 'text' },
      { key: 'publisher', label: 'Publisher', inputType: 'text', required: true },
      { key: 'month', label: 'Month', inputType: 'text' },
      { key: 'day', label: 'Day', inputType: 'text' },
    ],
    hasEditors: true,
  },
  [ResearchOutputType.CONFERENCE_PAPER]: {
    fields: [
      { key: 'proceedingsTitle', label: 'Proceedings Title', inputType: 'text', required: true },
      { key: 'pagesFrom', label: 'Pages From', inputType: 'text' },
      { key: 'pagesTo', label: 'Pages To', inputType: 'text' },
      { key: 'city', label: 'City', inputType: 'text' },
      { key: 'publisher', label: 'Publisher', inputType: 'text' },
      { key: 'month', label: 'Month', inputType: 'text' },
      { key: 'day', label: 'Day', inputType: 'text' },
    ],
    hasEditors: true,
  },
  [ResearchOutputType.DATA]: {
    fields: [
      { key: 'publisher', label: 'Publisher/Repository', inputType: 'text', required: true },
      { key: 'month', label: 'Month', inputType: 'text' },
      { key: 'day', label: 'Day', inputType: 'text' },
    ],
    hasEditors: false,
  },
  [ResearchOutputType.JOURNAL_ARTICLE]: {
    fields: [
      { key: 'journalName', label: 'Journal Name', inputType: 'text', required: true },
      { key: 'pagesFrom', label: 'Pages From', inputType: 'text' },
      { key: 'pagesTo', label: 'Pages To', inputType: 'text' },
      { key: 'volume', label: 'Volume', inputType: 'text', required: true },
      { key: 'issue', label: 'Issue', inputType: 'text' },
      { key: 'month', label: 'Month', inputType: 'text' },
      { key: 'day', label: 'Day', inputType: 'text' },
    ],
    hasEditors: false,
  },
  [ResearchOutputType.MONOGRAPH]: {
    fields: [
      { key: 'pagesFrom', label: 'Pages From', inputType: 'text' },
      { key: 'pagesTo', label: 'Pages To', inputType: 'text' },
      { key: 'publisher', label: 'Publisher', inputType: 'text', required: true },
      { key: 'month', label: 'Month', inputType: 'text' },
      { key: 'day', label: 'Day', inputType: 'text' },
    ],
    hasEditors: true,
  },
  [ResearchOutputType.PATENT]: {
    fields: [
      { key: 'pagesFrom', label: 'Pages From', inputType: 'text' },
      { key: 'pagesTo', label: 'Pages To', inputType: 'text' },
      { key: 'issuer', label: 'Issuer/Patent Office', inputType: 'text', required: true },
      { key: 'institution', label: 'Institution', inputType: 'text' },
      { key: 'country', label: 'Country/Jurisdiction', inputType: 'text' },
      { key: 'number', label: 'Number', inputType: 'text', required: true },
      { key: 'assignee', label: 'Assignee', inputType: 'text' },
      { key: 'month', label: 'Month', inputType: 'text' },
      { key: 'day', label: 'Day', inputType: 'text' },
    ],
    hasEditors: false,
  },
  [ResearchOutputType.REPORT]: {
    fields: [
      { key: 'pagesFrom', label: 'Pages From', inputType: 'text' },
      { key: 'pagesTo', label: 'Pages To', inputType: 'text' },
      { key: 'city', label: 'City', inputType: 'text' },
      {
        key: 'institution',
        label: 'Institution/Issuing Organization',
        inputType: 'text',
        required: true,
      },
      { key: 'month', label: 'Month', inputType: 'text' },
      { key: 'day', label: 'Day', inputType: 'text' },
    ],
    hasEditors: false,
  },
  [ResearchOutputType.SOFTWARE]: {
    fields: [
      { key: 'pagesFrom', label: 'Pages From', inputType: 'text' },
      { key: 'pagesTo', label: 'Pages To', inputType: 'text' },
      { key: 'city', label: 'City', inputType: 'text' },
      { key: 'publisher', label: 'Publisher/Repository', inputType: 'text' },
      { key: 'version', label: 'Version', inputType: 'text' },
      { key: 'month', label: 'Month', inputType: 'text' },
      { key: 'day', label: 'Day', inputType: 'text' },
    ],
    hasEditors: false,
  },
  [ResearchOutputType.THESIS]: {
    fields: [
      { key: 'pagesFrom', label: 'Pages From', inputType: 'text' },
      { key: 'pagesTo', label: 'Pages To', inputType: 'text' },
      { key: 'city', label: 'City', inputType: 'text' },
      { key: 'institution', label: 'Institution', inputType: 'text', required: true },
      { key: 'department', label: 'Department', inputType: 'text' },
      { key: 'thesisType', label: 'Degree Type', inputType: 'text', required: true },
      { key: 'month', label: 'Month', inputType: 'text' },
      { key: 'day', label: 'Day', inputType: 'text' },
    ],
    hasEditors: false,
  },
  [ResearchOutputType.OTHER]: {
    fields: [],
    hasEditors: false,
  },
};
