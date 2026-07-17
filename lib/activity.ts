'use client'

import { createClient } from '@/lib/supabase/client'

// Records a radio listen or TV watch for the current user.
// Deduplicates within a session using an in-memory Set keyed by station id,
// so re-playing the same station in one session inserts only one row.

const seen = new Set<string>()

export function recordRadioListen(stationId: string, stationName: string) {
  recordActivity('listen_history', stationId, stationName)
}

export function recordTVWatch(channelId: string, channelName: string) {
  recordActivity('watch_history', channelId, channelName)
}

function recordActivity(table: 'listen_history' | 'watch_history', id: string, name: string) {
  const key = `${table}:${id}`
  if (seen.has(key)) return
  seen.add(key)

  const supabase = createClient()
  supabase.auth.getUser().then(async ({ data: { user } }) => {
    if (!user) return
    const { data: profile } = await (supabase.from('users') as any)
      .select('user_id').eq('auth_id', user.id).maybeSingle()
    if (!profile?.user_id) return
    try {
      await supabase
        .from(table)
        .insert({ user_id: profile.user_id as number, station_id: id, station_name: name } as never)
    } catch {
      seen.delete(key) // allow retry on failure
    }
  })
}
