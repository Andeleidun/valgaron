import type {
  AboutType,
  AcademicProfileFormDataType,
  HighlightsType,
  ProfessionalProfileFormDataType,
} from '../../../types';

type CareerProfileAboutFormFieldsType = {
  email: AcademicProfileFormDataType['email'];
  phone: AcademicProfileFormDataType['phone'];
  websites: AcademicProfileFormDataType['websites'];
  languages: AcademicProfileFormDataType['languages'];
};

type CareerProfileHighlightFormFieldsType = {
  papers: AcademicProfileFormDataType['papers'];
  books: AcademicProfileFormDataType['books'];
  awards: AcademicProfileFormDataType['awards'];
  summary: AcademicProfileFormDataType['summary'];
  highlightSkills: AcademicProfileFormDataType['highlightSkills'];
  accomplishments: AcademicProfileFormDataType['accomplishments'];
  projects: ProfessionalProfileFormDataType['projects'];
};

/**
 * Resolve contact form fields for career-mode profiles, even when discovery
 * data omits the nested `about` section.
 */
export const getCareerProfileAboutFormFields = (
  about?: AboutType
): CareerProfileAboutFormFieldsType => ({
  email: about?.email ?? '',
  phone: about?.phone ?? '',
  websites: about?.websites ?? '',
  languages: about?.languages ?? [],
});

/**
 * Resolve highlight form fields for career-mode profiles, even when discovery
 * data omits the nested `highlights` section.
 */
export const getCareerProfileHighlightFormFields = (
  highlights?: HighlightsType
): CareerProfileHighlightFormFieldsType => {
  const papers = highlights?.papers;
  const books = highlights?.books;
  const awards = highlights?.awards;
  const accomplishments = highlights?.accomplishments;

  return {
    papers: Array.isArray(papers) ? papers : [],
    books: Array.isArray(books) ? books : [],
    awards: Array.isArray(awards) ? awards : [],
    summary: highlights?.summary ?? '',
    highlightSkills: highlights?.skills ?? [],
    accomplishments: Array.isArray(accomplishments) ? accomplishments : [],
    projects: highlights?.projects ?? '',
  };
};
