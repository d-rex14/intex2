import React, { useEffect } from 'react'

const GIVEBUTTER_SCRIPT =
  'https://widgets.givebutter.com/latest.umd.cjs?acct=H3ZlC3ej7NAOGUsE&p=wordpress'

export function GiveButterWidget({ id = 'jN24wj' }: { id?: string }) {
  useEffect(() => {
    const prefix = GIVEBUTTER_SCRIPT.split('&')[0]
    let script = document.querySelector<HTMLScriptElement>(`script[src^="${prefix}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = GIVEBUTTER_SCRIPT
      script.async = true
      document.body.appendChild(script)
    }
    // Remove script when the Donations page unmounts so iFrameResizer does not
    // keep polling and triggering history events on other pages (which Chrome throttles).
    return () => {
      const el = document.querySelector<HTMLScriptElement>(`script[src^="${prefix}"]`)
      el?.parentNode?.removeChild(el)
    }
  }, [])

  return React.createElement('givebutter-widget', {
    id,
    className: 'block min-h-[120px] w-full',
  })
}
