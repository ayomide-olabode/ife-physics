'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { formatFullName } from '@/lib/name';
import { YearSelect } from '@/components/forms/YearSelect';
import { MonthSelect } from '@/components/forms/MonthSelect';
import { DaySelect } from '@/components/forms/DaySelect';
import { RESEARCH_OUTPUT_TYPE_OPTIONS } from '@/lib/options';
import { toastSuccess, toastError } from '@/lib/toast';
import {
  createMyResearchOutput,
  updateMyResearchOutput,
} from '@/server/actions/profileResearchOutputs';
import { lookupCrossrefByDoi } from '@/server/actions/crossrefLookup';
import { linkAuthorsToStaff } from '@/server/actions/authorLinking';
import { ResearchOutputType } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X, UserPlus, Plus, Search } from 'lucide-react';
import { StaffAuthorAutocomplete } from '@/components/forms/StaffAuthorAutocomplete';
import type { AuthorObject } from '@/lib/researchOutputTypes';
import { FIELD_MAP } from '@/lib/researchOutputFieldMap';
import { AuthorChipsReorder } from '@/components/profile/AuthorChipsReorder';

type MetaJson = Record<string, unknown>;

type FormDataState = {
  type: ResearchOutputType;
  title: string;
  authors: string;
  groupAuthor: string;
  year: string;
  doi: string;
  metaJson: MetaJson;
  authorsJson: AuthorObject[];
  editorsJson: AuthorObject[];
};

const defaultValues: FormDataState = {
  type: ResearchOutputType.JOURNAL_ARTICLE,
  title: '',
  authors: '',
  groupAuthor: '',
  year: '',
  doi: '',
  metaJson: {},
  authorsJson: [],
  editorsJson: [],
};

function extractDoiFromIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const withoutPrefix = trimmed
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');

  return /^10\.\d{4,9}\/\S+$/i.test(withoutPrefix) ? withoutPrefix : '';
}

function meta(form: FormDataState, key: string): string {
  return (form.metaJson[key] as string) || '';
}

function setMeta(prev: FormDataState, key: string, value: string): FormDataState {
  return { ...prev, metaJson: { ...prev.metaJson, [key]: value } };
}

