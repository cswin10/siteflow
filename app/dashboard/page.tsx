import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import {
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
} from 'lucide-react';
import type { DashboardStats } from '@/types';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Fetch dashboard stats
  const { data: statsData } = await supabase.rpc('get_dashboard_stats', {
    user_role: user.role,
    user_id: user.id,
  });

  const stats: DashboardStats = statsData || {
    active_jobs: 0,
    overdue_tasks: 0,
    compliance_gaps: 0,
    pending_tasks: 0,
    total_workers: 0,
  };

  // Fetch recent jobs
  let recentJobsQuery = supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (user.role === 'worker') {
    const { data: assignments } = await supabase
      .from('job_assignments')
      .select('job_id')
      .eq('worker_id', user.id);

    const jobIds = assignments?.map((a) => a.job_id) || [];
    recentJobsQuery = recentJobsQuery.in('id', jobIds);
  } else if (user.role === 'client') {
    recentJobsQuery = recentJobsQuery.eq('client_id', user.id);
  }

  const { data: recentJobs } = await recentJobsQuery;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.full_name || 'User'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Here&apos;s what&apos;s happening with your construction sites
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Jobs"
          value={stats.active_jobs}
          icon={<Briefcase className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pending_tasks}
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdue_tasks}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
        />
        <StatCard
          title="Compliance Gaps"
          value={stats.compliance_gaps}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Recent Jobs */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentJobs && recentJobs.length > 0 ? (
            recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{job.site_name}</h3>
                  <p className="text-sm text-gray-600">{job.client_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={job.status} />
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No jobs found. Get started by creating your first job.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {(user.role === 'admin' || user.role === 'site_manager') && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickActionCard
              title="Create New Job"
              description="Start tracking a new construction project"
              href="/jobs/new"
              icon={<Briefcase className="h-6 w-6" />}
            />
            <QuickActionCard
              title="Add Diary Entry"
              description="Record today's site activities"
              href="/diary/new"
              icon={<CheckCircle2 className="h-6 w-6" />}
            />
            <QuickActionCard
              title="Log Compliance"
              description="Add safety or compliance check"
              href="/compliance/new"
              icon={<AlertTriangle className="h-6 w-6" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'red' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    planning: { label: 'Planning', class: 'bg-gray-100 text-gray-700' },
    in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-700' },
    on_hold: { label: 'On Hold', class: 'bg-yellow-100 text-yellow-700' },
    completed: { label: 'Completed', class: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planning;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${config.class}`}
    >
      {config.label}
    </span>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
    >
      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
    </a>
  );
}
