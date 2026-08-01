import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Settings() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [theme, setThemeState] = useState('dark')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  const [shareCode, setShareCode] = useState('')
  const [showAcceptInput, setShowAcceptInput] = useState(false)
  const [redeemCode, setRedeemCode] = useState('')
  const [shareMsg, setShareMsg] = useState('')

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
      setThemeState(data.theme || 'dark')
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
    localStorage.setItem('vtryse-theme', selectedTheme)
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

  const handleShareWithOthers = async () => {
    const { data, error } = await supabase.rpc('create_share_code')
    if (error) {
      setShareMsg('Failed to generate code: ' + error.message)
    } else {
      setShareCode(data)
      setShareMsg('')
    }
  }

  const handleAcceptSharing = async () => {
    if (!redeemCode) {
      setShareMsg('Enter a code first')
      return
    }
    const { data, error } = await supabase.rpc('redeem_share_code', {
      input_code: redeemCode,
    })
    if (error || !data) {
      setShareMsg('Invalid or expired code')
    } else {
      setShareMsg('Successfully joined the shared dashboard! Refreshing...')
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This cannot be undone.'
    )
    if (!confirmed) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.functions.invoke('delete-account', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) {
      setErrorMsg('Failed to delete account: ' + error.message)
    } else {
      await supabase.auth.signOut()
      window.location.href = '/'
    }
  }

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-semibold mb-8 text-text-primary">Settings</h1>

      <h2 className="text-lg font-semibold mb-3 text-header">Account</h2>
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

      <h2 className="text-lg font-semibold mb-3 text-header">Privacy</h2>
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

      <h2 className="text-lg font-semibold mb-3 text-header">Theme</h2>
      <div className="flex gap-2 mb-8">
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

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-header">Sharing</h2>
        <div className="flex flex-col gap-3">
          <div>
            <button
              onClick={handleShareWithOthers}
              className="bg-trace text-white px-4 py-2 rounded text-sm hover:bg-trace-dim transition-colors"
            >
              Share with Others
            </button>
            {shareCode && (
              <div className="mt-2 bg-void border border-border-subtle rounded p-3">
                <p className="text-xs text-text-muted mb-1">Share this code:</p>
                <p className="text-lg font-mono font-bold text-trace tracking-widest">{shareCode}</p>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setShowAcceptInput(!showAcceptInput)}
              className="bg-surface-hover text-text-primary border border-border-subtle px-4 py-2 rounded text-sm hover:bg-border-subtle transition-colors"
            >
              Accept Sharing
            </button>
            {showAcceptInput && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="border border-border-subtle bg-surface p-2 rounded text-text-primary flex-1 font-mono tracking-widest"
                />
                <button
                  onClick={handleAcceptSharing}
                  className="bg-trace text-white px-4 py-2 rounded text-sm hover:bg-trace-dim transition-colors"
                >
                  Join
                </button>
              </div>
            )}
          </div>

          {shareMsg && (
            <p className={`text-sm ${shareMsg.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>
              {shareMsg}
            </p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-border-subtle">
        <h2 className="text-lg font-semibold mb-3 text-red-400">Danger Zone</h2>
        <p>Warning: No restoration once deleted.</p>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}

export default Settings