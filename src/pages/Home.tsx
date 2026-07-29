import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home-fixed min-h-screen flex flex-col items-center justify-center bg-void px-4">
      <img
        src="/VTryse_logo.png"
        alt="vtryse logo"
        className="w-32 h-32 md:w-40 md:h-40 mb-6"
      />

      <h1 className="text-6xl md:text-8xl font-bold text-trace tracking-tight mb-8 font-display">
        VTryse
      </h1>

      <div className="flex gap-4">
        <Link
          to="/login"
          className="bg-surface-hover bg-trace-dim text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-trace-dim transition-colors"
        >
          Log In
        </Link>
        <Link
          to="/signup"
          className="bg-surface-hover text-text-primary border border-border-subtle px-6 py-3 rounded-lg text-base font-medium hover:bg-trace-dim transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </div>
  )
}

export default Home