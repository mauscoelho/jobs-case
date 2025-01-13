import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { isJobsArray } from "~/helpers";
import {
  fetchAllJobs,
  filterJobs,
  Job,
  SearchFilter,
} from "~/services/jobs-api";

export const meta: MetaFunction = () => {
  return [
    { title: "Job search" },
    { name: "description", content: "Welcome to Job search!" },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const term = url.searchParams.get("term");
  const filter = url.searchParams.get("filter") as SearchFilter;

  const env = context.env as { JOBS_CACHE: KVNamespace };

  try {
    const cachedData = await env.JOBS_CACHE.get("all_jobs", "json");
    let allJobs: Job[];

    if (cachedData && isJobsArray(cachedData)) {
      allJobs = cachedData;
    } else {
      // If no cache, invalid data, or expired, fetch new data
      allJobs = await fetchAllJobs();
      // Cache for 1 hour (60 * 60 seconds)
      await env.JOBS_CACHE.put("all_jobs", JSON.stringify(allJobs), {
        expirationTtl: 60 * 60,
      });
    }

    const filteredJobs = filterJobs(allJobs, term, filter);

    return json({ jobs: filteredJobs });
  } catch (error) {
    console.error("Error loading jobs:", error);
    return json(
      {
        jobs: [],
        error: "Failed to load jobs. Please try again later.",
      },
      { status: 500 }
    );
  }
}

export default function Index() {
  const { jobs } = useLoaderData<typeof loader>();
  const favoriteJobs = new Set();

  const isJobFavorite = (jobId: number) => favoriteJobs.has(jobId);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Job Opportunities</h1>

      <Form className="mb-6">
        <div className="flex items-center">
          <input
            name="term"
            type="text"
            placeholder="Search jobs..."
            className="w-full px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>

        <div className="mt-2">
          <label className="inline-flex items-center">
            <input name="filter" type="radio" defaultChecked value="all" />
            <span className="ml-2">All</span>
          </label>
          <label className="inline-flex items-center ml-6">
            <input name="filter" type="radio" value="title" />
            <span className="ml-2">By Title</span>
          </label>
        </div>
      </Form>

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
              <button
                className={`px-4 py-2 rounded-md ${
                  isJobFavorite(job.id)
                    ? "bg-red-500 text-white"
                    : "bg-gray-300 text-gray-800"
                } hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {isJobFavorite(job.id) ? "Unfavorite" : "Favorite"}
              </button>
            </div>
            <p className="mt-2 text-gray-700">{job.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
