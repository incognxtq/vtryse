import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home-fixed min-h-screen flex flex-col items-center justify-center bg-void px-4">
      <img
        src="/VTryse_logo.png"
        alt="vtryse logo"
        className="w-38 h-38 md:w-50 md:h-45 mb-0"
      />

      <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight mt-0 mb-2 font-display">
        vtryse
      </h1>
      <p className="text-text-muted text-l text-primary mt-0 mb-4">Trace Your Progress</p>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="bg-trace text-white border border-border-subtle px-6 py-3 rounded-lg text-base font-medium transition-colors"
        >
          Log In
        </Link>
        <Link
          to="/signup"
          className="text-white border border-border-subtle px-6 py-3 rounded-lg text-base font-medium hover:bg-trace transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </div>
  )
}

export default Home