'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewDiaryEntryPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('id, site_name')
      .in('status', ['planning', 'in_progress'])
      .order('site_name');

    setJobs(data || []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const jobId = formData.get('job_id') as string;
      const notes = formData.get('notes') as string;

      const { data, error: insertError } = await supabase
        .from('site_diary_entries')
        .insert({
          job_id: jobId,
          entry_date: formData.get('entry_date') as string,
          weather: formData.get('weather') as string,
          workers_present: parseInt(formData.get('workers_present') as string) || null,
          notes: notes,
          issues: formData.get('issues') as string,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create job update
      await supabase.from('job_updates').insert({
        job_id: jobId,
        update_type: 'diary_entry',
        title: `Site Diary Entry: ${new Date(formData.get('entry_date') as string).toLocaleDateString()}`,
        description: notes.substring(0, 100),
        created_by: user.id,
      });

      router.push('/diary');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create diary entry');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/diary"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Diary
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">New Diary Entry</h1>
        <p className="mt-2 text-sm text-gray-600">Record today's site activities and notes</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-6">
          {/* Job Selection */}
          <div>
            <Label htmlFor="job_id">Site/Job *</Label>
            <select
              id="job_id"
              name="job_id"
              required
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a site</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.site_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <Label htmlFor="entry_date">Date *</Label>
              <Input
                id="entry_date"
                name="entry_date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="weather">Weather</Label>
              <Input
                id="weather"
                name="weather"
                placeholder="e.g. Sunny, 18°C"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="workers_present">Workers Present</Label>
              <Input
                id="workers_present"
                name="workers_present"
                type="number"
                min="0"
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Daily Notes *</Label>
            <textarea
              id="notes"
              name="notes"
              rows={8}
              placeholder="Describe the work completed today, progress made, materials used, etc..."
              required
              disabled={loading}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tip: Click the microphone icon to use voice-to-text (coming soon)
            </p>
          </div>

          {/* Issues */}
          <div>
            <Label htmlFor="issues">Issues or Concerns</Label>
            <textarea
              id="issues"
              name="issues"
              rows={3}
              placeholder="Any problems, delays, safety concerns, or items requiring attention..."
              disabled={loading}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Entry'}
            </Button>
            <Link href="/diary">
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
