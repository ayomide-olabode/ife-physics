/**
 * AuthorObject — structured author entry stored in ResearchOutput.authorsJson.
 *
 * Follows APA 7 author conventions:
 *   - Individual authors: given_name + family_name (+ optional middle_name, suffix)
 *   - Group/corporate authors: set is_group = true, use given_name for org name
 *   - Linked staff: optional staffId points to a Staff record in the database
 */
export type AuthorObject = {
  /** Optional link to a Staff record in the database */
  staffId?: string | null;

  /** First / given name (or organisation name when is_group is true) */
  given_name: string;

  /** Middle name or initial */
  middle_name?: string | null;

  /** Last / family / surname */
  family_name: string;

  /** Name suffix, e.g. "Jr.", "III" */
  suffix?: string | null;

  /**
   * Role of this contributor.
   * Common values: "author" | "editor" | "translator" | "compiler"
   */
  role?: string | null;

  /** True when this entry represents a group / corporate author */
  is_group?: boolean | null;
};

/**
 * MetaJson — flexible object for type-specific fields stored in
 * ResearchOutput.metaJson.
 *
 * Examples of keys by output type:
 *   JOURNAL_ARTICLE → journalName, volume, issue, pages
 *   CONFERENCE_PAPER → conferenceName, location
 *   BOOK → publisher, edition
 *   BOOK_CHAPTER → bookTitle, editors, publisher, pages
 *   PATENT → patentNumber, issuer
 *   DATA / SOFTWARE → repository, version
 *   REPORT → institution, publisher
 *   THESIS → awardingInstitution
 */
export type MetaJson = Record<string, unknown>;
