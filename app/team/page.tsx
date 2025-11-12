import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Users, Mail, Phone, Briefcase } from 'lucide-react';

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (user.role !== 'admin' && user.role !== 'site_manager') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Fetch all team members
  const { data: team } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['site_manager', 'worker'])
    .order('full_name');

  // Fetch job assignments
  const { data: assignments } = await supabase
    .from('job_assignments')
    .select(
      `
      *,
      job:jobs(id, site_name, status)
    `
    );

  // Group assignments by worker
  const assignmentsByWorker: Record<string, any[]> = {};
  assignments?.forEach((a: any) => {
    if (!assignmentsByWorker[a.worker_id]) {
      assignmentsByWorker[a.worker_id] = [];
    }
    assignmentsByWorker[a.worker_id].push(a);
  });

  const roleLabels = {
    admin: 'Admin',
    site_manager: 'Site Manager',
    worker: 'Worker',
    client: 'Client',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your construction team and assignments
        </p>
      </div>

      {team && team.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => {
            const memberAssignments = assignmentsByWorker[member.id] || [];
            const activeJobs = memberAssignments.filter(
              (a: any) => a.job?.status === 'in_progress'
            );

            return (
              <div
                key={member.id}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
                    {member.full_name?.charAt(0) || '?'}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {member.full_name || 'Unnamed'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {roleLabels[member.role as keyof typeof roleLabels]}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone_number}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>
                      {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {activeJobs.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <p className="text-xs font-medium text-gray-500">Current Jobs:</p>
                    <div className="mt-2 space-y-1">
                      {activeJobs.map((assignment: any) => (
                        <p key={assignment.id} className="text-sm text-gray-700">
                          • {assignment.job?.site_name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">No team members found</p>
        </div>
      )}
    </div>
  );
}
