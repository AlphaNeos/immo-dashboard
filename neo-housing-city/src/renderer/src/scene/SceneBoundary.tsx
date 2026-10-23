import { Component, type ReactNode } from 'react'

// Si la 3D plante (ex. WebGL indisponible), le reste de l'interface reste affiché.
export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
