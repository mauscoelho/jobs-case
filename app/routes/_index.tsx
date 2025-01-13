import type { MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { fetchAllJobs } from "~/services/jobs-api";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader() {
  const allJobs = await fetchAllJobs();
  return { jobs: allJobs };
}

export default function Index() {
  const { jobs } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>All Jobs</h1>
      <ul>
        {jobs.map((job) => (
          <li key={job.id}>{job.job_title}</li>
        ))}
      </ul>
    </div>
  );
}
