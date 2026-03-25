'use server';

export type CrossrefLookupResult = {
  title?: string;
  year?: number;
  month?: string;
  day?: string;
  journalName?: string;
  volume?: string;
  issue?: string;
  pagesFrom?: string;
  pagesTo?: string;
  authors: { given_name: string; family_name: string }[];
};

export type ActionResponse<T> = {
  data?: T;
  error?: string;
};

// Map number month to short string
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function lookupCrossrefByDoi(
  doiInput: string,
): Promise<ActionResponse<CrossrefLookupResult>> {
  try {
    let doi = doiInput.trim();

    // Normalize DOI (strip URLs if pasted directly)
    if (doi.includes('doi.org/')) {
      doi = doi.split('doi.org/')[1];
    } else if (doi.startsWith('http')) {
      // Just in case it's a dx.doi.org or something else, though doi.org is most common
      // Usually DOI is everything after the first a/b format. E.g. https://foo/10.123/456 -> 10.123/456
      // Simplified extraction:
      const match = doi.match(/(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/);
      if (match) {
        doi = match[1];
      }
    }

    doi = doi.toLowerCase();

    // Basic DOI validation regex
    if (!/^10.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(doi)) {
      return { error: 'Invalid DOI format' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'IFE Physics Website (mailto:admin@example.com)', // Polite user agent string
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'DOI not found in Crossref' };
      }
      return { error: `Crossref API error: ${response.statusText}` };
    }

    const json = await response.json();
    const item = json.message;

    if (!item) {
      return { error: 'Invalid response from Crossref' };
    }

    const result: CrossrefLookupResult = {
      authors: [],
    };

    // Title
    if (item.title && Array.isArray(item.title) && item.title.length > 0) {
      result.title = item.title[0];
    }

    // Published dates
    const issued = item.issued || item.created;
    if (issued && issued['date-parts'] && issued['date-parts'][0]) {
      const dateParts = issued['date-parts'][0];
      if (dateParts[0]) result.year = dateParts[0];
      if (dateParts[1]) {
        const monthIdx = dateParts[1] - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
          result.month = MONTHS[monthIdx];
        }
      }
      if (dateParts[2]) result.day = String(dateParts[2]);
    }

    // Journal Name (Container Title)
    if (
      item['container-title'] &&
      Array.isArray(item['container-title']) &&
      item['container-title'].length > 0
    ) {
      result.journalName = item['container-title'][0];
    }

    // Volume & Issue
    if (item.volume) result.volume = item.volume;
    if (item.issue) result.issue = item.issue;

    // Pages
    if (item.page) {
      const pageParts = item.page.split('-');
      if (pageParts.length > 0) result.pagesFrom = pageParts[0];
      if (pageParts.length > 1) result.pagesTo = pageParts[1];
    }

    // Authors
    if (item.author && Array.isArray(item.author)) {
      result.authors = item.author
        .filter((a: Record<string, string>) => a.family) // family is generally required for person authors
        .map((a: Record<string, string>) => ({
          given_name: a.given || '',
          family_name: a.family || '',
        }));
    }

    return { data: result };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: 'Request to Crossref timed out' };
    }
    return { error: 'Error fetching metadata' };
  }
}
