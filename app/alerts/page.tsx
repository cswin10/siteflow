import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Bell, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (user.role !== 'admin' && user.role !== 'site_manager') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Fetch SMS alerts
  const { data: alerts } = await supabase
    .from('sms_alerts')
    .select(
      `
      *,
      recipient:profiles!sms_alerts_recipient_id_fkey(full_name, email)
    `
    )
    .order('sent_at', { ascending: false })
    .limit(50);

  const stats = {
    total: alerts?.length || 0,
    sent: alerts?.filter((a) => a.status === 'sent' || a.status === 'delivered').length || 0,
    failed: alerts?.filter((a) => a.status === 'failed').length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SMS Alerts</h1>
        <p className="mt-2 text-sm text-gray-600">View and manage SMS notifications</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Bell className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="mt-2 text-2xl font-bold text-green-600">{stats.sent}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {alerts && alerts.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={alert.status || 'sent'} />
                      <span className="text-sm text-gray-500">
                        {alert.alert_type?.replace('_', ' ') || 'General'}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-900">{alert.message}</p>

                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>To: {alert.recipient?.full_name || alert.phone_number}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(alert.sent_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">No SMS alerts sent yet</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    sent: { label: 'Sent', class: 'bg-blue-100 text-blue-700' },
    delivered: { label: 'Delivered', class: 'bg-green-100 text-green-700' },
    failed: { label: 'Failed', class: 'bg-red-100 text-red-700' },
  };

  const config = configs[status as keyof typeof configs] || configs.sent;

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  );
}
