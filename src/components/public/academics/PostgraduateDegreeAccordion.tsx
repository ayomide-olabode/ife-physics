'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Prose } from '@/components/public/Prose';

type AccordionItemKey = 'admission' | 'period' | 'course' | 'exam';

interface PostgraduateDegreeAccordionProps {
  admissionHtml?: string | null;
  periodHtml?: string | null;
  courseHtml?: string | null;
  examHtml?: string | null;
}

function hasBodyContent(value?: string | null) {
  if (!value) return false;
  const plain = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 0;
}

function EmptyBody({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-brand-navy/20 bg-white px-4 py-3">
      <p className="text-base font-semibold text-brand-navy">{title}</p>
      <p className="mt-1 text-base text-gray-600">{text}</p>
    </div>
  );
}

export function PostgraduateDegreeAccordion({
  admissionHtml,
  periodHtml,
  courseHtml,
  examHtml,
}: PostgraduateDegreeAccordionProps) {
  const [openItem, setOpenItem] = useState<AccordionItemKey>('admission');

  const items: Array<{
    key: AccordionItemKey;
    label: string;
    html?: string | null;
    emptyTitle: string;
    emptyText: string;
  }> = [
    {
      key: 'admission',
      label: 'Admission Requirements',
      html: admissionHtml,
      emptyTitle: 'Admission requirements unavailable',
      emptyText: 'Admission requirements for this degree have not been published yet.',
    },
    {
      key: 'period',
      label: 'Period of Study',
      html: periodHtml,
      emptyTitle: 'Period of study unavailable',
      emptyText: 'Period of study details for this degree are not available yet.',
    },
    {
      key: 'course',
      label: 'Course Requirements',
      html: courseHtml,
      emptyTitle: 'Course requirements unavailable',
      emptyText: 'Course requirements for this degree have not been published yet.',
    },
    {
      key: 'exam',
      label: 'Examination Requirements',
      html: examHtml,
      emptyTitle: 'Examination requirements unavailable',
      emptyText: 'Examination requirements for this degree are not available yet.',
    },
  ];

  return (
    <div className="border border-brand-navy/20 bg-white">
      {items.map((item) => {
        const isOpen = openItem === item.key;

        return (
          <section key={item.key} className="border-b border-brand-navy/20 last:border-b-0">
            <h4>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenItem(item.key)}
                className={cn(
                  'flex w-full items-center justify-between px-5 py-4 text-left text-base font-semibold transition-colors',
                  isOpen
                    ? 'bg-brand-navy text-white'
                    : 'bg-white text-brand-navy hover:bg-slate-50',
                )}
              >
                <span>{item.label}</span>
                <span className="text-lg leading-none">{isOpen ? '−' : '+'}</span>
              </button>
            </h4>

            {isOpen ? (
              <div className="border-t border-brand-navy/20 px-5 py-5">
                {hasBodyContent(item.html) ? (
                  <Prose html={item.html || ''} className="text-gray-700" />
                ) : (
                  <EmptyBody title={item.emptyTitle} text={item.emptyText} />
                )}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
