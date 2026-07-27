import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Login() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        username,
      })

      if (profileError) {
        setErrorMsg(profileError.message)
        return
      }
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
    <div className="min-h-screen flex items-center justify-center bg-void">
      <div className="w-full max-w-sm p-8 bg-surface border border-border-subtle rounded-xl">
        <h1 className="text-2xl font-semibold mb-6 text-trace">vtryse</h1>

        <div className="flex flex-col gap-3">
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

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleLogin}
            className="flex-1 bg-trace text-white px-4 py-2 rounded-lg hover:bg-trace-dim transition-colors"
          >
            Log In
          </button>
          <button
            onClick={handleSignUp}
            className="flex-1 bg-surface-hover text-text-primary px-4 py-2 rounded-lg hover:bg-border-subtle transition-colors"
          >
            Sign Up
          </button>
        </div>

        {errorMsg && <p className="mt-3 text-sm text-red-400">{errorMsg}</p>}
      </div>
    </div>
  )
}

export default Login