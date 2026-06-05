// Einmalig ausführen: npx tsx scripts/migrate-standorte.ts
import { STANDORTE } from '../app/(lernende)/brief/KapselStandort'
// Nur für Server-seitige Migration, nie im Browser verwendet
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://zeitkapsel:zeitkapsel@localhost:5432/zeitkapsel',
})

function kontinent(lat: number, lng: number, land: string): string {
  if (land.includes('Weltraum') || land.includes('Orbit') || land.toLowerCase().includes('space')) return 'Weltraum'
  if (lat < -55) return 'Antarktis'
  // Europa: grob lat 36-72, lng -25 bis 45
  if (lat >= 36 && lat <= 72 && lng >= -25 && lng <= 45) return 'Europa'
  // Nordamerika: lat 15-85, lng -170 bis -50
  if (lat >= 15 && lat <= 85 && lng >= -170 && lng <= -50) return 'Nordamerika'
  // Südamerika: lat -55 bis 15, lng -82 bis -30
  if (lat >= -55 && lat <= 15 && lng >= -82 && lng <= -30) return 'Südamerika'
  // Afrika: lat -35 bis 38, lng -18 bis 52
  if (lat >= -35 && lat <= 38 && lng >= -18 && lng <= 52) return 'Afrika'
  // Ozeanien: lat -50 bis 10, lng 110 bis 180
  if (lat >= -50 && lat <= 10 && lng >= 110 && lng <= 180) return 'Ozeanien'
  // Asien: alles andere
  return 'Asien'
}

function kategorie(ort: string, info: string, emoji: string): string {
  const text = (ort + ' ' + info).toLowerCase()
  if (/museum|galerie|theater|oper|schloss|palast|kathedrale|pyramide|tempel|bibliothek|denkmal|ruine|höhle|mauer|turm.*paris|eiffel|kolosseum|abbey|graceland|walk.*fame|stonehenge|angkor|petra|machu|tikal|alhambra|terrakotta|verbotene|versailles|schönbrunn|neuschwanstein|potala|bolschoi|scala|carnegie|globe|nationaltheater|gutenberg/.test(text)) return 'Kultur'
  if (/universität|university|mit |harvard|oxford|cambridge|eth |epfl|caltech|forschung|laborator|teleskop|eso |cern|iter|fermilab|iss |hubble|raumstation|weltraum|nasa|scherrer|weizmann|salk|deep space|brookhaven|desy |antikythera/.test(text)) return 'Wissenschaft'
  if (/stadion|arena|camp nou|wembley|madison square|wimbledon|roland garros|augusta|olympia|maracanã|allianz arena|old trafford|anfield|bernabéu|fenway|silverstone|tourmalet|sumo|kokugikan|mcg|stade de france|circuit/.test(text)) return 'Sport'
  if (/parlament|regierung|gericht|weißes haus|kremlin|kreml|élysée|reichstag|robben|palace of nations|westminster|uno|uno-|europäisches parlament|waterloo|auschwitz|hiroshima|berliner mauer|schindler|palais wilson|internationaler gerichtshof|europäischer menschenrecht|unhcr|wto|uno-hauptquartier/.test(text)) return 'Politik & Geschichte'
  if (/börse|stock exchange|wall street|hafen.*rotterdam|suezkanal|panamakanal|apple park|googleplex|burj khalifa|petronas|petronas|bank.*international|bis.*basel|davos.*wef|weltwirtschaftsforum|dharavi|nairobi.*silicon|silicon valley|cerro rico/.test(text)) return 'Wirtschaft'
  if (/grand canyon|victoria.*falls|victoriafälle|everest|niagara|yellowstone|galápagos|amazonas|totes meer|baikalsee|serengeti|torres del paine|sahara|atacama|komodo|nordkap|zhangjiajie|okavango|fiordland|iguazú|aral|matterhorn|nationalpark|nordlichter|polarlicht|gletscher|vulkan/.test(text)) return 'Natur'
  if (/eiffelturm|eiffel tower|golden gate|empire state|sydney harbour bridge|cn tower|atomium|eurotunnel|drei-schluchten|millau|oresund|gotthard|space needle|chinesische mauer|great wall|vogelnest|oresundbrücke|crystal palace/.test(text)) return 'Architektur'
  return 'Sonstiges'
}

async function main() {
  console.log(`Migriere ${STANDORTE.length} Standorte...`)

  // Bestehende löschen (sauberer Neustart)
  await pool.query('DELETE FROM kapsel_standorte')

  let count = 0
  for (const s of STANDORTE) {
    const k = kontinent(s.lat, s.lng, s.land)
    const kat = kategorie(s.ort, s.info, s.emoji)
    await pool.query(
      `INSERT INTO kapsel_standorte
        (ort, land, kontinent, kategorie, emoji, info, temp, lat, lng, foto, foto_alt, wiki_titel, link, link_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [s.ort, s.land, k, kat, s.emoji, s.info, s.temp, s.lat, s.lng, s.foto, s.fotoAlt, s.wikiTitel, s.link, s.linkText]
    )
    count++
    if (count % 20 === 0) console.log(`  ${count}/${STANDORTE.length}...`)
  }

  console.log(`✓ ${count} Standorte migriert.`)
  const { rows } = await pool.query('SELECT kategorie, COUNT(*) FROM kapsel_standorte GROUP BY kategorie ORDER BY COUNT(*) DESC')
  console.log('\nKategorien:')
  rows.forEach((r) => console.log(`  ${r.kategorie}: ${r.count}`))

  await pool.end()
}

main().catch(console.error)
