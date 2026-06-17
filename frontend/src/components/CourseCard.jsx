export default function CourseCard({ course, onEnroll, enrolled, isAdmin, onEdit, onDelete }) {
  return (
    <div className="card hover:border-primary-600/40 transition-all duration-200 animate-fade-in group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 border border-primary-200 flex items-center justify-center text-[11px] font-bold flex-shrink-0 tracking-wide">
          CS
        </div>
        <span className="text-primary-700 font-bold text-lg">
          {Number(course.price) === 0 ? 'Free' : `INR ${course.price}`}
        </span>
      </div>

      <h3 className="text-slate-900 font-semibold text-lg mt-3 leading-tight">{course.title}</h3>
      <p className="text-slate-600 text-sm mt-2 line-clamp-3 leading-relaxed">
        {course.description || 'No description provided.'}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>ID: {course.id}</span>
        <span>{Number(course.price) === 0 ? 'Open Access' : 'Paid Program'}</span>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
        {isAdmin ? (
          <>
            <button onClick={() => onEdit(course)} className="btn-secondary flex-1 text-sm py-2">
              Edit
            </button>
            <button onClick={() => onDelete(course.id)} className="btn-danger flex-1 text-sm py-2">
              Delete
            </button>
          </>
        ) : (
          <button
            onClick={() => onEnroll(course)}
            disabled={enrolled}
            className={`w-full text-sm py-2 ${enrolled ? 'btn-secondary opacity-60 cursor-not-allowed' : 'btn-primary'}`}
          >
            {enrolled ? 'Enrolled' : 'Enroll Now'}
          </button>
        )}
      </div>
    </div>
  );
}
