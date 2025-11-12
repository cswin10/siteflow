import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Plus, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export default async function DiaryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  // Fetch diary entries
  let query = supabase
    .from('site_diary_entries')
    .select(
      `
      *,
      job:jobs(id, site_name),
      creator:profiles!site_diary_entries_created_by_fkey(full_name)
    `
    )
    .order('entry_date', { ascending: false });

  // Filter based on role
  if (user.role === 'worker') {
    const { data: assignments } = await supabase
      .from('job_assignments')
      .select('job_id')
      .eq('worker_id', user.id);
    const jobIds = assignments?.map((a) => a.job_id) || [];
    if (jobIds.length > 0) {
      query = query.in('job_id', jobIds);
    }
  } else if (user.role === 'client') {
    const { data: clientJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('client_id', user.id);
    const jobIds = clientJobs?.map((j) => j.id) || [];
    if (jobIds.length > 0) {
      query = query.in('job_id', jobIds);
    }
  }

  const { data: entries } = await query;

  const canCreate = user.role === 'admin' || user.role === 'site_manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Site Diary</h1>
          <p className="mt-2 text-sm text-gray-600">
            Daily logs and site activity records
          </p>
        </div>
        {canCreate && (
          <Link href="/diary/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </Link>
        )}
      </div>

      {/* Entries List */}
      {entries && entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry: any) => (
            <Link
              key={entry.id}
              href={`/diary/${entry.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">
                      {entry.job?.site_name || 'Unknown Site'}
                    </h3>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(entry.entry_date).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    {entry.weather && <span>Weather: {entry.weather}</span>}
                    {entry.workers_present !== null && (
                      <span>Workers: {entry.workers_present}</span>
                    )}
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-gray-700">{entry.notes}</p>

                  {entry.issues && (
                    <div className="mt-2 rounded-md bg-yellow-50 px-3 py-2">
                      <p className="text-xs font-medium text-yellow-800">
                        Issues: {entry.issues}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {entry.creator?.full_name || 'Unknown'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">No diary entries yet</p>
          {canCreate && (
            <Link href="/diary/new">
              <Button className="mt-4">Create your first entry</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
