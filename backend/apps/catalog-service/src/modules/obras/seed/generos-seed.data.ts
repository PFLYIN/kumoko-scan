/**
 * Generos plausiveis das obras do seed (chave = nome da obra). Usado pelo seed em bancos vazios
 * e copiado (congelado) na migration AddGeneros para preencher bancos ja populados.
 */
export const GENEROS_SEED: Readonly<Record<string, readonly string[]>> = {
  'Blue Ursus': ['Ação', 'Fantasia', 'Aventura'],
  'Boukensha ni Naritai to Miyako ni': ['Fantasia', 'Aventura', 'Comédia'],
  Dandadan: ['Ação', 'Sobrenatural', 'Comédia'],
  'Haimiya-senpai wa Kowakute Kawaii': ['Romance', 'Comédia', 'Escolar'],
  'Isekai de Cheat Skill wo Te ni': ['Isekai', 'Fantasia', 'Ação'],
  'Isekai de Yakuza Hajimemashita Yume no Henkyou Slow Life wa Oazuke-chuu': [
    'Isekai',
    'Comédia',
    'Slice of life',
  ],
  'Kage no Jitsuryokusha ni Naritakute!': ['Isekai', 'Ação', 'Comédia'],
  'Kimi to Tsuzuru Utakata': ['Romance', 'Drama', 'Escolar'],
  'Make Heroine o Katasetai!!': ['Romance', 'Comédia', 'Escolar'],
  'Maria no Danzai': ['Suspense', 'Drama', 'Sobrenatural'],
  'Mato Seihei no Slave': ['Ação', 'Fantasia', 'Sobrenatural'],
  'Meiruko-chan': ['Comédia', 'Slice of life'],
  'Shio no Kikan-Moto Yuusha no Ore, Jibun': ['Fantasia', 'Aventura', 'Drama'],
  'Tensei Shitara Dragon no Tamago datta': ['Isekai', 'Fantasia', 'Aventura'],
  'Tsue to Tsurugi no Wistoria': ['Ação', 'Fantasia', 'Escolar'],
  'Watashi no Oshi wa Akuyaku Reijou': ['Isekai', 'Romance', 'Comédia'],
  'Yuusha-kei ni Shosu Choubatsu Yuusha': ['Ação', 'Fantasia', 'Drama'],
  'Yu☆Gi☆Oh': ['Ação', 'Jogos', 'Aventura'],
  'Zenmetsu End o Shinimono-gurui de Kaihi Shita Party ga Yanda': ['Fantasia', 'Suspense', 'Drama'],
  'kumo desuga, nani ka': ['Isekai', 'Fantasia', 'Ação'],
  'Dom Casmurro': ['Clássico', 'Romance', 'Drama'],
  'O Cortiço': ['Clássico', 'Drama'],
  'Mushoku Tensei': ['Isekai', 'Fantasia', 'Aventura'],
  'Re:Zero - Começando uma Vida em Outro Mundo': ['Isekai', 'Fantasia', 'Suspense'],
};

export function generosSeed(nome: string): string[] {
  return [...(GENEROS_SEED[nome] ?? [])];
}
