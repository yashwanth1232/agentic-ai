import { Recommendation, supabase } from '../lib/supabase';
import { Lightbulb, X, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  onUpdate: () => void;
}

export default function RecommendationsPanel({
  recommendations,
  onUpdate,
}: RecommendationsPanelProps) {
  const dismissRecommendation = async (id: string) => {
    try {
      await supabase
        .from('ai_recommendations')
        .update({ status: 'dismissed' })
        .eq('id', id);
      onUpdate();
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'urgent_tasks':
        return <AlertTriangle className="w-5 h-5" />;
      case 'study_schedule':
        return <Calendar className="w-5 h-5" />;
      case 'workload_warning':
        return <TrendingUp className="w-5 h-5" />;
      case 'deadline_alert':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getColor = (priority: number) => {
    if (priority >= 9) return 'bg-red-50 border-red-200 text-red-700';
    if (priority >= 7) return 'bg-orange-50 border-orange-200 text-orange-700';
    return 'bg-blue-50 border-blue-200 text-blue-700';
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
        AI Recommendations
      </h3>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const content = rec.content as any;
          return (
            <div
              key={rec.id}
              className={`border rounded-lg p-4 ${getColor(rec.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">{getIcon(rec.recommendation_type)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{content.title}</h4>
                    <p className="text-sm mb-2">{content.message}</p>

                    {content.tasks && content.tasks.length > 0 && (
                      <ul className="text-sm space-y-1 mt-2">
                        {content.tasks.map((task: any, idx: number) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{task.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {content.sessions && content.sessions.length > 0 && (
                      <ul className="text-sm space-y-1 mt-2">
                        {content.sessions.slice(0, 3).map((session: any, idx: number) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3" />
                            <span>{session.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => dismissRecommendation(rec.id)}
                  className="text-gray-400 hover:text-gray-600 transition ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
