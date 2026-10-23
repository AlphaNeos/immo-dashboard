import { contextBridge } from 'electron'

// Pont sécurisé entre l'interface et le système. Les futures fonctions
// (lecture de fichiers locaux, sauvegarde...) seront exposées ici.
contextBridge.exposeInMainWorld('neo', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
})
