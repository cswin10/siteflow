'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCompliancePage() {
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

      const { data, error: insertError } = await supabase
        .from('compliance_logs')
        .insert({
          job_id: jobId,
          compliance_type: formData.get('compliance_type') as string,
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          status: formData.get('status') as string,
          due_date: formData.get('due_date') as string,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create job update
      await supabase.from('job_updates').insert({
        job_id: jobId,
        update_type: 'compliance_update',
        title: `Compliance Log: ${formData.get('title')}`,
        description: `Status: ${formData.get('status')}`,
        created_by: user.id,
      });

      router.push('/compliance');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create compliance log');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/compliance"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Compliance
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">New Compliance Log</h1>
        <p className="mt-2 text-sm text-gray-600">Create a compliance check or record</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="job_id">Site/Job *</Label>
            <select
              id="job_id"
              name="job_id"
              required
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select a site</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.site_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="compliance_type">Type *</Label>
            <select
              id="compliance_type"
              name="compliance_type"
              required
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="ppe">PPE Verification</option>
              <option value="cscs_card">CSCS Card</option>
              <option value="insurance">Insurance</option>
              <option value="site_access">Site Access</option>
              <option value="safety_inspection">Safety Inspection</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Weekly PPE Check - Week 5"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Additional details..."
              disabled={loading}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                name="status"
                required
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="compliant">Compliant</option>
                <option value="flagged">Flagged</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" name="due_date" type="date" disabled={loading} />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Log'}
            </Button>
            <Link href="/compliance">
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
