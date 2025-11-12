import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Job } from '@/types';

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  // Build query based on user role and filters
  let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });

  // Filter by status if provided
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status);
  }

  // Filter by search term
  if (searchParams.search) {
    query = query.or(
      `site_name.ilike.%${searchParams.search}%,client_name.ilike.%${searchParams.search}%`
    );
  }

  // Role-based filtering
  if (user.role === 'worker') {
    const { data: assignments } = await supabase
      .from('job_assignments')
      .select('job_id')
      .eq('worker_id', user.id);
    const jobIds = assignments?.map((a) => a.job_id) || [];
    if (jobIds.length > 0) {
      query = query.in('id', jobIds);
    } else {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // No results
    }
  } else if (user.role === 'client') {
    query = query.eq('client_id', user.id);
  }

  const { data: jobs } = await query;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your construction projects and sites
          </p>
        </div>
        {(user.role === 'admin' || user.role === 'site_manager') && (
          <Link href="/jobs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto">
          <FilterButton href="/jobs" label="All" active={!searchParams.status} />
          <FilterButton
            href="/jobs?status=planning"
            label="Planning"
            active={searchParams.status === 'planning'}
          />
          <FilterButton
            href="/jobs?status=in_progress"
            label="In Progress"
            active={searchParams.status === 'in_progress'}
          />
          <FilterButton
            href="/jobs?status=on_hold"
            label="On Hold"
            active={searchParams.status === 'on_hold'}
          />
          <FilterButton
            href="/jobs?status=completed"
            label="Completed"
            active={searchParams.status === 'completed'}
          />
        </div>

        {/* Search */}
        <form method="GET" className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="search"
            placeholder="Search jobs..."
            defaultValue={searchParams.search}
            className="h-10 w-full rounded-md border border-gray-300 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64"
          />
        </form>
      </div>

      {/* Jobs Grid */}
      {jobs && jobs.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No jobs found</p>
          {(user.role === 'admin' || user.role === 'site_manager') && (
            <Link href="/jobs/new">
              <Button className="mt-4">Create your first job</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
      }`}
    >
      {label}
    </Link>
  );
}

function JobCard({ job }: { job: Job }) {
  const statusConfig = {
    planning: { label: 'Planning', class: 'bg-gray-100 text-gray-700' },
    in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-700' },
    on_hold: { label: 'On Hold', class: 'bg-yellow-100 text-yellow-700' },
    completed: { label: 'Completed', class: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
  };

  const status = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.planning;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
    >
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{job.site_name}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.class}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">Client:</span> {job.client_name}
        </p>
        {job.address && (
          <p>
            <span className="font-medium">Location:</span> {job.address}
          </p>
        )}
        {job.start_date && (
          <p>
            <span className="font-medium">Start:</span>{' '}
            {new Date(job.start_date).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  );
}
