'use client';

import { useState } from 'use';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Check, Clock, AlertCircle, XCircle } from 'lucide-react';
import type { Task } from '@/types';

export function TaskList({
  tasks,
  jobId,
  canEdit,
}: {
  tasks: any[];
  jobId: string;
  canEdit: boolean;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setUpdating(taskId);
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);

      if (error) throw error;

      // Create job update
      const { data: task } = await supabase.from('tasks').select('title').eq('id', taskId).single();

      if (task) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('job_updates').insert({
          job_id: jobId,
          update_type: 'task_completed',
          title: `Task ${newStatus}: ${task.title}`,
          created_by: user?.id,
        });
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setUpdating(null);
    }
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-gray-400" />,
    in_progress: <AlertCircle className="h-4 w-4 text-blue-500" />,
    completed: <Check className="h-4 w-4 text-green-500" />,
    blocked: <XCircle className="h-4 w-4 text-red-500" />,
  };

  const priorityColors = {
    low: 'text-gray-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  };

  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-gray-500">
        No tasks yet. Add your first task to get started.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {tasks.map((task: any) => {
        const isOverdue =
          task.status !== 'completed' &&
          task.due_date &&
          new Date(task.due_date) < new Date();

        return (
          <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div className="mt-1">
                {statusIcons[task.status as keyof typeof statusIcons]}
              </div>

              {/* Task Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4
                      className={`font-medium ${
                        task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      {task.assignee && (
                        <span>Assigned to: {task.assignee.full_name}</span>
                      )}
                      {task.due_date && (
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      )}
                      {task.priority && (
                        <span className={priorityColors[task.priority as keyof typeof priorityColors]}>
                          Priority: {task.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  {canEdit && (
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      disabled={updating === task.id}
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
