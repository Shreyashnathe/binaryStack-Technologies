import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import CourseCard from '../../components/CourseCard';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../api/api';

const emptyForm = { title: '', description: '', price: '' };

export default function AdminCourses() {
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = () =>
    getCourses().then((r) => setCourses(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetchCourses(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setError(''); setShowModal(true); };
  const openEdit   = (c) => { setForm({ title: c.title, description: c.description, price: c.price }); setEditId(c.id); setError(''); setShowModal(true); };
  const closeModal  = () => { setShowModal(false); setError(''); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form, price: parseFloat(form.price) || 0 };
      if (editId) await updateCourse(editId, payload);
      else        await createCourse(payload);
      closeModal();
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try { await deleteCourse(id); fetchCourses(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Courses</h1>
          <p className="text-slate-600 mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} available</p>
        </div>
        <button id="create-course-btn" onClick={openCreate} className="btn-primary">
          + Add Course
        </button>
      </div>

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-600">No courses yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} isAdmin onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <h2 className="text-xl font-bold text-slate-900 mb-5">
              {editId ? 'Edit Course' : 'Create New Course'}
            </h2>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                Error: {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Course Title</label>
                <input name="title" className="input-field" required placeholder="e.g. Spring Boot Mastery"
                  value={form.title} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" rows={3} className="input-field resize-none"
                  placeholder="Course description..." value={form.description} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Price (₹)</label>
                <input name="price" type="number" min="0" step="0.01" className="input-field"
                  placeholder="0 for free" value={form.price} onChange={handleChange} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
