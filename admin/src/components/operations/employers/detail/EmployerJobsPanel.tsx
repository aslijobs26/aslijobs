import { Briefcase, ExternalLink, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  OPERATIONS_ROUTES,
  operationsJobDetailPath,
} from "../../../../constants/operations-routes";
import { useOperationsEmployerJobs } from "../../../../hooks/use-operations-employers";
import { JobsPaginationBar } from "../../jobs/JobsPaginationBar";
import { OperationsBadge } from "../../../ui/OperationsBadge";

interface EmployerJobsPanelProps {
  employerId: string;
}

export function EmployerJobsPanel({ employerId }: EmployerJobsPanelProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  const jobsQuery = useOperationsEmployerJobs(employerId, {
    page,
    limit,
    status: statusFilter,
  });

  const jobs = jobsQuery.data?.jobs ?? [];
  const pagination = jobsQuery.data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Posted Jobs ({pagination?.total ?? 0})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-border-subtle bg-hero-bg/60 px-2 text-xs font-medium text-foreground outline-none"
          >
            <option value="">All Job Statuses</option>
            <option value="active">Active</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>

          <button
            type="button"
            onClick={() =>
              navigate(
                `${OPERATIONS_ROUTES.JOBS_POST}?employerId=${encodeURIComponent(employerId)}`,
              )
            }
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            Post New Job
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain scrollbar-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="min-w-[700px] text-left text-xs xl:min-w-full">
            <thead className="border-b border-border-subtle bg-hero-bg/60 text-[10px] font-semibold uppercase text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  JOB TITLE
                </th>
                <th scope="col" className="px-3 py-2.5">
                  CATEGORY & MODE
                </th>
                <th scope="col" className="px-3 py-2.5">
                  LOCATION
                </th>
                <th scope="col" className="px-3 py-2.5">
                  SALARY
                </th>
                <th scope="col" className="px-3 py-2.5">
                  APPLICATIONS
                </th>
                <th scope="col" className="px-3 py-2.5">
                  STATUS
                </th>
                <th scope="col" className="px-3 py-2.5 text-right">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {jobsQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Loading posted jobs…
                  </td>
                </tr>
              ) : null}

              {!jobsQuery.isLoading && jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No jobs posted yet by this employer.
                  </td>
                </tr>
              ) : null}

              {!jobsQuery.isLoading &&
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="transition-colors hover:bg-hero-bg/30"
                  >
                    <td className="py-3 pl-4 pr-3">
                      <Link
                        to={operationsJobDetailPath(job.jobId)}
                        className="font-semibold text-foreground hover:text-primary"
                      >
                        {job.jobTitle}
                      </Link>
                      <span className="block font-mono text-[11px] text-muted">
                        {job.jobId}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      <span className="block text-foreground font-medium">
                        {job.businessCategory || "General"}
                      </span>
                      <span className="text-[11px]">{job.workMode}</span>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 shrink-0" />
                        {[job.city, job.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">
                      {job.salary}
                    </td>
                    <td className="px-3 py-3 font-bold tabular-nums text-foreground">
                      {job.applicationsCount}
                    </td>
                    <td className="px-3 py-3">
                      <OperationsBadge
                        variant={
                          job.status === "active"
                            ? "default"
                            : job.status === "pending_approval"
                              ? "medium"
                              : "low"
                        }
                      >
                        {job.statusLabel}
                      </OperationsBadge>
                    </td>
                    <td className="py-3 pl-3 pr-4 text-right">
                      <Link
                        to={operationsJobDetailPath(job.jobId)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary-light"
                      >
                        View Job
                        <ExternalLink className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total > 0 ? (
          <div className="border-t border-border-subtle p-3">
            <JobsPaginationBar
              pagination={pagination}
              onPageChange={setPage}
              onLimitChange={(newLimit: number) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
