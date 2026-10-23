export interface NeoApi {
  platform: string
  versions: { electron: string; chrome: string; node: string }
}

declare global {
  interface Window {
    neo: NeoApi
  }
}
