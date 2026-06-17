import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="relative flex min-h-screen bg-dark-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(59, 109, 228, 0.16), transparent 35%), radial-gradient(circle at bottom left, rgba(35, 71, 154, 0.12), transparent 30%)',
        }}
      />
      <Sidebar />
      <main className="relative flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 md:py-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
