/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode is disabled because it causes double-mounting in development,
// which conflicts with js-dos initialization (WASM modules can't be initialized twice)
createRoot(document.getElementById('root')!).render(
  <App />
)
