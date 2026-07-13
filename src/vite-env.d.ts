/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: {
    checkGlbCache: (filePath: string) => Promise<{ cached: boolean; filePath: string | null }>
    readGlbFile: (filePath: string) => Promise<ArrayBuffer>
    getFilePath: (file: File) => string
  }
}
