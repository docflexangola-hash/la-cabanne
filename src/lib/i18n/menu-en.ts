import type { Locale } from '@/lib/i18n/dictionaries';
import type { MenuGroup, MenuProduct } from '@/types/menu';

type ProductTranslation = {
  name: string;
  description?: string;
};

/** Menu groups, keyed by slug. */
export const groupEn: Record<string, string> = {
  refeicoes: 'Meals',
  sushi: 'Sushi',
  bebidas: 'Drinks',
};

/** Menu categories, keyed by slug. */
export const categoryEn: Record<string, string> = {
  'cafes-e-chas': 'Coffees & Teas',
  entradas: 'Starters',
  'entradas-e-aperitivos': 'Starters & Appetisers',
  aguas: 'Water',
  snacks: 'Snacks',
  gunkans: 'Gunkan',
  'refrigerantes-e-energeticas': 'Soft Drinks & Energy Drinks',
  sashimi: 'Sashimi',
  pastas: 'Pasta',
  sumos: 'Juices',
  temakis: 'Temaki',
  peixes: 'Fish',
  cervejas: 'Beers',
  'quentes-hot-roll': 'Hot / Hot Roll',
  carnes: 'Meat',
  'mariscos-e-frutos-do-mar': 'Seafood',
  uramaki: 'Uramaki',
  'cocktails-e-bebidas-mistas': 'Cocktails & Mixed Drinks',
  guarnicoes: 'Sides',
  'whisky-e-brandy': 'Whisky & Brandy',
  combinados: 'Combos',
  'massas-yakissoba': 'Noodles & Yakisoba',
  sobremesas: 'Desserts',
  'gin-e-vodka': 'Gin & Vodka',
  'licores-e-vermutes': 'Liqueurs & Vermouth',
  aguardentes: 'Aguardente',
  brandes: 'Brandy',
  runs: 'Rum',
  tequilas: 'Tequila',
  conhaques: 'Cognac',
  sangrias: 'Sangria',
  'vinhos-tintos': 'Red Wines',
  'vinhos-brancos-e-verdes': 'White & Green Wines',
  'vinhos-rose': 'Rosé Wines',
  'champanhes-e-espumantes': 'Champagne & Sparkling Wine',
};

const variantEn: Record<string, string> = {
  Dose: 'Shot',
  Garrafa: 'Bottle',
};

const variantGroupEn: Record<string, string> = {
  Opções: 'Options',
};

