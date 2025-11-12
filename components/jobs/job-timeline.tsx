import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  FileText,
  AlertTriangle,
  MessageSquare,
  Image as ImageIcon,
  TrendingUp,
} from 'lucide-react';

export function JobTimeline({ updates }: { updates: any[] }) {
  const icons = {
    status_change: <TrendingUp className="h-4 w-4" />,
    task_completed: <CheckCircle2 className="h-4 w-4" />,
    photo_uploaded: <ImageIcon className="h-4 w-4" />,
    diary_entry: <FileText className="h-4 w-4" />,
    compliance_update: <AlertTriangle className="h-4 w-4" />,
    comment: <MessageSquare className="h-4 w-4" />,
  };

  if (updates.length === 0) {
    return <p className="text-sm text-gray-500">No activity yet</p>;
  }

  return (
    <div className="space-y-4">
      {updates.map((update: any) => (
        <div key={update.id} className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            {icons[update.update_type as keyof typeof icons] || icons.comment}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{update.title}</p>
            {update.description && (
              <p className="mt-1 text-xs text-gray-600">{update.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {update.creator?.full_name || 'System'} •{' '}
              {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