export function ResearchOutputEntryForm({
  initialData,
}: {
  initialData?: { id: string } & Partial<FormDataState>;
}) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [formData, setFormData] = useState<FormDataState>(() => ({
    ...defaultValues,
    ...initialData,
    type: initialData?.type || ResearchOutputType.JOURNAL_ARTICLE,
    year: initialData?.year ? String(initialData.year) : '',
    authorsJson: initialData?.authorsJson || [],
    editorsJson:
      ((initialData?.metaJson as Record<string, unknown>)?.editorsJson as AuthorObject[]) || [],
    metaJson: (initialData?.metaJson as MetaJson) || {},
    groupAuthor: initialData?.groupAuthor || '',
    doi: initialData?.doi || '',
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identifierQuery, setIdentifierQuery] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Author manual entry state
  const [showManualAuthor, setShowManualAuthor] = useState(false);
  const [manualAuthorGiven, setManualAuthorGiven] = useState('');
  const [manualAuthorMiddle, setManualAuthorMiddle] = useState('');
  const [manualAuthorFamily, setManualAuthorFamily] = useState('');

  // Editor manual entry state
  const [showManualEditor, setShowManualEditor] = useState(false);
  const [manualEditorGiven, setManualEditorGiven] = useState('');
  const [manualEditorMiddle, setManualEditorMiddle] = useState('');
  const [manualEditorFamily, setManualEditorFamily] = useState('');

  const t = formData.type;
  const mapConfig = FIELD_MAP[t];
  const fields = mapConfig?.fields || [];
  const hasPages = fields.some((f) => f.key === 'pagesFrom' || f.key === 'pagesTo');
  const normalFields = fields.filter((f) => f.key !== 'pagesFrom' && f.key !== 'pagesTo');

  const looksLikeDoi = identifierQuery.trim().includes('10.');

  /* ── Crossref ── */
  async function handleDoiLookup() {
    if (!identifierQuery) return;
    setIsLookingUp(true);
    try {
      const res = await lookupCrossrefByDoi(identifierQuery);
      if (res.error) {
        toastError(res.error);
        return;
      }

      const data = res.data;
      if (!data) return;

      toastSuccess('Metadata loaded');
      const shouldHydrateAuthors = formData.authorsJson.length === 0;
      let importedAuthors: AuthorObject[] | null = null;

      if (shouldHydrateAuthors && data.authors && data.authors.length > 0) {
        const baseImportedAuthors: AuthorObject[] = data.authors.map((a) => ({
          staffId: null,
          given_name: a.given_name,
          family_name: a.family_name,
        }));

        try {
          const linked = await linkAuthorsToStaff({
            authors: baseImportedAuthors.map((author) => ({
              firstName: author.given_name,
              lastName: author.family_name,
              fullName: [author.given_name, author.middle_name, author.family_name]
                .filter(Boolean)
                .join(' '),
            })),
          });

          importedAuthors = baseImportedAuthors.map((author, idx) => ({
            ...author,
            staffId: author.staffId ?? linked[idx]?.staffId ?? null,
          }));
        } catch (error) {
          console.error('Author auto-linking failed:', error);
          importedAuthors = baseImportedAuthors;
        }
      }

      setFormData((prev) => {
        const next = { ...prev };
        const metaJson = { ...next.metaJson };
        const lookedUpDoi = extractDoiFromIdentifier(identifierQuery);

        if (!next.title && data.title) next.title = data.title;
        if (!next.year && data.year) next.year = String(data.year);
        if (!next.doi && lookedUpDoi) next.doi = lookedUpDoi;

        if (next.type === 'JOURNAL_ARTICLE') {
          if (data.journalName) metaJson.journalName = data.journalName;
          if (data.volume) metaJson.volume = data.volume;
          if (data.issue) metaJson.issue = data.issue;
          if (data.pagesFrom) metaJson.pagesFrom = data.pagesFrom;
          if (data.pagesTo) metaJson.pagesTo = data.pagesTo;
          if (data.month) metaJson.month = data.month;
          if (data.day) metaJson.day = data.day;
        }

        if (next.authorsJson.length === 0 && importedAuthors && importedAuthors.length > 0) {
          next.authorsJson = importedAuthors;
          next.authors = syncAuthorsString(next.authorsJson);
        }

        next.metaJson = metaJson;
        return next;
      });
    } catch {
      toastError('Failed to lookup DOI');
    } finally {
      setIsLookingUp(false);
    }
  }

  /* ── Author helpers ── */
  function syncAuthorsString(authors: AuthorObject[]): string {
    return authors
      .map((a) =>
        formatFullName({
          firstName: a.given_name,
          middleName: a.middle_name,
          lastName: a.family_name,
        }),
      )
      .join(', ');
  }

  function handleAuthorsChange(updated: AuthorObject[]) {
    setFormData((prev) => ({
      ...prev,
      authorsJson: updated,
      authors: syncAuthorsString(updated),
    }));
  }

  function handleAddStaffAuthor(author: AuthorObject) {
    if (author.staffId && formData.authorsJson.some((a) => a.staffId === author.staffId)) {
      toastError('This staff member is already added.');
      return;
    }
    const updated = [...formData.authorsJson, author];
    handleAuthorsChange(updated);
  }

  function handleAddManualAuthor() {
    if (!manualAuthorGiven.trim()) {
      toastError('First name is required.');
      return;
    }
    const author: AuthorObject = {
      staffId: null,
      given_name: manualAuthorGiven.trim(),
      middle_name: manualAuthorMiddle.trim() || undefined,
      family_name: manualAuthorFamily.trim(),
    };
    const updated = [...formData.authorsJson, author];
    handleAuthorsChange(updated);
    setManualAuthorGiven('');
    setManualAuthorMiddle('');
    setManualAuthorFamily('');
    setShowManualAuthor(false);
  }

  /* ── Editors helpers ── */
  function handleAddStaffEditor(author: AuthorObject) {
    if (author.staffId && formData.editorsJson.some((a) => a.staffId === author.staffId)) {
      toastError('This staff member is already added.');
      return;
    }
    const updated = [...formData.editorsJson, author];
    setFormData((prev) => ({
      ...prev,
      editorsJson: updated,
    }));
  }

  function handleAddManualEditor() {
    if (!manualEditorGiven.trim()) {
      toastError('First name is required.');
      return;
    }
    const editor: AuthorObject = {
      staffId: null,
      given_name: manualEditorGiven.trim(),
      middle_name: manualEditorMiddle.trim() || undefined,
      family_name: manualEditorFamily.trim(),
    };
    const updated = [...formData.editorsJson, editor];
    setFormData((prev) => ({
      ...prev,
      editorsJson: updated,
    }));
    setManualEditorGiven('');
    setManualEditorMiddle('');
    setManualEditorFamily('');
    setShowManualEditor(false);
  }

  function handleRemoveEditor(index: number) {
    const updated = formData.editorsJson.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      editorsJson: updated,
    }));
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }

    if (!formData.year && formData.type !== 'DATA') {
      toastError('Year is required');
      return;
    }

    const hasAuthors = formData.authorsJson.length > 0;
    const hasGroup = formData.groupAuthor.trim().length > 0;
    if (!hasAuthors && !hasGroup) {
      toastError('At least one author or group author is required');
      return;
    }

    const yearVal = formData.year ? parseInt(formData.year, 10) : null;

    // Check required mapped fields
    for (const field of mapConfig.fields) {
      if (field.required && !formData.metaJson[field.key]) {
        toastError(`${field.label} is required.`);
        return;
      }
    }

    const metaJsonToSave = { ...formData.metaJson };
    if (mapConfig.hasEditors && formData.editorsJson.length > 0) {
      metaJsonToSave.editorsJson = formData.editorsJson;
    } else {
      delete metaJsonToSave.editorsJson;
    }

    const payload = {
      type: formData.type as ResearchOutputType,
      title: formData.title,
      authors: formData.authors || syncAuthorsString(formData.authorsJson),
      authorsJson: formData.authorsJson.length > 0 ? formData.authorsJson : undefined,
      groupAuthor: formData.groupAuthor || undefined,
      doi: formData.doi,
      year: yearVal,
      metaJson: Object.keys(metaJsonToSave).length > 0 ? metaJsonToSave : undefined,
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEditing && initialData?.id) {
        res = await updateMyResearchOutput(initialData.id, payload);
      } else {
        res = await createMyResearchOutput(payload);
      }

      if (res.error) {
        toastError(res.error);
      } else {
        if (isEditing) {
          toastSuccess('Changes saved');
        } else {
          toastSuccess('Research output created');
          router.push('/dashboard/profile/research-outputs');
          router.refresh();
        }
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const dis = isSubmitting;

  function metaField(
    key: string,
    label: string,
    opts?: { required?: boolean; placeholder?: string },
  ) {
    if (key === 'month') {
      return (
        <div className="grid gap-2 text-left">
          <FieldLabel required={opts?.required} htmlFor={`meta-${key}`}>
            {label}
          </FieldLabel>
          <MonthSelect
            name={`meta-${key}`}
            value={meta(formData, key)}
            onChange={(val) => setFormData((p) => setMeta(p, key, val))}
            disabled={dis}
          />
        </div>
      );
    }

    if (key === 'day') {
      return (
        <div className="grid gap-2 text-left">
          <FieldLabel required={opts?.required} htmlFor={`meta-${key}`}>
            {label}
          </FieldLabel>
          <DaySelect
            name={`meta-${key}`}
            value={meta(formData, key)}
            onChange={(val) => setFormData((p) => setMeta(p, key, val))}
            disabled={dis}
          />
        </div>
      );
    }

    return (
      <div className="grid gap-2 text-left">
        <FieldLabel required={opts?.required} htmlFor={`meta-${key}`}>
          {label}
        </FieldLabel>
        <Input
          id={`meta-${key}`}
          value={meta(formData, key)}
          onChange={(e) => setFormData((p) => setMeta(p, key, e.target.value))}
          placeholder={opts?.placeholder}
          disabled={dis}
          className="rounded-none"
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-card p-6 border rounded-none">
      {/* IDENTIFIERS */}
      <div className="flex gap-2 items-end">
        <div className="grid gap-2 flex-1">
          <FieldLabel htmlFor="identifier">Identifiers (ArXivID, DOI, PMID or ISBN)</FieldLabel>
          <Input
            id="identifier"
            value={identifierQuery}
            onChange={(e) => setIdentifierQuery(e.target.value)}
            placeholder="e.g. 10.1038/s41586-020-2649-2"
            disabled={dis || isLookingUp}
            className="rounded-none"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={dis || isLookingUp || !looksLikeDoi}
          onClick={handleDoiLookup}
          title={!looksLikeDoi ? 'Lookup enabled when DOI is provided' : 'Lookup Metadata'}
          className="rounded-none"
        >
          {isLookingUp ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </Button>
      </div>

      {/* REFERENCE TYPE */}
      <div className="grid gap-2">
        <FieldLabel required htmlFor="type">
          Reference Type
        </FieldLabel>
        <Select
          value={formData.type}
          onValueChange={(val: string) => {
            // Reset meta fields when type changes for clean UX
            setFormData((prev) => ({
              ...prev,
              type: val as ResearchOutputType,
              metaJson: {},
              editorsJson: [],
            }));
          }}
          required
          disabled={dis}
        >
          <SelectTrigger id="type" className="rounded-none">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {RESEARCH_OUTPUT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* TITLE */}
      <div className="grid gap-2">
        <FieldLabel required htmlFor="title">
          Title
        </FieldLabel>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          required
          disabled={dis}
          className="rounded-none"
        />
      </div>

      {/* DOI */}
      <div className="grid gap-2">
        <FieldLabel htmlFor="doi">DOI / Url</FieldLabel>
        <Input
          id="doi"
          value={formData.doi}
          onChange={(e) => setFormData((prev) => ({ ...prev, doi: e.target.value }))}
          placeholder="e.g. 10.1038/s41586-020-2649-2"
          disabled={dis}
          className="rounded-none"
        />
        <p className="text-sm text-muted-foreground">Kindly add a Url if DOI is not available.</p>
      </div>

      {/* AUTHORS */}
      <div className="grid gap-3 p-4 border rounded-none bg-muted/10">
        <FieldLabel required>Authors</FieldLabel>

        {formData.authorsJson.length > 0 && (
          <AuthorChipsReorder
            authors={formData.authorsJson}
            disabled={dis}
            onAuthorsChange={handleAuthorsChange}
          />
        )}

        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add author from staff directory</span>
          </div>
          <StaffAuthorAutocomplete onSelect={handleAddStaffAuthor} disabled={dis} />
        </div>

        {showManualAuthor ? (
          <div className="border bg-muted/30 p-3 space-y-3 rounded-none mt-2">
            <p className="text-sm font-medium text-muted-foreground">Add external author</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1">
                <FieldLabel required htmlFor="manual-author-given" className="text-sm">
                  First Name
                </FieldLabel>
                <Input
                  id="manual-author-given"
                  value={manualAuthorGiven}
                  onChange={(e) => setManualAuthorGiven(e.target.value)}
                  disabled={dis}
                  placeholder="Firstname"
                  className="h-8 text-base rounded-none"
                />
              </div>
              <div className="grid gap-1">
                <FieldLabel htmlFor="manual-author-middle" className="text-sm">
                  Middle Name
                </FieldLabel>
                <Input
                  id="manual-author-middle"
                  value={manualAuthorMiddle}
                  onChange={(e) => setManualAuthorMiddle(e.target.value)}
                  disabled={dis}
                  placeholder="Middlename"
                  className="h-8 text-base rounded-none"
                />
              </div>
              <div className="grid gap-1">
                <FieldLabel htmlFor="manual-author-family" className="text-sm">
                  Last Name
                </FieldLabel>
                <Input
                  id="manual-author-family"
                  value={manualAuthorFamily}
                  onChange={(e) => setManualAuthorFamily(e.target.value)}
                  disabled={dis}
                  placeholder="Lastname"
                  className="h-8 text-base rounded-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowManualAuthor(false);
                  setManualAuthorGiven('');
                  setManualAuthorMiddle('');
                  setManualAuthorFamily('');
                }}
                disabled={dis}
                className="rounded-none"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddManualAuthor}
                disabled={dis}
                className="rounded-none border"
              >
                Add
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowManualAuthor(true)}
            disabled={dis}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors justify-start"
          >
            <Plus className="h-3.5 w-3.5" />
            Add external author manually
          </button>
        )}

        {/* <div className="grid gap-2 pt-2 border-t mt-2">
          <FieldLabel htmlFor="groupAuthor" className="text-sm text-muted-foreground">
            Or Group / Corporate Author
          </FieldLabel>
          <Input
            id="groupAuthor"
            value={formData.groupAuthor}
            onChange={(e) => setFormData((prev) => ({ ...prev, groupAuthor: e.target.value }))}
            disabled={dis}
            className="h-8 rounded-none"
          />
        </div> */}
      </div>

      {/* DYNAMIC FIELDS & YEAR */}
      <div className="grid gap-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2 col-span-2 sm:col-span-1">
            <FieldLabel required={formData.type !== 'DATA'} htmlFor="year">
              Year
            </FieldLabel>
            <YearSelect
              name="year"
              value={formData.year}
              onChange={(val) => setFormData((prev) => ({ ...prev, year: val ? String(val) : '' }))}
              disabled={dis}
            />
          </div>

          {normalFields.map((field) => (
            <div key={field.key} className="col-span-2 sm:col-span-1">
              {metaField(field.key, field.label, { required: field.required })}
            </div>
          ))}
        </div>

        {hasPages && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <FieldLabel htmlFor="meta-pagesFrom">Pages From</FieldLabel>
              <Input
                id="meta-pagesFrom"
                value={meta(formData, 'pagesFrom')}
                onChange={(e) => setFormData((p) => setMeta(p, 'pagesFrom', e.target.value))}
                disabled={dis}
                className="rounded-none"
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="meta-pagesTo">Pages To</FieldLabel>
              <Input
                id="meta-pagesTo"
                value={meta(formData, 'pagesTo')}
                onChange={(e) => setFormData((p) => setMeta(p, 'pagesTo', e.target.value))}
                disabled={dis}
                className="rounded-none"
              />
            </div>
          </div>
        )}

        {mapConfig?.hasEditors && (
          <div className="grid gap-3 p-4 border rounded-none bg-muted/10 mt-2">
            <FieldLabel>Editors (Optional)</FieldLabel>

            {formData.editorsJson.length > 0 && (
              <div className="flex flex-col gap-2">
                {formData.editorsJson.map((editor, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border bg-card px-3 py-2 text-base rounded-none"
                  >
                    <div className="flex items-center gap-2">
                      {editor.staffId && (
                        <span className="h-2 w-2 bg-green-500 shrink-0" title="Staff member" />
                      )}
                      <span className="font-medium">
                        {formatFullName({
                          firstName: editor.given_name,
                          middleName: editor.middle_name,
                          lastName: editor.family_name,
                        })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEditor(idx)}
                      className="p-1 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors rounded-none"
                      disabled={dis}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add editor from staff directory</span>
              </div>
              <StaffAuthorAutocomplete onSelect={handleAddStaffEditor} disabled={dis} />
            </div>

            {showManualEditor ? (
              <div className="border bg-muted/30 p-3 space-y-3 rounded-none mt-2">
                <p className="text-sm font-medium text-muted-foreground">Add external editor</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <FieldLabel htmlFor="manual-editor-given" className="text-sm">
                      First Name
                    </FieldLabel>
                    <Input
                      id="manual-editor-given"
                      value={manualEditorGiven}
                      onChange={(e) => setManualEditorGiven(e.target.value)}
                      disabled={dis}
                      placeholder="Firstname"
                      className="h-8 text-base rounded-none"
                    />
                  </div>
                  <div className="grid gap-1">
                    <FieldLabel htmlFor="manual-editor-middle" className="text-sm">
                      Middle Name
                    </FieldLabel>
                    <Input
                      id="manual-editor-middle"
                      value={manualEditorMiddle}
                      onChange={(e) => setManualEditorMiddle(e.target.value)}
                      disabled={dis}
                      placeholder="Middlename"
                      className="h-8 text-base rounded-none"
                    />
                  </div>
                  <div className="grid gap-1">
                    <FieldLabel htmlFor="manual-editor-family" className="text-sm">
                      Last Name
                    </FieldLabel>
                    <Input
                      id="manual-editor-family"
                      value={manualEditorFamily}
                      onChange={(e) => setManualEditorFamily(e.target.value)}
                      disabled={dis}
                      placeholder="Lastname"
                      className="h-8 text-base rounded-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowManualEditor(false);
                      setManualEditorGiven('');
                      setManualEditorMiddle('');
                      setManualEditorFamily('');
                    }}
                    disabled={dis}
                    className="rounded-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddManualEditor}
                    disabled={dis}
                    className="rounded-none border"
                  >
                    Add
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowManualEditor(true)}
                disabled={dis}
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors justify-start"
              >
                <Plus className="h-3.5 w-3.5" />
                Add external editor manually
              </button>
            )}
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button type="submit" disabled={dis} className="rounded-none">
          {dis && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Save changes' : 'Add entry'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/profile/research-outputs')}
          disabled={dis}
          className="rounded-none"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
