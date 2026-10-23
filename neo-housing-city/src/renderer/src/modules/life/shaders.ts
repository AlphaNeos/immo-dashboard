import type { WebGLProgramParametersWithUniforms } from 'three'

// Uniformes partagés par tous les matériaux animés (mis à jour une fois par image, coût quasi nul).
export const nightUniform = { value: 0 } // 0 = jour, 1 = nuit
export const windUniform = { value: 0 } // temps du vent (secondes)

type Shader = WebGLProgramParametersWithUniforms

// Fenêtres : sombres la nuit, sauf celles marquées « allumées » (attribut aLit) qui rayonnent en jaune chaud.
export function patchGlass(shader: Shader) {
  shader.uniforms.uNight = nightUniform
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float aLit;\nvarying float vLit;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLit = aLit;')
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform float uNight;\nvarying float vLit;')
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      totalEmissiveRadiance *= (1.0 - uNight);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.3 + vec3(0.01, 0.02, 0.05), uNight * (1.0 - vLit));
      totalEmissiveRadiance += vec3(1.0, 0.74, 0.36) * 1.9 * vLit * uNight;`
    )
}
export const glassKey = () => 'neo-glass'

// Têtes de lampadaires : brillent plus fort la nuit.
export function patchLamp(shader: Shader) {
  shader.uniforms.uNight = nightUniform
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform float uNight;')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= (0.6 + 2.6 * uNight);')
}
export const lampKey = () => 'neo-lamp'

// Feuillage : léger balancement dans le vent, calculé sur la carte graphique (aucun coût processeur).
function windPatch(amp: number, base: number) {
  return (shader: Shader) => {
    shader.uniforms.uTime = windUniform
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9;
        #else
          float ph = 0.0;
        #endif
        float sway = (position.y + ${base.toFixed(2)}) * ${amp.toFixed(3)};
        transformed.x += sin(uTime * 1.6 + ph) * sway;
        transformed.z += cos(uTime * 1.3 + ph * 1.3) * sway * 0.7;`
      )
  }
}
export const windRound = windPatch(0.045, 0.55)
export const windPine = windPatch(0.055, 0.45)
export const windRoundKey = () => 'neo-wind-round'
export const windPineKey = () => 'neo-wind-pine'
