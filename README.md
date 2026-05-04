# TimerWod

App de timer para CrossFit. Soporta AMRAP, EMOM, For Time, Tabata y bloques Mix. Diseñada para usarse en móvil como PWA o APK Android. Sin auth, sin backend, sin dependencias externas.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS v4**
- **Capacitor 8** (build Android)

## Requisitos

- Node.js 20+
- npm 10+
- Para Android: Android Studio + Java 17+

## Instalación

```bash
git clone https://github.com/pabloJesus27/timerwod.git
cd timerwod
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Home: lista de timers
│   ├── layout.tsx            # Layout global (viewport, fuente, wake lock)
│   ├── globals.css           # Estilos base Tailwind
│   └── timer/
│       └── page.tsx          # Página timer: setup + ejecución
├── components/
│   └── timer/
│       ├── timer-utils.ts    # fmt(), beep(), speak(), scheduleBlockBeeps()
│       ├── AMRAPSetup.tsx    # Formulario configuración AMRAP
│       ├── EMOMSetup.tsx     # Formulario configuración EMOM
│       ├── ForTimeSetup.tsx  # Formulario configuración For Time
│       ├── TabataSetup.tsx   # Formulario configuración Tabata
│       ├── MixSetup.tsx      # Formulario configuración Mix
│       ├── SimpleTimer.tsx   # Timer AMRAP / countdown
│       ├── EMOMTimer.tsx     # Timer EMOM con intervalos
│       ├── ForTimeTimer.tsx  # Timer For Time (cuenta arriba)
│       ├── TabataTimer.tsx   # Timer Tabata (trabajo/descanso)
│       ├── MixTimer.tsx      # Timer Mix (bloques secuenciales)
│       ├── IntervalTimer.tsx # Timer de intervalos genérico
│       ├── ClockFace.tsx     # Display del reloj
│       ├── PreStartCountdown.tsx  # Cuenta atrás 3-2-1 pre-inicio
│       └── LandscapeDisplay.tsx   # Vista apaisada
└── lib/
    └── types.ts              # TimerConfig, MixBlock
```

## Variables de entorno

Ninguna. La app es completamente frontend sin servicios externos.

## Tipos principales

```ts
// src/lib/types.ts
type TimerConfig =
  | { type: 'amrap';    totalSeconds: number }
  | { type: 'emom';     totalSeconds: number; intervalSeconds: number }
  | { type: 'fortime';  capSeconds: number }
  | { type: 'tabata';   workSeconds: number; restSeconds: number; rounds: number }
  | { type: 'mix';      blocks: MixBlock[] }

type MixBlock = {
  label: string
  seconds: number
  intervalSeconds?: number
  tabataWork?: number
  tabataRest?: number
  countUp?: boolean
}
```

## Funciones utilitarias (`timer-utils.ts`)

| Función | Descripción |
|---|---|
| `fmt(s)` | Convierte segundos a `MM:SS` |
| `beep(ctx, freq?, dur?, vol?)` | Reproduce un beep con Web Audio API |
| `beepGo(ctx)` | Beep de inicio (doble tono ascendente) |
| `beepWarning(ctx)` | Beep de aviso 10 segundos (triple) |
| `speak(text)` | Síntesis de voz en español (desactivada en iOS) |
| `scheduleBlockBeeps(ctx, duration, offset)` | Pre-programa beeps para un bloque completo |
| `cancelScheduledBeeps(nodes, ctx?)` | Cancela beeps programados |
| `keepAudioContextAlive(ctx)` | Evita que Android duerma el AudioContext |

## Build Android

```bash
npm run build
npx cap sync android
npx cap open android
```

Desde Android Studio: Build → Generate Signed APK.

## Flujo de navegación

```
/ (Home)
  └── /timer?type=amrap   → AMRAPSetup   → SimpleTimer
  └── /timer?type=emom    → EMOMSetup    → EMOMTimer
  └── /timer?type=fortime → ForTimeSetup → ForTimeTimer
  └── /timer?type=tabata  → TabataSetup  → TabataTimer
  └── /timer?type=mix     → MixSetup     → MixTimer
```

## Notas técnicas

- **Wake Lock**: usa la API `navigator.wakeLock` en Android/Chrome. En iOS Safari usa un vídeo silencioso en bucle como workaround.
- **Audio**: Web Audio API con osciladores. Un oscilador infrasónico (1Hz, 0dB) mantiene el AudioContext vivo en Android entre bloques largos.
- **Orientación**: detecta landscape via `window.innerWidth > window.innerHeight` y ajusta el layout.
- **Scroll**: `scrollRestoration = 'manual'` en el layout para evitar saltos al volver a la home.
