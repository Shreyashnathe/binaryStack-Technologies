import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getAllEnrollments, exportEnrollments } from '../../api/api';

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  useEffect(() => {
    getAllEnrollments()
      .then((r) => setEnrollments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (format) => {
    const isCsv = format === 'csv';
    if (isCsv) setExportingCsv(true);
    else setExportingExcel(true);

    try {
      const response = await exportEnrollments(format);
      const blob = new Blob([response.data], {
        type: isCsv ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `enrollments_${new Date().toISOString().slice(0, 10)}.${isCsv ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export enrollments:', err);
      alert('Error occurred while exporting enrollments.');
    } finally {
      if (isCsv) setExportingCsv(false);
      else setExportingExcel(false);
    }
  };

  const filtered = enrollments.filter(
    (e) =>
      e.studentName.toLowerCase().includes(search.toLowerCase()) ||
      e.courseTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">All Enrollments</h1>
        <p className="text-slate-600 mt-1">{enrollments.length} total enrollment{enrollments.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="card">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <input
            className="input-field max-w-xs"
            placeholder="Search by student or course"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('excel')}
              disabled={exportingExcel || exportingCsv}
              className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm"
            >
              {exportingExcel ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </>
              )}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exportingExcel || exportingCsv}
              className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm"
            >
              {exportingCsv ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-slate-600 animate-pulse py-8 text-center">Loading enrollments...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-600">{search ? 'No results found.' : 'No enrollments yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left pb-3 font-medium">#</th>
                  <th className="text-left pb-3 font-medium">Student</th>
                  <th className="text-left pb-3 font-medium">Email</th>
                  <th className="text-left pb-3 font-medium">Course</th>
                  <th className="text-left pb-3 font-medium">Enrolled At</th>
                  <th className="text-left pb-3 font-medium">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((e, i) => (
                  <tr key={e.id} className="hover:bg-slate-100/70 transition-colors">
                    <td className="py-3 text-slate-500">{i + 1}</td>
                    <td className="py-3 text-slate-900 font-medium">{e.studentName}</td>
                    <td className="py-3 text-slate-600">{e.studentEmail}</td>
                    <td className="py-3 text-primary-700">{e.courseTitle}</td>
                    <td className="py-3 text-slate-600">{new Date(e.enrolledAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 text-slate-600">
                      {e.expiryDate ? new Date(e.expiryDate).toLocaleDateString('en-IN') : 'Lifetime'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
