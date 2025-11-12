import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Plus, Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function CompliancePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  //  Fetch compliance logs
  let query = supabase
    .from('compliance_logs')
    .select(
      `
      *,
      job:jobs(id, site_name)
    `
    )
    .order('created_at', { ascending: false });

  // Role-based filtering
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

  const { data: logs } = await query;

  const canCreate = user.role === 'admin' || user.role === 'site_manager';

  // Calculate stats
  const stats = {
    total: logs?.length || 0,
    compliant: logs?.filter((l) => l.status === 'compliant').length || 0,
    pending: logs?.filter((l) => l.status === 'pending').length || 0,
    flagged: logs?.filter((l) => l.status === 'flagged').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track safety, certifications, and regulatory compliance
          </p>
        </div>
        {canCreate && (
          <Link href="/compliance/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Log
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={<Shield />} color="blue" />
        <StatCard
          label="Compliant"
          value={stats.compliant}
          icon={<CheckCircle2 />}
          color="green"
        />
        <StatCard label="Pending" value={stats.pending} icon={<Clock />} color="yellow" />
        <StatCard
          label="Flagged"
          value={stats.flagged}
          icon={<AlertTriangle />}
          color="red"
        />
      </div>

      {/* Compliance Logs */}
      {logs && logs.length > 0 ? (
        <div className="space-y-4">
          {logs.map((log: any) => (
            <ComplianceCard key={log.id} log={log} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">No compliance logs yet</p>
          {canCreate && (
            <Link href="/compliance/new">
              <Button className="mt-4">Create your first log</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colors[color as keyof typeof colors]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ComplianceCard({ log }: { log: any }) {
  const statusConfig = {
    compliant: {
      label: 'Compliant',
      class: 'bg-green-100 text-green-700',
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    pending: {
      label: 'Pending',
      class: 'bg-yellow-100 text-yellow-700',
      icon: <Clock className="h-5 w-5" />,
    },
    flagged: {
      label: 'Flagged',
      class: 'bg-red-100 text-red-700',
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    expired: {
      label: 'Expired',
      class: 'bg-gray-100 text-gray-700',
      icon: <AlertTriangle className="h-5 w-5" />,
    },
  };

  const status = statusConfig[log.status as keyof typeof statusConfig];
  const typeLabels = {
    ppe: 'PPE Verification',
    cscs_card: 'CSCS Card',
    insurance: 'Insurance',
    site_access: 'Site Access',
    safety_inspection: 'Safety Inspection',
    other: 'Other',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {status.icon}
            <h3 className="font-semibold text-gray-900">{log.title}</h3>
          </div>

          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="font-medium">
              {typeLabels[log.compliance_type as keyof typeof typeLabels]}
            </span>
            <span>•</span>
            <span>{log.job?.site_name || 'Unknown Site'}</span>
            {log.due_date && (
              <>
                <span>•</span>
                <span>Due: {new Date(log.due_date).toLocaleDateString()}</span>
              </>
            )}
          </div>

          {log.description && (
            <p className="mt-3 text-sm text-gray-700">{log.description}</p>
          )}
        </div>

        <span className={`rounded-full px-4 py-1 text-sm font-medium ${status.class}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
}
