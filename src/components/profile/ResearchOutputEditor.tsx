'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { YearSelect } from '@/components/forms/YearSelect';
import { RESEARCH_OUTPUT_TYPE_OPTIONS } from '@/lib/options';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toastSuccess, toastError } from '@/lib/toast';
import {
  createMyResearchOutput,
  updateMyResearchOutput,
} from '@/server/actions/profileResearchOutputs';
import { ResearchOutputType } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const defaultValues = {
  type: undefined as ResearchOutputType | undefined,
  title: '',
  authors: '',
  year: '',
  venue: '',
  url: '',
  doi: '',
  metaJson: {} as Record<string, string>,
};

type FormDataState = {
  type?: ResearchOutputType;
  title: string;
  authors: string;
  year: string;
  venue: string;
  url: string;
  doi: string;
  metaJson: Record<string, string>;
};

export function ResearchOutputEditor({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: { id: string } & Partial<FormDataState>;
}) {
  const isEditing = !!initialData?.id;
  const [formData, setFormData] = useState<FormDataState>(() => ({
    ...defaultValues,
    ...initialData,
    year: initialData?.year ? String(initialData.year) : '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }

    if (!formData.authors.trim()) {
      toastError('Authors are required');
      return;
    }

    if (!formData.year) {
      toastError('Year is required');
      return;
    }

    const payload = {
      type: formData.type as ResearchOutputType,
      title: formData.title,
      authors: formData.authors,
      year: parseInt(formData.year, 10),
      venue: formData.venue || undefined,
      url: formData.url || undefined,
      doi: formData.doi || undefined,
      metaJson: formData.metaJson,
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
        toastSuccess(isEditing ? 'Output updated!' : 'Output created!');
        onOpenChange(false);
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Research Output' : 'Add Research Output'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the details below.' : 'Add a new publication or output.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <FieldLabel htmlFor="doi">DOI</FieldLabel>
              <Input
                id="doi"
                value={formData.doi}
                onChange={(e) => setFormData((prev) => ({ ...prev, doi: e.target.value }))}
                placeholder="e.g. 10.1038/s41567-024-0..."
              />
            </div>

            <div className="grid gap-2">
              <FieldLabel required htmlFor="type">
                Output Type
              </FieldLabel>
              <Select
                value={formData.type}
                onValueChange={(val: string) =>
                  setFormData((prev) => ({ ...prev, type: val as ResearchOutputType }))
                }
                required
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {RESEARCH_OUTPUT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <FieldLabel required htmlFor="title">
                Title
              </FieldLabel>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
                placeholder="e.g. Quantum Entanglement Mechanics"
              />
            </div>

            <div className="grid gap-2">
              <FieldLabel required htmlFor="authors">
                Authors
              </FieldLabel>
              <Input
                id="authors"
                value={formData.authors}
                onChange={(e) => setFormData((prev) => ({ ...prev, authors: e.target.value }))}
                required
                placeholder="e.g. Smith J., Doe A."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <FieldLabel required htmlFor="year">
                  Year
                </FieldLabel>
                <YearSelect
                  value={formData.year}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, year: val ? String(val) : '' }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="venue">Venue / Journal</FieldLabel>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
                  placeholder="e.g. Nature Physics"
                />
              </div>
            </div>

            {/* Dynamic APA-style fields targeting metaJson */}
            {(formData.type as string) === 'JOURNAL_ARTICLE' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <FieldLabel required htmlFor="journalName">
                    Journal Name
                  </FieldLabel>
                  <Input
                    id="journalName"
                    value={formData.metaJson.journalName || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, journalName: e.target.value },
                      }))
                    }
                    placeholder="Journal of Physics"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="volume">Vol.</FieldLabel>
                    <Input
                      id="volume"
                      value={formData.metaJson.volume || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          metaJson: { ...p.metaJson, volume: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="issue">Issue</FieldLabel>
                    <Input
                      id="issue"
                      value={formData.metaJson.issue || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          metaJson: { ...p.metaJson, issue: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="pages">Pages</FieldLabel>
                    <Input
                      id="pages"
                      value={formData.metaJson.pages || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          metaJson: { ...p.metaJson, pages: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {(formData.type as string) === 'CONFERENCE_PAPER' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <FieldLabel required htmlFor="conferenceName">
                    Conference Name
                  </FieldLabel>
                  <Input
                    id="conferenceName"
                    value={formData.metaJson.conferenceName || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, conferenceName: e.target.value },
                      }))
                    }
                    placeholder="e.g. APS March Meeting"
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="location">Location</FieldLabel>
                  <Input
                    id="location"
                    value={formData.metaJson.location || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, location: e.target.value },
                      }))
                    }
                    placeholder="e.g. Las Vegas, NV"
                  />
                </div>
              </div>
            )}

            {(formData.type as string) === 'BOOK' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <FieldLabel required htmlFor="publisher">
                    Publisher
                  </FieldLabel>
                  <Input
                    id="publisher"
                    value={formData.metaJson.publisher || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, publisher: e.target.value },
                      }))
                    }
                    placeholder="e.g. Springer"
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="edition">Edition</FieldLabel>
                  <Input
                    id="edition"
                    value={formData.metaJson.edition || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, edition: e.target.value },
                      }))
                    }
                    placeholder="e.g. 2nd Edition"
                  />
                </div>
              </div>
            )}

            {(formData.type as string) === 'BOOK_CHAPTER' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <FieldLabel required htmlFor="bookTitle">
                      Book Title
                    </FieldLabel>
                    <Input
                      id="bookTitle"
                      value={formData.metaJson.bookTitle || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          metaJson: { ...p.metaJson, bookTitle: e.target.value },
                        }))
                      }
                      placeholder="e.g. Advances in Physics"
                    />
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="editors">Editors</FieldLabel>
                    <Input
                      id="editors"
                      value={formData.metaJson.editors || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          metaJson: { ...p.metaJson, editors: e.target.value },
                        }))
                      }
                      placeholder="e.g. Smith J."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <FieldLabel required htmlFor="publisher">
                      Publisher
                    </FieldLabel>
                    <Input
                      id="publisher"
                      value={formData.metaJson.publisher || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          metaJson: { ...p.metaJson, publisher: e.target.value },
                        }))
                      }
                      placeholder="e.g. Springer"
                    />
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="pages">Pages</FieldLabel>
                    <Input
                      id="pages"
                      value={formData.metaJson.pages || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          metaJson: { ...p.metaJson, pages: e.target.value },
                        }))
                      }
                      placeholder="e.g. 100-120"
                    />
                  </div>
                </div>
              </div>
            )}

            {(formData.type as string) === 'PATENT' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <FieldLabel required htmlFor="patentNumber">
                    Patent Number
                  </FieldLabel>
                  <Input
                    id="patentNumber"
                    value={formData.metaJson.patentNumber || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, patentNumber: e.target.value },
                      }))
                    }
                    placeholder="e.g. US1234567"
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="issuer">Issuer</FieldLabel>
                  <Input
                    id="issuer"
                    value={formData.metaJson.issuer || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, issuer: e.target.value },
                      }))
                    }
                    placeholder="e.g. USPTO"
                  />
                </div>
              </div>
            )}

            {((formData.type as string) === 'DATA' || (formData.type as string) === 'SOFTWARE') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <FieldLabel required htmlFor="repository">
                    Repository
                  </FieldLabel>
                  <Input
                    id="repository"
                    value={formData.metaJson.repository || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, repository: e.target.value },
                      }))
                    }
                    placeholder="e.g. GitHub, Zenodo"
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="version">Version</FieldLabel>
                  <Input
                    id="version"
                    value={formData.metaJson.version || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, version: e.target.value },
                      }))
                    }
                    placeholder="e.g. v1.0.0"
                  />
                </div>
              </div>
            )}

            {(formData.type as string) === 'REPORT' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <FieldLabel required htmlFor="institution">
                    Institution
                  </FieldLabel>
                  <Input
                    id="institution"
                    value={formData.metaJson.institution || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, institution: e.target.value },
                      }))
                    }
                    placeholder="e.g. Department of Energy"
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="publisher">Publisher (if diff)</FieldLabel>
                  <Input
                    id="publisher"
                    value={formData.metaJson.publisher || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        metaJson: { ...p.metaJson, publisher: e.target.value },
                      }))
                    }
                    placeholder="e.g. OUP"
                  />
                </div>
              </div>
            )}

            {(formData.type as string) === 'THESIS' && (
              <div className="grid gap-2">
                <FieldLabel required htmlFor="awardingInstitution">
                  Awarding Institution
                </FieldLabel>
                <Input
                  id="awardingInstitution"
                  value={formData.metaJson.awardingInstitution || ''}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      metaJson: { ...p.metaJson, awardingInstitution: e.target.value },
                    }))
                  }
                  placeholder="e.g. MIT"
                />
              </div>
            )}

            <div className="grid gap-2">
              <FieldLabel htmlFor="url">External Link</FieldLabel>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Output'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