/** Product names and descriptions, keyed by slug. */
export const productEn: Record<string, ProductTranslation> = {
  // Cafés e Chás
  'cafe-expresso': { name: 'Espresso' },
  'cafe-com-cheirinho': { name: 'Coffee with a Dash of Brandy' },
  galao: { name: 'Galão (Milky Coffee)' },
  cha: { name: 'Tea' },

  // Entradas
  shiitake: { name: 'Shiitake' },
  'tempura-de-camarao-6-und': { name: 'Prawn Tempura (6 pcs)' },
  'tempura-especial-6-und': { name: 'Special Tempura (6 pcs)' },
  kimuchi: { name: 'Kimchi' },
  'ceviche-de-salmao': { name: 'Salmon Ceviche' },
  'carpaccio-mix-de-peixe': { name: 'Mixed Fish Carpaccio' },

  // Entradas e Aperitivos
  tremocos: { name: 'Lupin Beans' },
  'tempura-de-choco': { name: 'Cuttlefish Tempura' },
  'chourico-na-brasa': { name: 'Charcoal-Grilled Chouriço' },
  'camarao-al-pil-pil': { name: 'Prawns Pil Pil' },
  'buffalo-wings': { name: 'Buffalo Wings' },
  'ostras-frescas': { name: 'Fresh Oysters' },
  'pica-pau-de-novilho': { name: 'Beef Pica-Pau' },
  couvert: { name: 'Bread & Olives' },
  'sanduiche-mista': {
    name: 'Ham & Cheese Sandwich',
    description: 'Ham, cheese, lettuce and tomato.',
  },
  'tosta-mista': { name: 'Toasted Ham & Cheese', description: 'Ham and cheese.' },
  'azeitonas-ao-alho': { name: 'Garlic Olives' },
  'pao-ao-alho': { name: 'Garlic Bread' },
  'tabua-de-queijos': { name: 'Cheese Board' },
  'tabua-de-enchidos': { name: 'Charcuterie Board' },

  // Águas
  'agua-chela-500ml': { name: 'Chela Water 500 ml' },
  'agua-chela-1-5-l': { name: 'Chela Water 1.5 L' },
  'agua-com-gas-castelo': { name: 'Castelo Sparkling Water' },
  'agua-com-gas-das-pedras': { name: 'Pedras Sparkling Water' },
  'agua-tonica-top': { name: 'Top Tonic Water' },

  // Snacks
  'prego-no-prato': { name: 'Prego Steak Plate' },
  'omelete-de-camarao': { name: 'Prawn Omelette' },
  'omelete-especial': {
    name: 'Special Omelette',
    description: 'Chouriço, cheese, ham and fries.',
  },
  'sanduiche-de-atum': {
    name: 'Tuna Sandwich',
    description: 'Tuna paste, lettuce and tomato.',
  },
  'prego-no-pao-composto': { name: 'Loaded Prego Roll' },
  'sanduiche-a-la-cabane': {
    name: 'La Cabane Sandwich',
    description: 'Bacon, egg, chicken breast, lettuce, tomato, cheese and fries.',
  },

  // Gunkans / Sashimi
  '5-pecas-salmao': { name: '5 Pieces Salmon' },
  '5-pecas-atum': { name: '5 Pieces Tuna' },
  '5-pecas-atum-braseado': { name: '5 Pieces Seared Tuna' },
  '5-pecas-salmao-braseado': { name: '5 Pieces Seared Salmon' },

  // Refrigerantes e Energéticas
  pepsi: { name: 'Pepsi' },
  '7up': { name: '7Up' },
  mirinda: { name: 'Mirinda' },
  'bebida-energetica-red-bull': { name: 'Red Bull Energy Drink' },
  'bebida-energetica-xxl': { name: 'XXL Energy Drink' },

  // Pastas
  'esparguete-a-bolonhesa': {
    name: 'Spaghetti Bolognese',
    description: 'Minced beef, cheese and tomato sauce.',
  },
  'esparguete-a-carbonara': {
    name: 'Spaghetti Carbonara',
    description: 'Bacon, ham, cheese and cream.',
  },
  'tagliatelle-frutos-do-mar': {
    name: 'Seafood Tagliatelle',
    description: 'Tagliatelle with cuttlefish, prawns, mussels, clams and tomato sauce.',
  },
  'tagliatelle-de-garoupa-a-la-cabane': {
    name: 'La Cabane Grouper Tagliatelle',
    description: 'Grouper loin with tagliatelle, coriander, chilli and cream.',
  },

  // Sumos
  'compal-manga-ita': { name: 'Compal Mango (Ita)' },
  'sumol-ita': { name: 'Sumol (Ita)' },
  'sumo-natural-de-melancia': { name: 'Fresh Watermelon Juice' },
  'sumo-natural-de-limao': { name: 'Fresh Lemon Juice' },
  'sumo-natural-de-ananas': { name: 'Fresh Pineapple Juice' },
  'sumo-natural-de-maracuja': { name: 'Fresh Passion Fruit Juice' },
  'sumo-natural-de-laranja': { name: 'Fresh Orange Juice' },
  'sumo-natural-tropical': { name: 'Fresh Tropical Juice' },
  'sumo-natural-de-frutos-vermelhos': { name: 'Fresh Red Berry Juice' },
  'sumol-garrafa': { name: 'Sumol Bottle' },

  // Temakis
  'temaki-salmao': { name: 'Salmon Temaki' },
  'temaki-atum-tuna': { name: 'Tuna Temaki' },
  'temaki-philadelphia': { name: 'Philadelphia Temaki' },
  'temaki-camarao': { name: 'Prawn Temaki' },
  'temaki-hot': { name: 'Hot Temaki' },

  // Peixes
  'bacalhau-a-lagareiro': {
    name: 'Cod Lagareiro',
    description: 'With smashed potatoes and garlic sauce.',
  },
  'bacalhau-cozido': {
    name: 'Boiled Cod',
    description: 'Cod with boiled potatoes, chickpeas, eggs and vegetables.',
  },
  'garoupa-na-brasa': {
    name: 'Grilled Grouper',
    description: 'Served with roasted sweet potato and sautéed vegetables.',
  },
  'lombo-de-garoupa-a-la-cabane': {
    name: 'La Cabane Grouper Loin',
    description: 'Grouper loin with mashed potato and sautéed broccoli.',
  },
  'curvina-na-brasa': {
    name: 'Grilled Croaker',
    description:
      'Grilled croaker with sweet potato, cucumber, carrot, onion and aubergine, all chargrilled.',
  },

  // Cervejas
  'cuca-garrafa': { name: 'Cuca Bottle' },
  'cuca-lata': { name: 'Cuca Can' },
  'booster-garrafa': { name: 'Booster Bottle' },
  'booster-lata': { name: 'Booster Can' },
  heineken: { name: 'Heineken' },
  'eka-lata': { name: 'Eka Can' },
  'n-gola-garrafa': { name: "N'Gola Bottle" },
  'eka-garrafa': { name: 'Eka Bottle' },
  'nocal-garrafa': { name: 'Nocal Bottle' },

  // Quentes / Hot Roll
  'hot-philadelphia-5-pecas': { name: 'Hot Philadelphia (5 pieces)' },
  'hot-vegetariano-10-pecas': { name: 'Vegetarian Hot Roll (10 pieces)' },
  'hot-fry-8-pecas': { name: 'Hot + Fry (8 pieces)' },
  'hot-iu-6-pecas': { name: 'Hot IU (6 pieces)' },
  'hot-bolinho-la-cabane-10-pecas': { name: 'Hot La Cabane Croquettes (10 pieces)' },
  'hot-especial-10-pecas': { name: 'Hot Special (10 pieces)' },
  'hot-la-cabane-10-pecas': { name: 'Hot La Cabane (10 pieces)' },

  // Carnes
  'picanha-a-moda-la-cabane': {
    name: 'La Cabane Style Picanha',
    description:
      'Picanha seared with a blowtorch, served with fries, rice, black beans, collard greens, plantain and grilled pineapple.',
  },
  't-bone-a-moda-la-cabane': {
    name: 'La Cabane Style T-Bone',
    description: 'Premium grilled cut, served with sautéed vegetables.',
  },
  'bife-as-tres-pimentas': {
    name: 'Three-Pepper Steak',
    description: 'Steak in a creamy pepper sauce, served with sautéed vegetables and fries.',
  },
  'bife-a-portuguesa': { name: 'Portuguese Steak', description: 'Crisps, egg and cured ham.' },
  'tomahawk-a-moda-la-cabane': {
    name: 'La Cabane Style Tomahawk',
    description: 'Served with fries and mixed salad.',
  },
  'churrasco-de-galinha-nacional': {
    name: 'Charcoal-Grilled Free-Range Chicken',
    description: 'Charcoal-grilled chicken with fries and salad.',
  },
  'lombo-de-porco-grelhado': {
    name: 'Grilled Pork Loin',
    description: 'Served with fries and salad.',
  },
  'grelhada-terra-e-mar': {
    name: 'Surf & Turf Grill',
    description:
      'A selection of grilled meats and a selection of seafood and fish, with rice and beans, fried sweet potato and salad.',
  },
  'tabua-mista': {
    name: 'Mixed Grill Board',
    description: 'Assorted grilled meats, served with rice, beans, fries and salad.',
  },
  'tiras-de-porco-vaca-grelhadas': { name: 'Grilled Pork & Beef Strips' },

  // Mariscos e Frutos do Mar
  'lagosta-grelhada': {
    name: 'Grilled Lobster',
    description: 'Fresh grilled lobster, served with fries and salad.',
  },
  'tabua-de-frutos-do-mar-a-moda-la-cabane': {
    name: 'La Cabane Seafood Board',
    description:
      'A special selection of lobster, king prawns, mussels, cuttlefish and clams.',
  },
  'gambas-ao-alho': { name: 'Garlic Prawns' },
  'risoto-de-camarao': {
    name: 'Prawn Risotto',
    description: 'Creamy rice with prawns, seafood cream and grated cheese.',
  },
  'arroz-de-frutos-do-mar-a-moda-la-cabane': {
    name: 'La Cabane Seafood Rice',
    description: 'Rice with assorted seafood in tomato sauce, peppers and coriander.',
  },
  'arroz-de-lagosta-a-moda-la-cabane': {
    name: 'La Cabane Lobster Rice',
    description: 'Creamy rice with lobster and spices.',
  },
  'lagosta-gratinada': {
    name: 'Lobster Gratin',
    description: 'Oven-baked lobster with cream sauce and gratinated cheese.',
  },
  'choco-grelhado-a-lagareiro': {
    name: 'Grilled Cuttlefish Lagareiro',
    description: 'Grilled cuttlefish with smashed potatoes and garlic sauce.',
  },
  'gambas-grelhadas': {
    name: 'Grilled King Prawns',
    description: 'Fresh grilled king prawns with fries and salad.',
  },

  // Uramaki
  'uramaki-california-8-pecas': { name: 'California Uramaki (8 pieces)' },
  'uramaki-spicy-tuna-8-pecas': { name: 'Spicy Tuna Uramaki (8 pieces)' },
  'uramaki-skin-8-pecas': { name: 'Skin Uramaki (8 pieces)' },
  'uramaki-ebi-especial-8-pecas': { name: 'Ebi Special Uramaki (8 pieces)' },
  'uramaki-ebi-ten-8-pecas': { name: 'Ebi Ten Uramaki (8 pieces)' },
  'uramaki-salmao-8-pecas': { name: 'Salmon Uramaki (8 pieces)' },

  // Cocktails e Bebidas Mistas
  caipirinha: { name: 'Caipirinha' },
  'caipirinha-black': { name: 'Black Caipirinha' },
  'caipirinha-love': { name: 'Caipirinha Love' },
  mojito: { name: 'Mojito' },
  'pina-colada': { name: 'Piña Colada' },
  margarita: { name: 'Margarita' },
  'cuba-libre': { name: 'Cuba Libre' },
  'coquetel-a-moda-do-chefe': { name: "Chef's Signature Cocktail" },
  granizado: { name: 'Slushie' },
  'caipirinha-de-maracuja': { name: 'Passion Fruit Caipirinha' },

  // Guarnições
  'batata-cozida-rena': { name: 'Boiled Potatoes (Rena)' },
  'batata-frita-rena': { name: 'French Fries (Rena)' },
  'batata-cozida-doce': { name: 'Boiled Sweet Potato' },
  'batata-frita-doce': { name: 'Sweet Potato Fries' },
  'arroz-branco': { name: 'White Rice' },
  'arroz-de-feijao': { name: 'Rice & Beans' },
  'feijao-preto': { name: 'Black Beans' },
  'legumes-salteados': { name: 'Sautéed Vegetables' },
  'legumes-cozidos': { name: 'Boiled Vegetables' },
  'funge-de-bombo': { name: 'Funge de Bombó (Cassava)' },
  'funge-misto': { name: 'Mixed Funge' },

  // Whisky e Brandy
  'royal-brand': { name: 'Royal Brand' },
  'macieira-cream': { name: 'Macieira Cream' },
  presidente: { name: 'Presidente' },
  'fundador-supremo': { name: 'Fundador Supremo' },
  'royal-salute': { name: 'Royal Salute' },
  'whisky-jameson': { name: 'Jameson Whiskey' },
  'whisky-jameson-black': { name: 'Jameson Black Barrel Whiskey' },
  'ballantine-s': { name: "Ballantine's" },
  '1920': { name: '1920' },

  // Combinados
  'combo-la-cabane-15-pecas': { name: 'La Cabane Combo (15 pieces)' },
  'combinado-20-pecas': { name: 'Sushi Combo (20 pieces)', description: 'Salmon only.' },
  'combinado-40-pecas': { name: 'Sushi Combo (40 pieces)', description: 'Salmon only.' },
  'combinado-50-pecas': { name: 'Sushi Combo (50 pieces)', description: 'Salmon only.' },
  'combinado-100-pecas': { name: 'Sushi Combo (100 pieces)', description: 'Salmon only.' },

  // Massas / Yakissoba
  'yakissoba-de-carne': { name: 'Beef Yakisoba' },
  'yakissoba-de-frango': { name: 'Chicken Yakisoba' },
  'yakissoba-de-camarao': { name: 'Prawn Yakisoba' },
  'yakissoba-vegetariana': { name: 'Vegetarian Yakisoba' },
  'yakissoba-mista': { name: 'Mixed Yakisoba' },

  // Sobremesas
  'pave-de-bolacha': { name: 'Biscuit Pavê' },
  'petit-gateau-com-gelado': { name: 'Petit Gâteau with Ice Cream' },
  'mousse-de-chocolate': { name: 'Chocolate Mousse' },
  'mousse-de-maracuja': { name: 'Passion Fruit Mousse' },
  'brownie-de-chocolate': { name: 'Chocolate Brownie' },
  pudim: { name: 'Crème Caramel' },
  'fruta-laminada': { name: 'Sliced Fruit' },

  // Gin e Vodka
  'gin-tonico-de-frutos-vermelhos': { name: 'Red Berry Gin & Tonic' },
  'gin-tonico': { name: 'Gin & Tonic' },
  'inverroche-classic': { name: 'Inverroche Classic' },
  'inverroche-amber': { name: 'Inverroche Amber' },
  'beefeater-pink': { name: 'Beefeater Pink' },
  'beefeater-london-dry-gin': { name: 'Beefeater London Dry Gin' },
  playmont: { name: 'Playmont' },
  'vodka-absolut': {
    name: 'Absolut Vodka',
    description: 'Green, Black, White, Blue [shot 2,500 Kz].',
  },
  'vodka-wyborowa-garrafa': { name: 'Wyborowa Vodka Bottle' },
  ciroc: { name: 'Cîroc' },
  'gin-gordons': { name: "Gordon's Gin" },
  'beefeater-24-super-premium': { name: 'Beefeater 24 Super Premium' },

  // Licores e Vermutes
  'malibu-garrafa': { name: 'Malibu Bottle' },
  'amarula-garrafa': { name: 'Amarula Bottle' },
  'licor-beirao-garrafa': { name: 'Licor Beirão Bottle' },
  'martini-rosso-garrafa': { name: 'Martini Rosso Bottle' },
  'martini-bianco-garrafa': { name: 'Martini Bianco Bottle' },

  // Aguardentes
  crf: { name: 'CRF' },
  antiqua: { name: 'Antiqua' },
  'alianca-velha': { name: 'Aliança Velha' },
  cachaca: { name: 'Cachaça' },
  'sao-domingos': { name: 'São Domingos' },

  // Brandes
  'royal-brand-garrafa': { name: 'Royal Brand Bottle' },
  'macieira-cream-garrafa': { name: 'Macieira Cream Bottle' },

  // Runs
  'havana-club-garrafa': { name: 'Havana Club Bottle' },
  'bumbu-original-rum-garrafa': { name: 'Bumbu Original Rum Bottle' },
  'bumbu-cremel-garrafa': { name: 'Bumbu Crème Liqueur Bottle' },
  bacardi: { name: 'Bacardi' },

  // Tequilas
  'olmeca-branco-silver-garrafa': { name: 'Olmeca Blanco Silver Bottle' },
  'olmeca-chocolate-garrafa': { name: 'Olmeca Chocolate Bottle' },
  'dom-julio': { name: 'Dom Julio' },
  camino: { name: 'Camino' },

  // Conhaques
  monnet: { name: 'Monnet' },
  davidoff: { name: 'Davidoff' },
  courvoisier: { name: 'Courvoisier' },

  // Sangrias
  'sangria-jarra-1-5l-tinto-ou-branco': {
    name: 'Sangria Jug 1.5 L (red or white)',
    description: 'Red or white.',
  },
  'sangria-jarra-1-5l-frutos-vermelhos': {
    name: 'Sangria Jug 1.5 L (red berries)',
    description: 'Red berries.',
  },
  'sangria-jarra-1-5l-so-morangos': {
    name: 'Sangria Jug 1.5 L (strawberry only)',
    description: 'Strawberry only.',
  },
  'sangria-belaire': { name: 'Belaire Sangria', description: 'Red berries.' },
  'sangria-moet-chandon-nectar': {
    name: 'Moët & Chandon Nectar Sangria',
    description: 'Red berries and strawberries.',
  },
  'sangria-moet-chandon-ice': {
    name: 'Moët & Chandon Ice Sangria',
    description: 'Red berries and strawberries.',
  },

  // Vinhos Tintos
  loios: { name: 'Loios' },
  'alumia-reserva': { name: 'Alumia Reserva' },
  alabastro: { name: 'Alabastro' },
  'pouca-roupa': { name: 'Pouca Roupa' },
  'marques-de-borba-garrafa': { name: 'Marquês de Borba Bottle' },
  'paulo-laureano': { name: 'Paulo Laureano' },
  'paulo-laureano-classico': { name: 'Paulo Laureano Clássico' },
  'flor-de-castro': { name: 'Flor de Castro' },
  mariana: { name: 'Mariana' },
  amicone: { name: 'Amicone' },
  'papa-figos': { name: 'Papa Figos' },
  'caves-da-murca-do-porto': { name: 'Caves da Murça do Porto' },
  'silk-space-garrafa': { name: 'Silk Space (Bottle)' },
  meandro: { name: 'Meandro' },
  'duas-quintas': { name: 'Duas Quintas' },
  'trincas-bolotas': { name: 'Trincas Bolotas' },
  'vinho-grande-douro': { name: 'Grande Douro Wine' },
  'quinta-dos-carvalhais': { name: 'Quinta dos Carvalhais' },
  'esteva-douro': { name: 'Esteva Douro' },
  nederburg: { name: 'Nederburg' },
  baltazar: { name: 'Baltazar' },
  'quinta-da-bacalhoa': { name: 'Quinta da Bacalhôa' },
  merlot: { name: 'Merlot' },

  // Vinhos Brancos e Verdes
  'loios-branco': { name: 'Loios White' },
  planalto: { name: 'Planalto' },
  gazela: { name: 'Gazela' },
  'casal-garcia': { name: 'Casal Garcia' },
  'marques-de-borba-branco': { name: 'Marquês de Borba White' },
  'silk-space': { name: 'Silk Space' },
  azevedo: { name: 'Azevedo' },

  // Vinhos Rosé
  'mateus-rose': { name: 'Mateus Rosé' },
  'baltazar-rose': { name: 'Baltazar Rosé' },

  // Champanhes e Espumantes
  moscato: { name: 'Moscato' },
  'moet-chandon-ice': { name: 'Moët & Chandon Ice' },
  'moet-chandon-nectar': { name: 'Moët & Chandon Nectar' },
  ruinart: { name: 'Ruinart' },
  'louis-roederer': { name: 'Louis Roederer' },
  'dom-perignon': { name: 'Dom Pérignon' },
  'armand-de-brignac': { name: 'Armand de Brignac' },
};

function localizeProduct(product: MenuProduct): MenuProduct {
  const translation = productEn[product.slug];

  return {
    ...product,
    name: translation?.name ?? product.name,
    description: translation?.description ?? product.description,
    variantGroups: product.variantGroups.map((group) => ({
      ...group,
      name: variantGroupEn[group.name] ?? group.name,
      variants: group.variants.map((variant) => ({
        ...variant,
        name: variantEn[variant.name] ?? variant.name,
      })),
    })),
  };
}

/**
 * Returns the menu tree in the requested language. Portuguese (the source
 * language) is returned untouched; English falls back to the original text
 * wherever a translation is missing.
 */
export function localizeGroups(groups: MenuGroup[], locale: Locale): MenuGroup[] {
  if (locale !== 'en') {
    return groups;
  }

  return groups.map((group) => ({
    ...group,
    name: groupEn[group.slug] ?? group.name,
    categories: group.categories.map((category) => ({
      ...category,
      name: categoryEn[category.slug] ?? category.name,
      products: category.products.map(localizeProduct),
    })),
  }));
}
