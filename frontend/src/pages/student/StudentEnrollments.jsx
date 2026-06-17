import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getStudentEnrollments } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentEnrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!user) return;
    getStudentEnrollments(user.userId)
      .then((r) => setEnrollments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
        <p className="text-slate-600 mt-1">You are enrolled in {enrollments.length} course{enrollments.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading...</div>
      ) : enrollments.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-600 mb-5">You have not enrolled in any courses yet.</p>
          <a href="/student/courses" className="btn-primary inline-block text-sm">Browse Courses</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {enrollments.map((e) => (
            <div key={e.id} className="card hover:border-primary-600/40 transition-all duration-200 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-xs font-bold tracking-wide flex-shrink-0">
                  CR
                </div>
                <div className="flex-1">
                  <h3 className="text-slate-900 font-semibold text-lg">{e.courseTitle}</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Enrolled on {new Date(e.enrolledAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                  <div className="mt-3">
                    <span className="badge-student">Active</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
