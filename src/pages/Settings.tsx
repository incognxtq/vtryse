import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Settings() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [theme, setThemeState] = useState('system')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

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
      setAvatarUrl(data.avatar_url || '')
      setThemeState(data.theme || 'system')
    }
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

  const handleThemeChange = async (newTheme: string) => {
    setThemeState(newTheme)
    applyTheme(newTheme)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, name, username, avatar_url: avatarUrl, theme: newTheme })

    if (error) setErrorMsg(error.message)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setErrorMsg(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`
    setAvatarUrl(newAvatarUrl)

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, name, username, avatar_url: newAvatarUrl, theme })

    if (error) setErrorMsg(error.message)
    else setSuccessMsg('Profile picture updated!')

    setUploading(false)
  }

  const handleSaveAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, name, username, avatar_url: avatarUrl, theme })

    if (error) {
      setErrorMsg(error.message)
      setSuccessMsg('')
    } else {
      setErrorMsg('')
      setSuccessMsg('Saved successfully!')
    }
  }

  const handleChangePassword = async () => {
    setPasswordMsg('')

    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordMsg(error.message)
    } else {
      setPasswordMsg('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-semibold mb-8 text-text-primary">Settings</h1>

      {/* Account */}
      <h2 className="text-lg font-semibold mb-3 text-text-primary">Account</h2>
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border border-border-subtle"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-surface-hover border border-border-subtle flex items-center justify-center text-text-muted text-xs">
              No photo
            </div>
          )}
          <label className="text-sm text-trace cursor-pointer hover:underline">
            {uploading ? 'Uploading...' : 'Change photo'}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

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
        <button
          onClick={handleSaveAccount}
          className="bg-green-600 text-white px-4 py-2 rounded self-start text-sm"
        >
          Save Changes
        </button>
        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
        {successMsg && <p className="text-green-400 text-sm">{successMsg}</p>}
      </div>

      {/* Privacy */}
      <h2 className="text-lg font-semibold mb-3 text-text-primary">Privacy</h2>
      <div className="flex flex-col gap-3 mb-8">
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border border-border-subtle bg-surface p-2 rounded text-text-primary"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border border-border-subtle bg-surface p-2 rounded text-text-primary"
        />
        <button
          onClick={handleChangePassword}
          className="bg-trace text-white px-4 py-2 rounded self-start text-sm hover:bg-trace-dim transition-colors"
        >
          Update Password
        </button>
        {passwordMsg && (
          <p className={`text-sm ${passwordMsg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
            {passwordMsg}
          </p>
        )}
      </div>

      {/* Theme */}
      <h2 className="text-lg font-semibold mb-3 text-text-primary">Theme</h2>
      <div className="flex gap-2">
        <button
          onClick={() => handleThemeChange('light')}
          className={`px-4 py-2 rounded text-sm ${theme === 'light' ? 'bg-trace text-white' : 'bg-surface-hover text-text-muted'}`}
        >
          Light
        </button>
        <button
          onClick={() => handleThemeChange('dark')}
          className={`px-4 py-2 rounded text-sm ${theme === 'dark' ? 'bg-trace text-white' : 'bg-surface-hover text-text-muted'}`}
        >
          Dark
        </button>
        <button
          onClick={() => handleThemeChange('system')}
          className={`px-4 py-2 rounded text-sm ${theme === 'system' ? 'bg-trace text-white' : 'bg-surface-hover text-text-muted'}`}
        >
          System
        </button>
      </div>
    </div>
  )
}

export default Settings