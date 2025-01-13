import {
  ActionFunctionArgs,
  json,
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import {
  clearAllFavorites,
  filterJobs,
  getJobsFromCache,
  toggleJobFavorite,
} from "~/services/jobs-service";
import { SearchFilter } from "~/types";

export const meta: MetaFunction = () => {
  return [
    { title: "Job search" },
    { name: "description", content: "Welcome to Job search!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const term = url.searchParams.get("term");
  const filter = url.searchParams.get("filter") as SearchFilter;

  try {
    const { jobs, favorites } = await getJobsFromCache();
    const filteredJobs = filterJobs(jobs, term, filter);
    return json({ jobs: filteredJobs, favorites });
  } catch (error) {
    console.error("Error loading jobs:", error);
    return json({ jobs: [], favorites: [] }, { status: 500 });
  }
}

type ActionType = "toggleFavorite" | "clearFavorites";
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("_action") as ActionType;

  switch (actionType) {
    case "toggleFavorite": {
      const jobId = Number(formData.get("jobId"));
      if (isNaN(jobId)) return json({ success: false });

      const result = toggleJobFavorite(jobId);
      return json(result);
    }

    case "clearFavorites": {
      clearAllFavorites();
      return redirect(request.url);
    }

    default:
      return json({ success: false });
  }
}

export default function Index() {
  const { jobs, favorites } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const hasActiveFilters =
    searchParams.get("term") !== null || searchParams.get("filter") !== null;

  const handleClear = () => {
    window.location.search = "";
  };

  const displayedJobs = showOnlyFavorites
    ? jobs.filter((job) => favorites.includes(job.id))
    : jobs;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Job Opportunities</h1>

      <Form className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="flex items-center">
              <input
                name="term"
                type="text"
                placeholder="Search jobs..."
                defaultValue={searchParams.get("term") || ""}
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
                !searchParams.get("filter") ||
                searchParams.get("filter") === "all"
              }
            />
            <span className="ml-2">All</span>
          </label>
          <label className="inline-flex items-center">
            <input
              name="filter"
              type="radio"
              value="title"
              defaultChecked={searchParams.get("filter") === "title"}
            />
            <span className="ml-2">By Title</span>
          </label>
        </div>
      </Form>

      <div className="mb-4 text-gray-600">
        Found {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        {hasActiveFilters && " matching your filters"}
      </div>

      <div className="mb-4 flex justify-between items-center">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={showOnlyFavorites}
            onChange={(e) => setShowOnlyFavorites(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-500"
          />
          <span className="ml-2">Show Favorites Only ({favorites.length})</span>
        </label>
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
        {displayedJobs.map((job) => (
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

      {displayedJobs.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No jobs found. Try adjusting your search criteria.
        </p>
      )}
    </div>
  );
}
