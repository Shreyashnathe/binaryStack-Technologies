import { Link } from 'react-router-dom';

export default function CourseCard({
  course,
  onEnroll,
  enrolled,
  isAdmin,
  onEdit,
  onDelete,
  inCart,
  onAddToCart,
}) {
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
          enrolled ? (
            <button
              disabled
              className="w-full text-sm py-2 btn-secondary opacity-60 cursor-not-allowed"
            >
              Enrolled
            </button>
          ) : Number(course.price) === 0 ? (
            <button
              onClick={() => onEnroll(course)}
              className="w-full text-sm py-2 btn-primary"
            >
              Enroll Now
            </button>
          ) : inCart ? (
            <Link
              to="/student/cart"
              className="w-full text-center text-sm py-2 btn-secondary border-primary-500 text-primary-700 bg-primary-50/50 hover:bg-primary-50 hover:text-primary-800 transition-colors"
            >
              In Cart (Go to Cart)
            </Link>
          ) : (
            <button
              onClick={() => onAddToCart(course)}
              className="w-full text-sm py-2 btn-primary"
            >
              Add to Cart
            </button>
          )
        )}
      </div>
    </div>
  );
}
