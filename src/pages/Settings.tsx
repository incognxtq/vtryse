import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Settings() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [theme, setTheme] = useState('system')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      setErrorMsg(error.message)
    } else if (data) {
      setName(data.name || '')
      setUsername(data.username || '')
      setTheme(data.theme || 'system')
    }
    // If no data, that's fine — profile row will be created on first save
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const applyTheme = (selectedTheme: string) => {
    const isDark =
      selectedTheme === 'dark' ||
      (selectedTheme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, name, username, theme })

    if (error) {
      setErrorMsg(error.message)
      setSuccessMsg('')
    } else {
      setErrorMsg('')
      setSuccessMsg('Saved successfully!')
      applyTheme(theme)
    }
  }

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-semibold mb-8 text-text-primary">Settings</h1>

      <h2 className="text-lg font-semibold mb-2 text-text-primary">Account</h2>
      <div className="flex flex-col gap-2 mb-6">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-border-subtle bg-surface p-2 rounded text-text-primary"
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border border-border-subtle bg-surface p-2 rounded text-text-primary"
        />
      </div>

      <h2 className="text-lg font-semibold mb-2 text-text-primary">Dashboard Customization</h2>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTheme('light')}
          className={`px-4 py-2 rounded ${theme === 'light' ? 'bg-trace text-white' : 'bg-surface-hover text-text-muted'}`}
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-trace text-white' : 'bg-surface-hover text-text-muted'}`}
        >
          Dark
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`px-4 py-2 rounded ${theme === 'system' ? 'bg-trace text-white' : 'bg-surface-hover text-text-muted'}`}
        >
          System
        </button>
      </div>

      <button
        onClick={handleSave}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Changes
      </button>

      {errorMsg && <p className="mt-2 text-red-400">{errorMsg}</p>}
      {successMsg && <p className="mt-2 text-green-400">{successMsg}</p>}
    </div>
  )
}

export default Settings