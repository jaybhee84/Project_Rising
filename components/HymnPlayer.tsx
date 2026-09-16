'use client'

import { useEffect, useRef, useState } from 'react'

const HYMN_SRC = '/hymn.wav'

export default function HymnPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Browsers block unmuted autoplay until the visitor interacts with the page,
  // so try immediately and fall back to starting on the visitor's first interaction.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.play().then(() => setIsPlaying(true)).catch(() => {})

    const start = () => {
      if (audio.paused) void audio.play().then(() => setIsPlaying(true)).catch(() => {})
      removeListeners()
    }

    const events = ['click', 'keydown', 'touchstart', 'scroll'] as const
    const removeListeners = () => {
      events.forEach((event) => window.removeEventListener(event, start))
    }
    events.forEach((event) => window.addEventListener(event, start, { once: true, passive: true }))

    return removeListeners
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      void audio.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <audio ref={audioRef} src={HYMN_SRC} loop onEnded={() => setIsPlaying(false)} />
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? 'Pause school hymn' : 'Play school hymn'}
        aria-pressed={isPlaying}
        title={isPlaying ? 'Pause school hymn' : 'Play school hymn'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7B1C1C] text-amber-300 shadow-2xl border-2 border-amber-400 transition-transform hover:scale-105 active:scale-95"
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 animate-pulse">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}
