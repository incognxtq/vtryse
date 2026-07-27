import { useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useTheme() {
  useEffect(() => {
    const applyTheme = (theme: string) => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)

      document.documentElement.classList.toggle('dark', isDark)
    }

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        applyTheme('system')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('theme')
        .eq('id', user.id)
        .single()

      applyTheme(data?.theme || 'system')
    }

    init()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => init()
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])
}