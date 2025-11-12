import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/jobs/task-list';
import { JobTimeline } from '@/components/jobs/job-timeline';
import { AddTaskForm } from '@/components/jobs/add-task-form';

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  // Fetch job details
  const { data: job } = await supabase.from('jobs').select('*').eq('id', params.id).single();

  if (!job) notFound();

  // Fetch tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select(
      `
      *,
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, email)
    `
    )
    .eq('job_id', params.id)
    .order('created_at', { ascending: false });

  // Fetch job updates/timeline
  const { data: updates } = await supabase
    .from('job_updates')
    .select(
      `
      *,
      creator:profiles!job_updates_created_by_fkey(full_name)
    `
    )
    .eq('job_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch assigned workers
  const { data: assignments } = await supabase
    .from('job_assignments')
    .select(
      `
      *,
      worker:profiles!job_assignments_worker_id_fkey(id, full_name, email, phone_number)
    `
    )
    .eq('job_id', params.id);

  // Calculate stats
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0;
  const overdueTasks =
    tasks?.filter((t) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date())
      .length || 0;

  const statusConfig = {
    planning: { label: 'Planning', class: 'bg-gray-100 text-gray-700' },
    in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-700' },
    on_hold: { label: 'On Hold', class: 'bg-yellow-100 text-yellow-700' },
    completed: { label: 'Completed', class: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
  };

  const status = statusConfig[job.status as keyof typeof statusConfig];
  const canEdit = user.role === 'admin' || user.role === 'site_manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Link>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.site_name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {job.client_name}
              </span>
              {job.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.address}
                </span>
              )}
              {job.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(job.start_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-medium ${status.class}`}>
            {status.label}
          </span>
        </div>

        {job.description && (
          <p className="mt-4 text-gray-600">{job.description}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Tasks" value={totalTasks} />
        <StatCard label="Completed" value={completedTasks} color="green" />
        <StatCard label="In Progress" value={totalTasks - completedTasks - overdueTasks} color="blue" />
        <StatCard label="Overdue" value={overdueTasks} color="red" />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks Section */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
                {canEdit && <AddTaskForm jobId={params.id} />}
              </div>
            </div>
            <TaskList tasks={tasks || []} jobId={params.id} canEdit={canEdit} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900">Team</h3>
            <div className="space-y-3">
              {assignments && assignments.length > 0 ? (
                assignments.map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                      {assignment.worker?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {assignment.worker?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">{assignment.role || 'Worker'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No team members assigned</p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900">Recent Activity</h3>
            <JobTimeline updates={updates || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'gray',
}: {
  label: string;
  value: number;
  color?: 'gray' | 'green' | 'blue' | 'red';
}) {
  const colorClasses = {
    gray: 'text-gray-900',
    green: 'text-green-600',
    blue: 'text-blue-600',
    red: 'text-red-600',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
