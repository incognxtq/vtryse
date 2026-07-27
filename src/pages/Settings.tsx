import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Settings() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [theme, setTheme] = useState('light')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      setErrorMsg(error.message)
    } else if (data) {
      setName(data.name || '')
      setUsername(data.username || '')
      setTheme(data.theme || 'light')
      applyTheme(data.theme || 'light')
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const applyTheme = (selectedTheme: string) => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ name, username, theme })
      .eq('id', user.id)

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
    <div className="p-6 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <h2 className="text-xl font-semibold mb-2">Account</h2>
      <div className="flex flex-col gap-2 mb-6">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <h2 className="text-xl font-semibold mb-2">Dashboard Customization</h2>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTheme('light')}
          className={`px-4 py-2 rounded ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Dark
        </button>
      </div>

      <button
        onClick={handleSave}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Changes
      </button>

      {errorMsg && <p className="mt-2 text-red-600">{errorMsg}</p>}
      {successMsg && <p className="mt-2 text-green-600">{successMsg}</p>}
    </div>
  )
}

export default Settings