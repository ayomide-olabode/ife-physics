'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createEventOpportunity,
  updateEventOpportunity,
} from '@/server/actions/eventsOpportunities';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EVENT_CATEGORY_OPTIONS, OPPORTUNITY_CATEGORY_OPTIONS } from '@/lib/options';

type FormInitial = {
  id?: string;
  title?: string;
  type?: string;
  eventCategory?: string | null;
  opportunityCategory?: string | null;
  description?: string | null;
  duration?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  venue?: string | null;
  linkUrl?: string | null;
  deadline?: string | null;
};

function toDateInput(val?: string | Date | null): string {
  if (!val) return '';
  const d = typeof val === 'string' ? new Date(val) : val;
  return d.toISOString().split('T')[0];
}

export function EventOpportunityFormClient({ initial }: { initial?: FormInitial }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initial?.id;

  const [title, setTitle] = useState(initial?.title || '');
  const [type, setType] = useState(initial?.type || '');
  const [eventCategory, setEventCategory] = useState(initial?.eventCategory || '');
  const [opportunityCategory, setOpportunityCategory] = useState(
    initial?.opportunityCategory || '',
  );
  const [description, setDescription] = useState(initial?.description || '');
  const [duration, setDuration] = useState(initial?.duration || '');
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(initial?.endDate));
  const [venue, setVenue] = useState(initial?.venue || '');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl || '');
  const [deadline, setDeadline] = useState(toDateInput(initial?.deadline));

  const categoryOptions =
    type === 'EVENT'
      ? EVENT_CATEGORY_OPTIONS
      : type === 'OPPORTUNITY'
        ? OPPORTUNITY_CATEGORY_OPTIONS
        : [];

  const handleTypeChange = (val: string) => {
    setType(val);
    setEventCategory('');
    setOpportunityCategory('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        type: type as 'EVENT' | 'OPPORTUNITY',
        eventCategory: type === 'EVENT' && eventCategory ? (eventCategory as never) : null,
        opportunityCategory:
          type === 'OPPORTUNITY' && opportunityCategory ? (opportunityCategory as never) : null,
        description: description || '',
        duration: duration.trim(),
        startDate: startDate || '',
        endDate: endDate || '',
        venue: venue || '',
        linkUrl: linkUrl || '',
        deadline: deadline || '',
      };

      if (isEditing && initial?.id) {
        const res = await updateEventOpportunity(initial.id, payload);
        if (res.success) {
          toastSuccess('Updated successfully.');
          router.refresh();
        } else {
          toastError(res.error || 'Failed to update.');
        }
        setIsSubmitting(false);
        return;
      }

      const res = await createEventOpportunity(payload);
      if (res.success && res.data?.id) {
        toastSuccess('Created as draft.');
        window.location.assign(`/dashboard/communication/events-opportunities/${res.data.id}`);
        return;
      }

      toastError(res.error || 'Failed to create.');
    } catch {
      toastError('An unexpected error occurred.');
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <FieldLabel required htmlFor="title">
          Title
        </FieldLabel>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event or opportunity title"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel required>Type</FieldLabel>
          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EVENT">Event</SelectItem>
              <SelectItem value="OPPORTUNITY">Opportunity</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <FieldLabel required>Category</FieldLabel>
          <Select
            value={type === 'EVENT' ? eventCategory : opportunityCategory}
            onValueChange={(val) =>
              type === 'EVENT' ? setEventCategory(val) : setOpportunityCategory(val)
            }
            disabled={!type}
          >
            <SelectTrigger>
              <SelectValue placeholder={type ? 'Select category' : 'Select type first'} />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the event or opportunity..."
          rows={4}
          maxLength={4000}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="space-y-2">
          <FieldLabel htmlFor="duration">Duration</FieldLabel>
          <Input
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 3 days, 6 weeks, ongoing"
            maxLength={120}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="endDate">End Date</FieldLabel>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="deadline">Deadline</FieldLabel>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel htmlFor="venue">Venue / Awarding Body</FieldLabel>
          <Input
            id="venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Location or online"
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="linkUrl">Link URL</FieldLabel>
          <Input
            id="linkUrl"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Update' : 'Create Draft'}
        </Button>
      </div>
    </form>
  );
}
