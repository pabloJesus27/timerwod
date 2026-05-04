'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TimerConfig } from '@/lib/types'
import SimpleTimer from '@/components/timer/SimpleTimer'
import ForTimeTimer from '@/components/timer/ForTimeTimer'
import TabataTimer from '@/components/timer/TabataTimer'
import MixTimer from '@/components/timer/MixTimer'
import IntervalTimer from '@/components/timer/IntervalTimer'
import EMOMTimer from '@/components/timer/EMOMTimer'
import AMRAPSetup from '@/components/timer/AMRAPSetup'
import EMOMSetup from '@/components/timer/EMOMSetup'
import ForTimeSetup from '@/components/timer/ForTimeSetup'
import TabataSetup from '@/components/timer/TabataSetup'
import MixSetup from '@/components/timer/MixSetup'

function renderTimer(cfg: TimerConfig, onFinish: () => void) {
  if (cfg.type === 'interval')  return <IntervalTimer config={cfg} onFinish={onFinish} />
  if (cfg.type === 'amrap')     return <SimpleTimer label="AMRAP" totalSeconds={cfg.totalSeconds} onFinish={onFinish} />
  if (cfg.type === 'emom')      return <EMOMTimer totalSeconds={cfg.totalSeconds} intervalSeconds={cfg.intervalSeconds} onFinish={onFinish} />
  if (cfg.type === 'fortime')   return <ForTimeTimer capSeconds={cfg.capSeconds} onFinish={onFinish} />
  if (cfg.type === 'countdown') return <SimpleTimer label="COUNTDOWN" totalSeconds={cfg.totalSeconds} onFinish={onFinish} />
  if (cfg.type === 'tabata')    return <TabataTimer workSeconds={cfg.workSeconds} restSeconds={cfg.restSeconds} rounds={cfg.rounds} onFinish={onFinish} />
  if (cfg.type === 'mix')       return <MixTimer blocks={cfg.blocks} onFinish={onFinish} />
  return null
}

function TimerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const manualType = searchParams.get('type')

  const [config, setConfig] = useState<TimerConfig | null>(null)
  const [isLandscape, setIsLandscape] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const timerActive = !!(config || manualType)

  useEffect(() => {
    function check() {
      setIsLandscape(window.innerWidth > window.innerHeight)
      if (scrollRef.current) scrollRef.current.scrollTop = 0
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function handleStart(cfg: TimerConfig) {
    setConfig(cfg)
  }

  function handleFinish() {
    setConfig(null)
    router.push('/')
  }

  // iOS WakeLock alternative — silent looping video prevents screen sleep on Safari
  useEffect(() => {
    if (!timerActive) return
    if ('wakeLock' in navigator) return
    const video = document.createElement('video')
    video.setAttribute('loop', '')
    video.setAttribute('muted', '')
    video.setAttribute('autoplay', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.style.cssText = 'position:fixed;top:-100px;left:-100px;width:1px;height:1px;opacity:0;pointer-events:none'
    video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthADAowdbb9/AAAC6W1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAPoAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIVdHJhawAAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAQAAAAAAAAPoAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAABsW1kaWEAAAAcbWRoZAAAAAAAAAAAAAAAAAAAKAAAACgAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVhtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEYc3RibAAAALhzdHNkAAAAAAAAAAEAAACMYXZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAIAAgASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAFJhdmNDAQ0ACf/hABlZAA2s2UBUFehAAAADApAAAAMAi8YB4gAAAbNj6+PlAAAABGNvbHIBAAAABA8PD6AAAAASYXV0aAAAAAAAAAAAAAgAAAAAAAAAGHN0dHMAAAAAAAAAAQAAAAoAAAQAAAAAFHN0c3MAAAAAAAAAAQAAAAEAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAoAAAABAAAANHN0c3oAAAAAAAAAAAAAAAAAACsAAAAhAAAAIQAAACEAAAAhAAAAIQAAACEAAAAhAAAAIQAAACEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTguNDUuMTAw'
    document.body.appendChild(video)
    video.play().catch(() => {})
    function onVisible() {
      if (document.visibilityState === 'visible') video.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      video.pause()
      document.body.removeChild(video)
    }
  }, [timerActive])

  useEffect(() => {
    if (!timerActive) return
    if (!('wakeLock' in navigator)) return
    async function acquireWakeLock() {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {}
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') acquireWakeLock()
    }
    acquireWakeLock()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [timerActive])

  if (!manualType) return (
    <main className="min-h-dvh bg-black flex items-center justify-center">
      <div className="flex gap-1.5">
        <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-pulse" />
        <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-pulse [animation-delay:150ms]" />
        <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-pulse [animation-delay:300ms]" />
      </div>
    </main>
  )

  return (
    <main className="bg-black fixed inset-0 flex flex-col overflow-hidden p-8 sm:p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { if (config) { setConfig(null) } else { router.push('/') } }}
          className="text-neutral-600 hover:text-white text-sm font-mono transition"
        >
          ← Volver
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className={`min-h-full flex flex-col items-center ${isLandscape ? 'justify-center py-4' : 'pt-4 pb-8'}`}>
          {config ? (
            <div className="w-full">
              {renderTimer(config, handleFinish)}
            </div>
          ) : (
            <div className="w-full max-w-md sm:max-w-none">
              {manualType === 'amrap'   && <AMRAPSetup   onStart={handleStart} />}
              {manualType === 'emom'    && <EMOMSetup    onStart={handleStart} />}
              {manualType === 'fortime' && <ForTimeSetup onStart={handleStart} />}
              {manualType === 'tabata'  && <TabataSetup  onStart={handleStart} />}
              {manualType === 'mix'     && <MixSetup     onStart={handleStart} />}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function TimerPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh bg-black flex items-center justify-center">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-pulse [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
      </main>
    }>
      <TimerContent />
    </Suspense>
  )
}
