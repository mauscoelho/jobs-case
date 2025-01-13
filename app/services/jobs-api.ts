import { API_URL } from "~/env-variables.server";
import { ApiResponse, Job, SearchFilter } from "~/types";

export async function fetchJobs(page: number): Promise<ApiResponse> {
  const response = await fetch(`${API_URL}?page=${page}`);
  if (!response.ok) {
    throw new Error(
      `API request failed for page ${page} with status: ${response.status}`
    );
  }
  return response.json();
}

export async function fetchAllJobs(): Promise<Job[]> {
  const initialData: ApiResponse = await fetchJobs(0);
  const lastPage = initialData.pagination.lastPage;

  const allJobs = [...initialData.data];
  let currentPage = 1;

  while (currentPage <= lastPage) {
    const data = await fetchJobs(currentPage);
    allJobs.push(...data.data);
    currentPage++;
  }

  return allJobs;
}

export function filterJobs(
  jobs: Job[],
  searchTerm?: string | null,
  filter: SearchFilter = ""
): Job[] {
  if (!searchTerm) {
    return jobs;
  }

  const normalizedSearchTerm = searchTerm.toLowerCase();

  return jobs.filter((job) => {
    switch (filter) {
      case "title":
        return job.job_title.toLowerCase().includes(normalizedSearchTerm);
      case "all":
      case "":
      default:
        return (
          job.job_title.toLowerCase().includes(normalizedSearchTerm) ||
          job.description.toLowerCase().includes(normalizedSearchTerm) ||
          job.company.toLowerCase().includes(normalizedSearchTerm)
        );
    }
  });
}
