'use client'

import { useEffect, useRef, useState } from 'react'

const HYMN_SRC = '/hymn.wav'

export default function HymnPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Browsers block unmuted autoplay until the visitor interacts with the page,
  // so start muted and unmute automatically on the visitor's first interaction.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.play().then(() => {
      setIsPlaying(true)
    }).catch(() => {
      audio.muted = true
      setIsMuted(true)
      audio.play().then(() => setIsPlaying(true)).catch(() => {})
    })

    const unmute = () => {
      if (audio.muted) {
        audio.muted = false
        setIsMuted(false)
      }
      if (audio.paused) void audio.play().then(() => setIsPlaying(true)).catch(() => {})
      removeListeners()
    }

    const events = ['click', 'keydown', 'touchstart', 'scroll'] as const
    const removeListeners = () => {
      events.forEach((event) => window.removeEventListener(event, unmute))
    }
    events.forEach((event) => window.addEventListener(event, unmute, { once: true, passive: true }))

    return removeListeners
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.muted = false
      setIsMuted(false)
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
        aria-label={isPlaying ? (isMuted ? 'Unmute school hymn' : 'Pause school hymn') : 'Play school hymn'}
        aria-pressed={isPlaying}
        title={isPlaying ? (isMuted ? 'Playing muted — click to unmute' : 'Pause school hymn') : 'Play school hymn'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7B1C1C] text-amber-300 shadow-2xl border-2 border-amber-400 transition-transform hover:scale-105 active:scale-95"
      >
        {isPlaying && isMuted ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45c.03-.2.05-.42.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.9 8.9 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
          </svg>
        ) : isPlaying ? (
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
