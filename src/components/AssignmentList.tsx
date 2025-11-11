import { Assignment } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Circle, Clock, AlertCircle, Trash2 } from 'lucide-react';

interface AssignmentListProps {
  assignments: Assignment[];
  onUpdate: () => void;
}

export default function AssignmentList({ assignments, onUpdate }: AssignmentListProps) {
  const updateStatus = async (id: string, status: string) => {
    try {
      await supabase
        .from('assignments')
        .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
        .eq('id', id);
      onUpdate();
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await supabase.from('assignments').delete().eq('id', id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-red-600' };
    if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-orange-600' };
    if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'text-orange-600' };
    return { text: `${diffDays} days left`, color: 'text-gray-600' };
  };

  const pendingAssignments = assignments.filter((a) => a.status !== 'completed');
  const completedAssignments = assignments.filter((a) => a.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Active Assignments
        </h3>

        {pendingAssignments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active assignments</p>
        ) : (
          <div className="space-y-3">
            {pendingAssignments.map((assignment) => {
              const dueDate = formatDueDate(assignment.due_date);
              return (
                <div
                  key={assignment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <button
                          onClick={() =>
                            updateStatus(
                              assignment.id,
                              assignment.status === 'pending' ? 'in_progress' : 'completed'
                            )
                          }
                          className="text-gray-400 hover:text-blue-600 transition"
                        >
                          {assignment.status === 'in_progress' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(
                            assignment.priority
                          )}`}
                        >
                          {assignment.priority}
                        </span>
                      </div>

                      {assignment.description && (
                        <p className="text-sm text-gray-600 ml-8 mb-2">{assignment.description}</p>
                      )}

                      <div className="flex items-center space-x-4 ml-8 text-sm">
                        <span className={`flex items-center ${dueDate.color}`}>
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {dueDate.text}
                        </span>
                        <span className="text-gray-500">
                          {assignment.estimated_hours}h estimated
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteAssignment(assignment.id)}
                      className="text-gray-400 hover:text-red-600 transition ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {completedAssignments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
            Completed ({completedAssignments.length})
          </h3>

          <div className="space-y-3">
            {completedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700 line-through">{assignment.title}</span>
                  </div>
                  <button
                    onClick={() => deleteAssignment(assignment.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
