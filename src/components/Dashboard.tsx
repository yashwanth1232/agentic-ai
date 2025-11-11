import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Assignment, Course, Recommendation } from '../lib/supabase';
import {
  LogOut,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  Calendar,
  Brain,
  TrendingUp,
} from 'lucide-react';
import AssignmentList from './AssignmentList';
import AddAssignmentModal from './AddAssignmentModal';
import CoursesPanel from './CoursesPanel';
import RecommendationsPanel from './RecommendationsPanel';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [assignmentsRes, coursesRes, recommendationsRes] = await Promise.all([
        supabase.from('assignments').select('*').eq('user_id', user!.id).order('due_date'),
        supabase.from('courses').select('*').eq('user_id', user!.id),
        supabase
          .from('ai_recommendations')
          .select('*')
          .eq('user_id', user!.id)
          .eq('status', 'pending')
          .order('priority', { ascending: false }),
      ]);

      setAssignments(assignmentsRes.data || []);
      setCourses(coursesRes.data || []);
      setRecommendations(recommendationsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWorkload = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('http://localhost:8000/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user!.id }),
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error analyzing workload:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === 'pending').length,
    inProgress: assignments.filter((a) => a.status === 'in_progress').length,
    completed: assignments.filter((a) => a.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Academic AI Planner</h1>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600">Here's your academic overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <BookOpen className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={analyzeWorkload}
            disabled={analyzing}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md disabled:opacity-50"
          >
            <Brain className="w-5 h-5" />
            <span>{analyzing ? 'Analyzing...' : 'AI Analyze Workload'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Add Assignment</span>
          </button>
        </div>

        {recommendations.length > 0 && (
          <RecommendationsPanel
            recommendations={recommendations}
            onUpdate={loadData}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AssignmentList
              assignments={assignments}
              onUpdate={loadData}
            />
          </div>

          <div>
            <CoursesPanel courses={courses} onUpdate={loadData} />
          </div>
        </div>
      </main>

      {showAddModal && (
        <AddAssignmentModal
          userId={user!.id}
          courses={courses}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
