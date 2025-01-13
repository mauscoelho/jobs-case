import {
  ActionFunctionArgs,
  json,
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { fetchAllJobs, filterJobs } from "~/services/jobs-api";
import { Job, LoaderData, SearchFilter } from "~/types";

export const meta: MetaFunction = () => {
  return [
    { title: "Job search" },
    { name: "description", content: "Welcome to Job search!" },
  ];
};

type Cache = {
  data: Job[];
  favorites: Set<number>;
  timestamp: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __jobsCache: Cache | undefined;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const term = url.searchParams.get("term");
  const filter = url.searchParams.get("filter") as SearchFilter;
  const showOnlyFavorites = url.searchParams.get("showFavorites") === "true";

  try {
    let cache = globalThis.__jobsCache;

    // Check if cache needs refresh
    if (!cache || Date.now() - cache.timestamp > CACHE_DURATION) {
      const allJobs = await fetchAllJobs();
      cache = {
        data: allJobs,
        favorites: new Set(cache?.favorites || []),
        timestamp: Date.now(),
      };
      globalThis.__jobsCache = cache;
    }

    let filteredJobs = filterJobs(cache.data, term, filter);

    if (showOnlyFavorites) {
      filteredJobs = filteredJobs.filter((job) => cache?.favorites.has(job.id));
    }

    return json<LoaderData>({
      jobs: filteredJobs,
      favorites: Array.from(cache.favorites),
      activeFilters: {
        term,
        filter,
        showOnlyFavorites,
      },
    });
  } catch (error) {
    console.error("Error loading jobs:", error);
    return json<LoaderData>(
      {
        jobs: [],
        favorites: [],
        activeFilters: {
          term: null,
          filter: null,
          showOnlyFavorites: false,
        },
      },
      { status: 500 }
    );
  }
}

type ActionType = "toggleFavorite" | "clearFavorites";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("_action") as ActionType;

  if (!globalThis.__jobsCache) {
    return json({ success: false });
  }

  switch (actionType) {
    case "toggleFavorite": {
      const jobId = Number(formData.get("jobId"));
      if (isNaN(jobId)) return json({ success: false });

      const favorites = globalThis.__jobsCache.favorites;
      if (favorites.has(jobId)) {
        favorites.delete(jobId);
      } else {
        favorites.add(jobId);
      }

      return json({
        success: true,
        favorites: Array.from(favorites),
      });
    }

    case "clearFavorites": {
      globalThis.__jobsCache.favorites.clear();
      return redirect(request.url);
    }

    default:
      return json({ success: false });
  }
}

export default function Index() {
  const { jobs, favorites, activeFilters } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const hasActiveFilters =
    activeFilters.term ||
    activeFilters.filter !== "all" ||
    activeFilters.showOnlyFavorites;

  const handleClear = () => {
    submit(
      { term: "", filter: "all", showFavorites: "false" },
      { method: "get" }
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Job Opportunities</h1>

      <Form className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="flex items-center">
              <input
                name="term"
                type="text"
                placeholder="Search jobs..."
                defaultValue={activeFilters.term || ""}
                className="w-full px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="bg-gray-500 text-white px-4 py-2 rounded-r-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 space-x-6">
          <label className="inline-flex items-center">
            <input
              name="filter"
              type="radio"
              value="all"
              defaultChecked={
                !activeFilters.filter || activeFilters.filter === "all"
              }
            />
            <span className="ml-2">All</span>
          </label>
          <label className="inline-flex items-center">
            <input
              name="filter"
              type="radio"
              value="title"
              defaultChecked={activeFilters.filter === "title"}
            />
            <span className="ml-2">By Title</span>
          </label>
          <label className="inline-flex items-center">
            <input
              name="showFavorites"
              type="checkbox"
              value="true"
              defaultChecked={activeFilters.showOnlyFavorites}
            />
            <span className="ml-2">Show Favorites Only</span>
          </label>
        </div>

        {hasActiveFilters && (
          <div className="mt-2 text-sm">
            <div className="text-gray-600">
              Active filters:
              {activeFilters.term && (
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Search: {activeFilters.term}
                </span>
              )}
              {activeFilters.filter === "title" && (
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Title only
                </span>
              )}
              {activeFilters.showOnlyFavorites && (
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Favorites only
                </span>
              )}
            </div>
          </div>
        )}
      </Form>

      <div className="mb-4 text-gray-600">
        Found {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        {hasActiveFilters && " matching your filters"}
      </div>

      {favorites.length > 0 && (
        <Form method="post" className="mb-4">
          <button
            type="submit"
            name="_action"
            value="clearFavorites"
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All Favorites ({favorites.length})
          </button>
        </Form>
      )}

      <ul className="space-y-4">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="p-4 border rounded-md shadow-md hover:shadow-lg transition duration-300"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{job.job_title}</h2>
                <p className="text-gray-600">{job.company}</p>
              </div>
              <Form method="post">
                <input type="hidden" name="jobId" value={job.id} />
                <button
                  type="submit"
                  name="_action"
                  value="toggleFavorite"
                  className={`px-4 py-2 rounded-md ${
                    favorites.includes(job.id)
                      ? "bg-red-500 text-white"
                      : "bg-gray-300 text-gray-800"
                  } hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {favorites.includes(job.id) ? (
                    <>
                      <span className="mr-1">❤️</span>
                      Favorited
                    </>
                  ) : (
                    <>
                      <span className="mr-1">🤍</span>
                      Favorite
                    </>
                  )}
                </button>
              </Form>
            </div>
            <p className="mt-2 text-gray-700">{job.description}</p>
          </li>
        ))}
      </ul>

      {jobs.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No jobs found. Try adjusting your search criteria.
        </p>
      )}
    </div>
  );
}
