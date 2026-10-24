// Assemble la version navigateur en UN SEUL fichier HTML autonome (out/web/neo-housing-city.html).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(process.cwd(), 'out/web')
const assets = join(dir, 'assets')
const js = readdirSync(assets).find((f) => f.endsWith('.js'))
const css = readdirSync(assets).find((f) => f.endsWith('.css'))
const code = readFileSync(join(assets, js), 'utf8').replace(/<\/script/gi, '<\\/script')
const style = css ? readFileSync(join(assets, css), 'utf8') : ''

const html = `<title>NEO HOUSING CITY</title>
<style>
${style}
html, body { background: #070b18; }
</style>
<div id="root"></div>
<script>
${code}
</script>
`
writeFileSync(join(dir, 'neo-housing-city.html'), html)
console.log(`OK : out/web/neo-housing-city.html (${(html.length / 1048576).toFixed(2)} Mo)`)
