import React, { useEffect } from 'react'

const GIVEBUTTER_SCRIPT =
  'https://widgets.givebutter.com/latest.umd.cjs?acct=H3ZlC3ej7NAOGUsE&p=wordpress'

export function GiveButterWidget({ id = 'jN24wj' }: { id?: string }) {
  useEffect(() => {
    const prefix = GIVEBUTTER_SCRIPT.split('&')[0]
    const existing = document.querySelector(`script[src^="${prefix}"]`)
    if (existing) return
    const s = document.createElement('script')
    s.src = GIVEBUTTER_SCRIPT
    s.async = true
    document.body.appendChild(s)
  }, [])

  return React.createElement('givebutter-widget', {
    id,
    className: 'block min-h-[120px] w-full',
  })
}
