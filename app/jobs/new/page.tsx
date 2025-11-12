'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

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

      const { data, error: insertError } = await supabase
        .from('jobs')
        .insert({
          site_name: formData.get('site_name') as string,
          client_name: formData.get('client_name') as string,
          description: formData.get('description') as string,
          address: formData.get('address') as string,
          start_date: formData.get('start_date') as string,
          end_date: formData.get('end_date') as string,
          estimated_completion: formData.get('estimated_completion') as string,
          status: formData.get('status') as string,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create initial job update
      await supabase.from('job_updates').insert({
        job_id: data.id,
        update_type: 'status_change',
        title: 'Job Created',
        description: `New job created: ${data.site_name}`,
        created_by: user.id,
      });

      router.push(`/jobs/${data.id}`);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create job');
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
          href="/jobs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Create New Job</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add a new construction project to start tracking
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-6">
          {/* Site Name */}
          <div>
            <Label htmlFor="site_name">Site Name *</Label>
            <Input
              id="site_name"
              name="site_name"
              placeholder="e.g. Riverside Apartments - Building A"
              required
              disabled={loading}
            />
          </div>

          {/* Client Name */}
          <div>
            <Label htmlFor="client_name">Client Name *</Label>
            <Input
              id="client_name"
              name="client_name"
              placeholder="e.g. ABC Construction Ltd"
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Brief description of the project..."
              disabled={loading}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Site Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="123 Main Street, London, SW1A 1AA"
              disabled={loading}
            />
          </div>

          {/* Dates */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" name="start_date" type="date" disabled={loading} />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" name="end_date" type="date" disabled={loading} />
            </div>
            <div>
              <Label htmlFor="estimated_completion">Est. Completion</Label>
              <Input
                id="estimated_completion"
                name="estimated_completion"
                type="date"
                disabled={loading}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              name="status"
              required
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
            <Link href="/jobs">
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
