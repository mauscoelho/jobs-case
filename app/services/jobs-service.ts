import { API_URL } from "~/env-variables.server";
import { Cache, ApiResponse, Job, SearchFilter } from "~/types";

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

declare global {
  // eslint-disable-next-line no-var
  var __jobsCache: Cache | undefined;
}

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

export async function getJobsFromCache(): Promise<{
  jobs: Job[];
  favorites: number[];
}> {
  try {
    let cache = globalThis.__jobsCache;

    if (!cache || Date.now() - cache.timestamp > CACHE_DURATION) {
      const allJobs = await fetchAllJobs();
      cache = {
        data: allJobs,
        favorites: new Set(cache?.favorites || []),
        timestamp: Date.now(),
      };
      globalThis.__jobsCache = cache;
    }

    return {
      jobs: cache.data,
      favorites: Array.from(cache.favorites),
    };
  } catch (error) {
    console.error("Error getting jobs from cache:", error);
    return { jobs: [], favorites: [] };
  }
}

export function toggleJobFavorite(jobId: number): {
  success: boolean;
  favorites: number[];
} {
  if (!globalThis.__jobsCache) {
    return { success: false, favorites: [] };
  }

  const favorites = globalThis.__jobsCache.favorites;
  if (favorites.has(jobId)) {
    favorites.delete(jobId);
  } else {
    favorites.add(jobId);
  }

  return {
    success: true,
    favorites: Array.from(favorites),
  };
}

export function clearAllFavorites(): void {
  if (globalThis.__jobsCache) {
    globalThis.__jobsCache.favorites.clear();
  }
}
