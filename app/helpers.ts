import { Job } from "./services/jobs-api";

export function isJobsArray(data: unknown): data is Job[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item): item is Job =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "job_title" in item &&
        "description" in item &&
        "company" in item
    )
  );
}
