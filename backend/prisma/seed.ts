import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const agencies = [
  // ─── ACRE (AC) ───
  { name: 'RE/MAX Acre', city: 'Rio Branco', state: 'AC', phone: '(68) 3224-1000', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Acre Imóveis', city: 'Rio Branco', state: 'AC', phone: '(68) 3223-4500', specialty: 'Residencial', type: 'Independente' },
  { name: 'Acreana Imóveis', city: 'Rio Branco', state: 'AC', phone: '(68) 3225-7800', specialty: 'Residencial e Comercial', type: 'Independente' },
  { name: 'Amazônia Imóveis AC', city: 'Cruzeiro do Sul', state: 'AC', phone: '(68) 3322-2100', specialty: 'Residencial', type: 'Independente' },

  // ─── ALAGOAS (AL) ───
  { name: 'RE/MAX Maceió', city: 'Maceió', state: 'AL', phone: '(82) 3327-0000', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Maceió', city: 'Maceió', state: 'AL', phone: '(82) 3025-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Alagoas Imóveis', city: 'Maceió', state: 'AL', phone: '(82) 3315-5000', specialty: 'Residencial', type: 'Independente' },
  { name: 'Litoral Imóveis AL', city: 'Maceió', state: 'AL', phone: '(82) 3327-3300', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'Nordeste Imóveis AL', city: 'Arapiraca', state: 'AL', phone: '(82) 3530-1200', specialty: 'Residencial', type: 'Independente' },

  // ─── AMAZONAS (AM) ───
  { name: 'RE/MAX Manaus', city: 'Manaus', state: 'AM', phone: '(92) 3303-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Manaus', city: 'Manaus', state: 'AM', phone: '(92) 3584-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Amazonas Imóveis', city: 'Manaus', state: 'AM', phone: '(92) 3233-4400', specialty: 'Residencial e Comercial', type: 'Independente' },
  { name: 'Manaus Imóveis', city: 'Manaus', state: 'AM', phone: '(92) 3622-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Norte Imóveis AM', city: 'Manaus', state: 'AM', phone: '(92) 3301-9900', specialty: 'Lançamentos', type: 'Independente' },
  { name: 'Parintins Imóveis', city: 'Parintins', state: 'AM', phone: '(92) 3533-2200', specialty: 'Residencial', type: 'Independente' },

  // ─── AMAPÁ (AP) ───
  { name: 'RE/MAX Macapá', city: 'Macapá', state: 'AP', phone: '(96) 3217-0000', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Amapá Imóveis', city: 'Macapá', state: 'AP', phone: '(96) 3222-3300', specialty: 'Residencial', type: 'Independente' },
  { name: 'Capital Imóveis AP', city: 'Macapá', state: 'AP', phone: '(96) 3241-1500', specialty: 'Residencial e Comercial', type: 'Independente' },

  // ─── BAHIA (BA) ───
  { name: 'RE/MAX Salvador', city: 'Salvador', state: 'BA', phone: '(71) 3500-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Salvador', city: 'Salvador', state: 'BA', phone: '(71) 3266-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams Salvador', city: 'Salvador', state: 'BA', phone: '(71) 3015-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial e Comercial', type: 'Franquia' },
  { name: 'Ação Imóveis BA', city: 'Salvador', state: 'BA', phone: '(71) 3341-8000', specialty: 'Residencial', type: 'Independente' },
  { name: 'Bahia Imóveis', city: 'Salvador', state: 'BA', phone: '(71) 3450-3300', specialty: 'Lançamentos', type: 'Independente' },
  { name: 'Costa Imóveis BA', city: 'Salvador', state: 'BA', phone: '(71) 3203-4400', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'RE/MAX Feira de Santana', city: 'Feira de Santana', state: 'BA', phone: '(75) 3625-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Sul Baiano Imóveis', city: 'Vitória da Conquista', state: 'BA', phone: '(77) 3422-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Ilhéus Imóveis', city: 'Ilhéus', state: 'BA', phone: '(73) 3634-2200', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'Porto Seguro Imóveis', city: 'Porto Seguro', state: 'BA', phone: '(73) 3288-1500', specialty: 'Litorâneos e Turísticos', type: 'Independente' },

  // ─── CEARÁ (CE) ───
  { name: 'RE/MAX Fortaleza', city: 'Fortaleza', state: 'CE', phone: '(85) 3033-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Fortaleza', city: 'Fortaleza', state: 'CE', phone: '(85) 3025-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams Fortaleza', city: 'Fortaleza', state: 'CE', phone: '(85) 3246-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Habitacional Imóveis CE', city: 'Fortaleza', state: 'CE', phone: '(85) 3031-4000', specialty: 'Residencial', type: 'Independente' },
  { name: 'Cearense Imóveis', city: 'Fortaleza', state: 'CE', phone: '(85) 3452-2200', specialty: 'Lançamentos', type: 'Independente' },
  { name: 'Litoral Cearense Imóveis', city: 'Fortaleza', state: 'CE', phone: '(85) 3265-3300', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'Sol Imóveis CE', city: 'Caucaia', state: 'CE', phone: '(85) 3342-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Sobral Imóveis', city: 'Sobral', state: 'CE', phone: '(88) 3611-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Cariri Imóveis', city: 'Juazeiro do Norte', state: 'CE', phone: '(88) 3571-2200', specialty: 'Residencial', type: 'Independente' },

  // ─── DISTRITO FEDERAL (DF) ───
  { name: 'RE/MAX Brasília', city: 'Brasília', state: 'DF', phone: '(61) 3034-7600', website: 'https://remax.com.br', specialty: 'Residencial e Comercial', type: 'Franquia' },
  { name: 'Century 21 Brasília', city: 'Brasília', state: 'DF', phone: '(61) 3245-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams Brasília', city: 'Brasília', state: 'DF', phone: '(61) 3033-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial e Comercial', type: 'Franquia' },
  { name: 'Planalto Imóveis DF', city: 'Brasília', state: 'DF', phone: '(61) 3347-4000', specialty: 'Residencial', type: 'Independente' },
  { name: 'Capital Federal Imóveis', city: 'Brasília', state: 'DF', phone: '(61) 3552-3300', specialty: 'Lançamentos', type: 'Independente' },
  { name: 'Brasal Imóveis', city: 'Brasília', state: 'DF', phone: '(61) 3210-5500', specialty: 'Residencial e Comercial', type: 'Independente' },
  { name: 'Brisanet Imóveis DF', city: 'Brasília', state: 'DF', phone: '(61) 3321-1800', specialty: 'Residencial', type: 'Independente' },
  { name: 'Luziânia Imóveis', city: 'Luziânia', state: 'DF', phone: '(61) 3622-2200', specialty: 'Residencial', type: 'Independente' },

  // ─── ESPÍRITO SANTO (ES) ───
  { name: 'RE/MAX Vitória', city: 'Vitória', state: 'ES', phone: '(27) 3014-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Vitória', city: 'Vitória', state: 'ES', phone: '(27) 3340-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams ES', city: 'Vila Velha', state: 'ES', phone: '(27) 3229-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Capixaba Imóveis', city: 'Vitória', state: 'ES', phone: '(27) 3222-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Serra Imóveis ES', city: 'Serra', state: 'ES', phone: '(27) 3256-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Guarapari Imóveis', city: 'Guarapari', state: 'ES', phone: '(28) 3261-2200', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'ES Imóveis', city: 'Cachoeiro de Itapemirim', state: 'ES', phone: '(28) 3522-3300', specialty: 'Residencial', type: 'Independente' },

  // ─── GOIÁS (GO) ───
  { name: 'RE/MAX Goiânia', city: 'Goiânia', state: 'GO', phone: '(62) 3090-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Goiânia', city: 'Goiânia', state: 'GO', phone: '(62) 3215-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams Goiânia', city: 'Goiânia', state: 'GO', phone: '(62) 3271-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial e Comercial', type: 'Franquia' },
  { name: 'Goiás Imóveis', city: 'Goiânia', state: 'GO', phone: '(62) 3224-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Central Imóveis GO', city: 'Goiânia', state: 'GO', phone: '(62) 3546-3300', specialty: 'Lançamentos', type: 'Independente' },
  { name: 'Anápolis Imóveis', city: 'Anápolis', state: 'GO', phone: '(62) 3318-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Rio Verde Imóveis', city: 'Rio Verde', state: 'GO', phone: '(64) 3611-2200', specialty: 'Residencial e Rural', type: 'Independente' },

  // ─── MARANHÃO (MA) ───
  { name: 'RE/MAX São Luís', city: 'São Luís', state: 'MA', phone: '(98) 3217-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 São Luís', city: 'São Luís', state: 'MA', phone: '(98) 3305-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Maranhense Imóveis', city: 'São Luís', state: 'MA', phone: '(98) 3227-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Imperatriz Imóveis', city: 'Imperatriz', state: 'MA', phone: '(99) 3524-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Nordeste MA Imóveis', city: 'São Luís', state: 'MA', phone: '(98) 3231-3300', specialty: 'Lançamentos', type: 'Independente' },

  // ─── MINAS GERAIS (MG) ───
  { name: 'RE/MAX Belo Horizonte', city: 'Belo Horizonte', state: 'MG', phone: '(31) 3024-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 BH', city: 'Belo Horizonte', state: 'MG', phone: '(31) 3281-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams BH', city: 'Belo Horizonte', state: 'MG', phone: '(31) 3045-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial e Comercial', type: 'Franquia' },
  { name: 'WImóveis BH', city: 'Belo Horizonte', state: 'MG', phone: '(31) 2112-5000', website: 'https://wimoveis.com.br', specialty: 'Residencial', type: 'Independente' },
  { name: 'Mineiros Imóveis', city: 'Belo Horizonte', state: 'MG', phone: '(31) 3354-2200', specialty: 'Lançamentos', type: 'Independente' },
  { name: 'Direcional MG', city: 'Belo Horizonte', state: 'MG', phone: '(31) 3050-3300', specialty: 'Lançamentos', type: 'Independente' },
  { name: 'RE/MAX Uberlândia', city: 'Uberlândia', state: 'MG', phone: '(34) 3211-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Uberlândia Imóveis', city: 'Uberlândia', state: 'MG', phone: '(34) 3232-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'RE/MAX Juiz de Fora', city: 'Juiz de Fora', state: 'MG', phone: '(32) 3215-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Juiz de Fora Imóveis', city: 'Juiz de Fora', state: 'MG', phone: '(32) 3233-2200', specialty: 'Residencial', type: 'Independente' },
  { name: 'Contagem Imóveis', city: 'Contagem', state: 'MG', phone: '(31) 3396-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Triângulo Imóveis MG', city: 'Uberaba', state: 'MG', phone: '(34) 3321-3300', specialty: 'Residencial e Rural', type: 'Independente' },
  { name: 'Montes Claros Imóveis', city: 'Montes Claros', state: 'MG', phone: '(38) 3221-5500', specialty: 'Residencial', type: 'Independente' },

  // ─── MATO GROSSO DO SUL (MS) ───
  { name: 'RE/MAX Campo Grande', city: 'Campo Grande', state: 'MS', phone: '(67) 3026-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Campo Grande', city: 'Campo Grande', state: 'MS', phone: '(67) 3391-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'MS Imóveis', city: 'Campo Grande', state: 'MS', phone: '(67) 3316-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Dourados Imóveis', city: 'Dourados', state: 'MS', phone: '(67) 3421-1100', specialty: 'Residencial e Rural', type: 'Independente' },
  { name: 'Sul MS Imóveis', city: 'Campo Grande', state: 'MS', phone: '(67) 3342-3300', specialty: 'Lançamentos', type: 'Independente' },

  // ─── MATO GROSSO (MT) ───
  { name: 'RE/MAX Cuiabá', city: 'Cuiabá', state: 'MT', phone: '(65) 3614-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Cuiabá', city: 'Cuiabá', state: 'MT', phone: '(65) 3027-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'MT Imóveis', city: 'Cuiabá', state: 'MT', phone: '(65) 3316-4400', specialty: 'Residencial e Rural', type: 'Independente' },
  { name: 'Pantanal Imóveis', city: 'Cuiabá', state: 'MT', phone: '(65) 3623-2200', specialty: 'Rural', type: 'Independente' },
  { name: 'Sinop Imóveis', city: 'Sinop', state: 'MT', phone: '(66) 3531-3300', specialty: 'Residencial', type: 'Independente' },
  { name: 'Rondonópolis Imóveis', city: 'Rondonópolis', state: 'MT', phone: '(66) 3422-1100', specialty: 'Residencial', type: 'Independente' },

  // ─── PARÁ (PA) ───
  { name: 'RE/MAX Belém', city: 'Belém', state: 'PA', phone: '(91) 3217-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Belém', city: 'Belém', state: 'PA', phone: '(91) 3199-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Pará Imóveis', city: 'Belém', state: 'PA', phone: '(91) 3229-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Amazônia Imóveis PA', city: 'Belém', state: 'PA', phone: '(91) 3203-3300', specialty: 'Residencial e Comercial', type: 'Independente' },
  { name: 'Marabá Imóveis', city: 'Marabá', state: 'PA', phone: '(94) 3322-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Santarém Imóveis', city: 'Santarém', state: 'PA', phone: '(93) 3523-2200', specialty: 'Residencial', type: 'Independente' },

  // ─── PARAÍBA (PB) ───
  { name: 'RE/MAX João Pessoa', city: 'João Pessoa', state: 'PB', phone: '(83) 3033-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 João Pessoa', city: 'João Pessoa', state: 'PB', phone: '(83) 3242-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Paraibana Imóveis', city: 'João Pessoa', state: 'PB', phone: '(83) 3247-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Litorânea Imóveis PB', city: 'João Pessoa', state: 'PB', phone: '(83) 3226-3300', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'Campina Grande Imóveis', city: 'Campina Grande', state: 'PB', phone: '(83) 3310-1100', specialty: 'Residencial', type: 'Independente' },

  // ─── PERNAMBUCO (PE) ───
  { name: 'RE/MAX Recife', city: 'Recife', state: 'PE', phone: '(81) 3033-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Recife', city: 'Recife', state: 'PE', phone: '(81) 3305-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams Recife', city: 'Recife', state: 'PE', phone: '(81) 3421-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial e Comercial', type: 'Franquia' },
  { name: 'Pernambucana Imóveis', city: 'Recife', state: 'PE', phone: '(81) 3222-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Boa Viagem Imóveis', city: 'Recife', state: 'PE', phone: '(81) 3326-3300', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'Caruaru Imóveis', city: 'Caruaru', state: 'PE', phone: '(81) 3722-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Olinda Imóveis', city: 'Olinda', state: 'PE', phone: '(81) 3493-2200', specialty: 'Residencial', type: 'Independente' },
  { name: 'Porto de Galinhas Imóveis', city: 'Ipojuca', state: 'PE', phone: '(81) 3552-5500', specialty: 'Litorâneos e Turísticos', type: 'Independente' },

  // ─── PIAUÍ (PI) ───
  { name: 'RE/MAX Teresina', city: 'Teresina', state: 'PI', phone: '(86) 3221-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Teresina', city: 'Teresina', state: 'PI', phone: '(86) 3085-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Piauiense Imóveis', city: 'Teresina', state: 'PI', phone: '(86) 3223-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Parnaíba Imóveis', city: 'Parnaíba', state: 'PI', phone: '(86) 3321-2200', specialty: 'Litorâneos', type: 'Independente' },

  // ─── PARANÁ (PR) ───
  { name: 'Apolar Imóveis', city: 'Curitiba', state: 'PR', phone: '(41) 3021-8282', website: 'https://apolar.com.br', specialty: 'Residencial e Comercial', type: 'Regional' },
  { name: 'RE/MAX Curitiba', city: 'Curitiba', state: 'PR', phone: '(41) 3014-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Curitiba', city: 'Curitiba', state: 'PR', phone: '(41) 3362-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams Curitiba', city: 'Curitiba', state: 'PR', phone: '(41) 3015-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial e Comercial', type: 'Franquia' },
  { name: 'Imóvel Fácil PR', city: 'Curitiba', state: 'PR', phone: '(41) 3232-2300', specialty: 'Residencial', type: 'Independente' },
  { name: 'PR Imóveis', city: 'Curitiba', state: 'PR', phone: '(41) 3056-4400', specialty: 'Lançamentos', type: 'Independente' },
  { name: 'RE/MAX Londrina', city: 'Londrina', state: 'PR', phone: '(43) 3326-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Londrina Imóveis', city: 'Londrina', state: 'PR', phone: '(43) 3321-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'RE/MAX Maringá', city: 'Maringá', state: 'PR', phone: '(44) 3025-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Maringá Imóveis', city: 'Maringá', state: 'PR', phone: '(44) 3225-2200', specialty: 'Residencial', type: 'Independente' },
  { name: 'Foz do Iguaçu Imóveis', city: 'Foz do Iguaçu', state: 'PR', phone: '(45) 3523-3300', specialty: 'Residencial e Turísticos', type: 'Independente' },
  { name: 'Apolar Cascavel', city: 'Cascavel', state: 'PR', phone: '(45) 3321-8282', website: 'https://apolar.com.br', specialty: 'Residencial', type: 'Regional' },

  // ─── RIO DE JANEIRO (RJ) ───
  { name: 'RE/MAX Rio de Janeiro', city: 'Rio de Janeiro', state: 'RJ', phone: '(21) 3550-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Rio', city: 'Rio de Janeiro', state: 'RJ', phone: '(21) 2512-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams Rio', city: 'Rio de Janeiro', state: 'RJ', phone: '(21) 3595-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial e Comercial', type: 'Franquia' },
  { name: 'Loft Rio de Janeiro', city: 'Rio de Janeiro', state: 'RJ', phone: '(21) 4000-9999', website: 'https://loft.com.br', specialty: 'Residencial', type: 'Digital' },
  { name: 'QuintoAndar Rio', city: 'Rio de Janeiro', state: 'RJ', phone: '(21) 4000-8888', website: 'https://quintoandar.com.br', specialty: 'Locação', type: 'Digital' },
  { name: 'Barra Home RJ', city: 'Rio de Janeiro', state: 'RJ', phone: '(21) 2430-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Zona Sul Imóveis RJ', city: 'Rio de Janeiro', state: 'RJ', phone: '(21) 2274-3300', specialty: 'Residencial Alto Padrão', type: 'Independente' },
  { name: 'Ipanema Imóveis', city: 'Rio de Janeiro', state: 'RJ', phone: '(21) 2523-5500', specialty: 'Alto Padrão', type: 'Independente' },
  { name: 'RE/MAX Niterói', city: 'Niterói', state: 'RJ', phone: '(21) 2620-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Niterói Imóveis', city: 'Niterói', state: 'RJ', phone: '(21) 2613-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Cabo Frio Imóveis', city: 'Cabo Frio', state: 'RJ', phone: '(22) 2645-2200', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'Búzios Imóveis', city: 'Armação dos Búzios', state: 'RJ', phone: '(22) 2623-3300', specialty: 'Litorâneos e Turísticos', type: 'Independente' },
  { name: 'Petrópolis Imóveis', city: 'Petrópolis', state: 'RJ', phone: '(24) 2237-4400', specialty: 'Residencial', type: 'Independente' },

  // ─── RIO GRANDE DO NORTE (RN) ───
  { name: 'RE/MAX Natal', city: 'Natal', state: 'RN', phone: '(84) 3206-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Natal', city: 'Natal', state: 'RN', phone: '(84) 3205-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Potiguar Imóveis', city: 'Natal', state: 'RN', phone: '(84) 3206-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Litorânea RN Imóveis', city: 'Natal', state: 'RN', phone: '(84) 3207-3300', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'Mossoró Imóveis', city: 'Mossoró', state: 'RN', phone: '(84) 3321-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Ponta Negra Imóveis', city: 'Natal', state: 'RN', phone: '(84) 3219-5500', specialty: 'Litorâneos e Turísticos', type: 'Independente' },

  // ─── RONDÔNIA (RO) ───
  { name: 'RE/MAX Porto Velho', city: 'Porto Velho', state: 'RO', phone: '(69) 3221-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Rondônia Imóveis', city: 'Porto Velho', state: 'RO', phone: '(69) 3224-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Ji-Paraná Imóveis', city: 'Ji-Paraná', state: 'RO', phone: '(69) 3422-2200', specialty: 'Residencial', type: 'Independente' },
  { name: 'Norte Imóveis RO', city: 'Porto Velho', state: 'RO', phone: '(69) 3229-3300', specialty: 'Residencial e Rural', type: 'Independente' },

  // ─── RORAIMA (RR) ───
  { name: 'RE/MAX Boa Vista', city: 'Boa Vista', state: 'RR', phone: '(95) 3224-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Roraima Imóveis', city: 'Boa Vista', state: 'RR', phone: '(95) 3226-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Capital RR Imóveis', city: 'Boa Vista', state: 'RR', phone: '(95) 3224-2200', specialty: 'Residencial', type: 'Independente' },

  // ─── RIO GRANDE DO SUL (RS) ───
  { name: 'Auxiliadora Predial', city: 'Porto Alegre', state: 'RS', phone: '(51) 3027-7000', website: 'https://auxiliadorapredial.com.br', specialty: 'Residencial e Comercial', type: 'Regional' },
  { name: 'RE/MAX Porto Alegre', city: 'Porto Alegre', state: 'RS', phone: '(51) 3024-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Porto Alegre', city: 'Porto Alegre', state: 'RS', phone: '(51) 3336-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams RS', city: 'Porto Alegre', state: 'RS', phone: '(51) 3025-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'José Fay Imóveis', city: 'Porto Alegre', state: 'RS', phone: '(51) 3311-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Pandini Imóveis', city: 'Porto Alegre', state: 'RS', phone: '(51) 3225-3300', specialty: 'Residencial', type: 'Independente' },
  { name: 'Auxiliadora Predial Caxias', city: 'Caxias do Sul', state: 'RS', phone: '(54) 3021-7000', website: 'https://auxiliadorapredial.com.br', specialty: 'Residencial', type: 'Regional' },
  { name: 'RE/MAX Caxias do Sul', city: 'Caxias do Sul', state: 'RS', phone: '(54) 3025-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Gramado Imóveis', city: 'Gramado', state: 'RS', phone: '(54) 3286-5500', specialty: 'Residencial e Turísticos', type: 'Independente' },
  { name: 'RE/MAX Pelotas', city: 'Pelotas', state: 'RS', phone: '(53) 3027-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Santa Maria Imóveis RS', city: 'Santa Maria', state: 'RS', phone: '(55) 3221-2200', specialty: 'Residencial', type: 'Independente' },
  { name: 'Serra Gaúcha Imóveis', city: 'Caxias do Sul', state: 'RS', phone: '(54) 3223-1100', specialty: 'Residencial', type: 'Independente' },

  // ─── SANTA CATARINA (SC) ───
  { name: 'RE/MAX Florianópolis', city: 'Florianópolis', state: 'SC', phone: '(48) 3024-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Florianópolis', city: 'Florianópolis', state: 'SC', phone: '(48) 3028-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams SC', city: 'Florianópolis', state: 'SC', phone: '(48) 3206-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial e Comercial', type: 'Franquia' },
  { name: 'Auxiliadora Predial SC', city: 'Florianópolis', state: 'SC', phone: '(48) 3028-7000', website: 'https://auxiliadorapredial.com.br', specialty: 'Residencial', type: 'Regional' },
  { name: 'Apolar Florianópolis', city: 'Florianópolis', state: 'SC', phone: '(48) 3027-8282', website: 'https://apolar.com.br', specialty: 'Residencial', type: 'Regional' },
  { name: 'Imagem Imóveis SC', city: 'Florianópolis', state: 'SC', phone: '(48) 3239-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Ilha Imóveis', city: 'Florianópolis', state: 'SC', phone: '(48) 3240-3300', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'RE/MAX Joinville', city: 'Joinville', state: 'SC', phone: '(47) 3025-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Joinville Imóveis', city: 'Joinville', state: 'SC', phone: '(47) 3433-1100', specialty: 'Residencial e Comercial', type: 'Independente' },
  { name: 'RE/MAX Blumenau', city: 'Blumenau', state: 'SC', phone: '(47) 3026-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Blumenau Imóveis', city: 'Blumenau', state: 'SC', phone: '(47) 3321-2200', specialty: 'Residencial', type: 'Independente' },
  { name: 'Balneário Camboriú Imóveis', city: 'Balneário Camboriú', state: 'SC', phone: '(47) 3363-5500', specialty: 'Alto Padrão e Litorâneos', type: 'Independente' },
  { name: 'Beto Carrero Imóveis', city: 'Penha', state: 'SC', phone: '(47) 3345-4400', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'Chapecó Imóveis', city: 'Chapecó', state: 'SC', phone: '(49) 3321-3300', specialty: 'Residencial', type: 'Independente' },
  { name: 'Criciúma Imóveis', city: 'Criciúma', state: 'SC', phone: '(48) 3437-1100', specialty: 'Residencial', type: 'Independente' },

  // ─── SERGIPE (SE) ───
  { name: 'RE/MAX Aracaju', city: 'Aracaju', state: 'SE', phone: '(79) 3033-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 Aracaju', city: 'Aracaju', state: 'SE', phone: '(79) 3243-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Sergipe Imóveis', city: 'Aracaju', state: 'SE', phone: '(79) 3214-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Nordeste SE Imóveis', city: 'Aracaju', state: 'SE', phone: '(79) 3227-3300', specialty: 'Lançamentos', type: 'Independente' },

  // ─── SÃO PAULO (SP) ───
  { name: 'Loft São Paulo', city: 'São Paulo', state: 'SP', phone: '(11) 4000-9999', website: 'https://loft.com.br', specialty: 'Residencial', type: 'Digital' },
  { name: 'QuintoAndar SP', city: 'São Paulo', state: 'SP', phone: '(11) 4000-8888', website: 'https://quintoandar.com.br', specialty: 'Locação', type: 'Digital' },
  { name: 'RE/MAX São Paulo', city: 'São Paulo', state: 'SP', phone: '(11) 3045-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Century 21 SP', city: 'São Paulo', state: 'SP', phone: '(11) 3170-2121', website: 'https://century21.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Keller Williams SP', city: 'São Paulo', state: 'SP', phone: '(11) 3046-5500', website: 'https://kwbrasil.com.br', specialty: 'Residencial e Comercial', type: 'Franquia' },
  { name: 'Coelho da Fonseca', city: 'São Paulo', state: 'SP', phone: '(11) 3897-4040', website: 'https://coelhofonseca.com.br', specialty: 'Alto Padrão', type: 'Independente' },
  { name: 'Itaú Imóveis SP', city: 'São Paulo', state: 'SP', phone: '(11) 3003-3030', specialty: 'Residencial', type: 'Independente' },
  { name: 'Tamagnini Imóveis', city: 'São Paulo', state: 'SP', phone: '(11) 3016-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Paloma Imóveis SP', city: 'São Paulo', state: 'SP', phone: '(11) 3852-3300', specialty: 'Residencial', type: 'Independente' },
  { name: 'RE/MAX Campinas', city: 'Campinas', state: 'SP', phone: '(19) 3026-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Campinas Imóveis', city: 'Campinas', state: 'SP', phone: '(19) 3236-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'RE/MAX Santos', city: 'Santos', state: 'SP', phone: '(13) 3025-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Santos Imóveis', city: 'Santos', state: 'SP', phone: '(13) 3219-2200', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'RE/MAX Ribeirão Preto', city: 'Ribeirão Preto', state: 'SP', phone: '(16) 3015-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Ribeirão Imóveis', city: 'Ribeirão Preto', state: 'SP', phone: '(16) 3633-3300', specialty: 'Residencial', type: 'Independente' },
  { name: 'RE/MAX São José dos Campos', city: 'São José dos Campos', state: 'SP', phone: '(12) 3907-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Vale Imóveis SP', city: 'São José dos Campos', state: 'SP', phone: '(12) 3921-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'RE/MAX Sorocaba', city: 'Sorocaba', state: 'SP', phone: '(15) 3027-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'ABC Imóveis SP', city: 'Santo André', state: 'SP', phone: '(11) 4438-1100', specialty: 'Residencial', type: 'Independente' },
  { name: 'Guarulhos Imóveis', city: 'Guarulhos', state: 'SP', phone: '(11) 2478-2200', specialty: 'Residencial', type: 'Independente' },
  { name: 'Osasco Imóveis', city: 'Osasco', state: 'SP', phone: '(11) 3682-3300', specialty: 'Residencial', type: 'Independente' },
  { name: 'Bauru Imóveis', city: 'Bauru', state: 'SP', phone: '(14) 3203-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Marília Imóveis SP', city: 'Marília', state: 'SP', phone: '(14) 3402-5500', specialty: 'Residencial', type: 'Independente' },
  { name: 'Franca Imóveis', city: 'Franca', state: 'SP', phone: '(16) 3711-6600', specialty: 'Residencial', type: 'Independente' },
  { name: 'Araraquara Imóveis', city: 'Araraquara', state: 'SP', phone: '(16) 3331-7700', specialty: 'Residencial', type: 'Independente' },
  { name: 'Piracicaba Imóveis', city: 'Piracicaba', state: 'SP', phone: '(19) 3434-8800', specialty: 'Residencial', type: 'Independente' },
  { name: 'Jundiaí Imóveis', city: 'Jundiaí', state: 'SP', phone: '(11) 4522-9900', specialty: 'Residencial', type: 'Independente' },
  { name: 'Litoral SP Imóveis', city: 'Guarujá', state: 'SP', phone: '(13) 3351-2200', specialty: 'Litorâneos', type: 'Independente' },
  { name: 'Ubatuba Imóveis', city: 'Ubatuba', state: 'SP', phone: '(12) 3832-3300', specialty: 'Litorâneos', type: 'Independente' },

  // ─── TOCANTINS (TO) ───
  { name: 'RE/MAX Palmas', city: 'Palmas', state: 'TO', phone: '(63) 3215-7600', website: 'https://remax.com.br', specialty: 'Residencial', type: 'Franquia' },
  { name: 'Tocantins Imóveis', city: 'Palmas', state: 'TO', phone: '(63) 3219-4400', specialty: 'Residencial', type: 'Independente' },
  { name: 'Central TO Imóveis', city: 'Palmas', state: 'TO', phone: '(63) 3225-3300', specialty: 'Residencial', type: 'Independente' },
  { name: 'Araguaína Imóveis', city: 'Araguaína', state: 'TO', phone: '(63) 3414-1100', specialty: 'Residencial', type: 'Independente' },
];

async function main() {
  console.log('Inserindo base de imobiliárias do Brasil...');

  let inserted = 0;
  for (const agency of agencies) {
    await prisma.realEstateAgency.upsert({
      where: {
        name_city_state: { name: agency.name, city: agency.city, state: agency.state },
      },
      update: {},
      create: agency,
    });
    inserted++;
  }

  console.log(`✅ ${inserted} imobiliárias inseridas com sucesso!`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
