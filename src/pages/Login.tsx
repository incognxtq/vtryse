import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Login() {
  const location = useLocation()
  const isSignup = location.pathname === '/signup'

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('type') === 'signup') {
      setErrorMsg('Email confirmed! You can now log in.')
    }
  }, [])

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          username,
        },
      },
    })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setErrorMsg('Check your email to confirm sign up!')
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrorMsg(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-void px-4">
      <div className="w-full max-w-sm p-8 bg-surface border border-border-subtle rounded-xl">
        <Link to="/" className="block text-2xl font-semibold mb-6 text-trace-dim">
          VTryse
        </Link>

        <h2 className="text-lg font-medium mb-4 text-text-primary">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h2>

        <div className="flex flex-col gap-3">
          {isSignup && (
            <>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-void border border-border-subtle p-2 rounded text-text-primary placeholder:text-text-muted"
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-void border border-border-subtle p-2 rounded text-text-primary placeholder:text-text-muted"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-void border border-border-subtle p-2 rounded text-text-primary placeholder:text-text-muted"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-void border border-border-subtle p-2 rounded text-text-primary placeholder:text-text-muted"
          />
        </div>

        <button
          onClick={isSignup ? handleSignUp : handleLogin}
          className="w-full mt-4 bg-trace-dim text-white px-4 py-2 rounded-lg hover:bg-trace transition-colors"
        >
          {isSignup ? 'Sign Up' : 'Log In'}
        </button>

        {errorMsg && <p className="mt-3 text-sm text-red-400">{errorMsg}</p>}

        <p className="mt-4 text-sm text-text-muted text-center">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <Link to="/login" className="text-trace-dim hover:underline">
                Log in
              </Link>
            </>
          ) : (
            <>
              Don't have an account yet?{' '}
              <Link to="/signup" className="text-trace-dim hover:underline">
                Sign up
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default Login