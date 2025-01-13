export type LoaderData = {
  jobs: Job[];
  favorites: number[];
  activeFilters: {
    term: string | null;
    filter: SearchFilter | null;
    showOnlyFavorites: boolean | null;
  };
};

export type Pagination = {
  currentPage: number;
  firstPage: number;
  lastPage: number;
};

export type Job = {
  job_title: string;
  description: string;
  company: string;
  id: number;
};

export type ApiResponse = {
  pagination: Pagination;
  data: Job[];
};

export type SearchFilter = "all" | "title" | "";
