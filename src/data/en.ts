/**
 * Inglês dos textos que o sistema mesmo escreve (padrões dos formulários e
 * modelos) e do conteúdo do 1305C / Residencial DF Plaza, no mesmo esquema do
 * dicionário espanhol (`src/data/es.ts`): chave = texto em português
 * exatamente como está gravado, com os marcadores ainda por preencher;
 * valor = inglês.
 *
 * Vale para o texto sem inglês: quando "Inglês (opcional)" fica em branco, o
 * editor grava o inglês como cópia do português, e o guia procura aqui o
 * português (ver `textoNoIdioma`). Inglês digitado vence o dicionário.
 *
 * Cobre as mesmas chaves do espanhol, menos as que são iguais nos dois
 * idiomas por natureza ("Check-in", "Coworking"): essas não têm chave e saem
 * como estão. O inglês vem do seed e do conteúdo estático do 1305C; texto que
 * só existe em versão antiga no banco usa o inglês gravado no DF Plaza do
 * banco de desenvolvimento.
 */

import { CHAT_LINK } from "@/data/chatLink";

const EN: Record<string, string> = {
  // ── Padrões do sistema ─────────────────────────────────────────────────
  "Guia de boas-vindas": "Welcome guide",
  "Regras": "Rules",
  "Contatos": "Contacts",
  "A Casa": "The Home",
  "Lazer": "Amenities",
  "Onde Comer": "Dining",
  "Instruções de chegada.": "Arrival instructions.",
  "Antes de sair.": "Before you leave.",
  "Regras da casa.": "House rules.",
  "Contatos.": "Contacts.",
  "Garagem": "Parking",
  "Capacidade máxima": "Max capacity",
  "Proibido fumar": "No smoking",
  "Em todo o apartamento.": "Anywhere in the apartment.",
  "Fumo permitido": "Smoking allowed",
  "Fumo permitido somente na varanda": "Smoking allowed on the balcony only",
  "Dentro do apartamento é proibido fumar.": "Smoking is not allowed inside the apartment.",
  "Não são permitidos animais": "No pets allowed",
  "Animais são bem-vindos": "Pets are welcome",
  "Anfitrião · WhatsApp": "Host · WhatsApp",
  "Anfitriã · WhatsApp": "Host · WhatsApp",
  "Coanfitrião/gestor · WhatsApp": "Co-host/manager · WhatsApp",
  "Emergência médica": "Medical emergency",
  "Incêndio e resgate": "Fire and rescue",
  "Boa estadia!": "Enjoy your stay!",
  "Com carinho, ": "Warmly, ",

  // ── Cartão "Antes de chegar" ───────────────────────────────────────────
  "Antes de chegar": "Before you arrive",
  "Pré-requisito": "Required",
  "Para agilizar a liberação do seu acesso na portaria, envie ao anfitrião, com antecedência, uma foto do documento de identidade (RG ou CNH) de cada hóspede que vai ficar no apartamento. Se alguém do grupo vier de carro, inclua também modelo, marca, cor e placa do veículo.":
    "To speed up your access clearance at the front desk, please send the host, in advance, a photo of an ID document (national ID or driver's license) for every guest staying at the apartment. If anyone in your group is arriving by car, please also include the vehicle's model, brand, color, and license plate.",

  // ── 1305C · Capa e navegação ───────────────────────────────────────────
  '<strong>Residencial DF Plaza</strong> · Águas Claras, Brasília. Aqui está tudo sobre a chegada, o Wi-Fi e o dia a dia no apartamento.':
    "<strong>DF Plaza Residence</strong> · Águas Claras, Brasília. Everything about your arrival, the Wi-Fi and daily life in the apartment.",
  "Torre C": "Tower C",
  "13º andar": "13th floor",
  "Portaria": "Lobby",
  "ao lado do Spoleto": "next to Spoleto",
  "Vaga 269": "Spot 269",
  "Subsolo −3": "Level −3",
  "600 Mega · ideal para streaming e home office": "600 Mbps · great for streaming and remote work",

  // ── Check-in / check-out (modelo do prédio) ─────────────────────────────
  // Chaves com os marcadores como ficam gravados no modelo do prédio: o
  // check-in e o check-out procuram o inglês aqui antes de preenchê-los
  // (`filledCheckin`), e assim vale para qualquer torre/andar/vaga.
  "Da portaria até a porta do apartamento.": "From the lobby to your apartment door.",
  "Entrando no prédio": "Entering the building",
  '<strong>De Uber/táxi?</strong> Desça no DF Plaza Shopping, entrada do restaurante <strong>Coco Bambu (2º piso)</strong>.<span class="hint">Essa entrada fica a poucos metros da portaria da {{TORRE}}.</span>':
    '<strong>By Uber/taxi?</strong> Get off at DF Plaza Shopping, at the <strong>Coco Bambu restaurant entrance (2nd floor)</strong>.<span class="hint">This entrance is just a few meters from the {{TORRE}} lobby.</span>',
  [`Vá à <strong>portaria 24h da {{TORRE}}</strong>{{PORTARIA_REF}}, e apresente seu <strong>documento</strong> (o mesmo enviado pelo ${CHAT_LINK}).`]:
    `Go to the <strong>24h {{TORRE}} lobby</strong>{{PORTARIA_REF}}, and show your <strong>ID</strong> (the same one sent via ${CHAT_LINK}).`,
  [`Vá à <strong>portaria 24h da {{TORRE}}</strong>, ao lado do restaurante <strong>Spoleto</strong>, e apresente seu <strong>documento</strong> (o mesmo enviado pelo ${CHAT_LINK}).`]:
    `Go to the <strong>24h {{TORRE}} lobby</strong>, next to the <strong>Spoleto</strong> restaurant, and show your <strong>ID</strong> (the same one sent via ${CHAT_LINK}).`,
  "Suba ao <strong>{{ANDAR}}</strong>, apartamento <strong>{{UNIDADE}}</strong>.":
    "Go up to the <strong>{{ANDAR}}</strong>, apartment <strong>{{UNIDADE}}</strong>.",
  [`Na fechadura eletrônica, digite {{SENHA_FECHADURA}}. Pronto, pode entrar.`]:
    `On the electronic lock, enter {{SENHA_FECHADURA}}. That's it, you're in.`,
  "Chegou de carro?": "Arriving by car?",
  'Estacione primeiro no <strong>Carrefour</strong> para descarregar as malas.<span class="hint">Grátis por 30 min, ou com compra acima de R$ 50.</span>':
    'Park first at the <strong>Carrefour</strong> lot to unload your luggage.<span class="hint">Free for 30 min, or with a purchase over R$ 50.</span>',
  "Suba ao apartamento e pegue o <strong>Cartão Branco</strong> de acesso, deixado na sala de estar.":
    "Go up to the apartment and grab the <strong>White Card</strong> left in the living room.",
  "Retire o carro e use o cartão na entrada do estacionamento residencial: <strong>{{VAGA}}</strong>.":
    "Drive to the residential parking entrance and use the card: <strong>{{VAGA}}</strong>.",
  "<strong>Anote:</strong> o GPS oscila no subsolo. {{VAGA}}, próxima ao elevador da torre.":
    "<strong>Write it down:</strong> GPS is unreliable underground. {{VAGA}}, near the tower elevator.",
  "<strong>Não esqueça o Cartão Branco</strong> antes de descer para guardar o carro. Perda ou não devolução: taxa de <strong>R$ 300</strong>.":
    "<strong>Don't forget the White Card</strong> before going down to park. Loss or non-return: <strong>R$ 300</strong> fee.",
  "▶ Tutorial em vídeo · como chegar e estacionar": "▶ Video tutorial · arriving & parking",

  // ── 1305C / demo: texto próprio deles, com os dados reais já embutidos ──
  "<strong>De Uber/táxi?</strong> Desça no DF Plaza Shopping, entrada do restaurante <strong>Coco Bambu (2º piso)</strong>.<span class=\"hint\">Essa entrada fica a poucos metros da portaria da Torre C.</span>":
    '<strong>By Uber/taxi?</strong> Get off at DF Plaza Shopping, at the <strong>Coco Bambu restaurant entrance (2nd floor)</strong>.<span class="hint">This entrance is just a few meters from the Tower C lobby.</span>',
  [`Vá à <strong>portaria 24h da Torre C</strong>, ao lado do restaurante <strong>Spoleto</strong>, e apresente seu <strong>documento</strong> (o mesmo enviado pelo ${CHAT_LINK}).`]:
    `Go to the <strong>24h Tower C lobby</strong>, next to the <strong>Spoleto</strong> restaurant, and show your <strong>ID</strong> (the same one sent via ${CHAT_LINK}).`,
  "Suba ao <strong>13º andar</strong>, apartamento <strong>1305C</strong>.":
    "Go up to the <strong>13th floor</strong>, apartment <strong>1305C</strong>.",
  "Retire o carro e use o cartão na entrada do estacionamento residencial: <strong>Subsolo −3, vaga nº 269</strong>.":
    "Drive to the residential parking entrance and use the card: <strong>Level −3, spot 269</strong>.",
  "<strong>Anote:</strong> o GPS oscila no subsolo. Subsolo −3, vaga 269, próxima ao elevador da torre.":
    "<strong>Write it down:</strong> GPS is unreliable underground. Level −3, spot 269, near the tower elevator.",

  // ── Saída ──────────────────────────────────────────────────────────────
  "Alguns passos rápidos antes de você sair. Boa viagem!": "A few quick steps before you go. Safe travels!",
  "O <strong>horário limite de saída é {{CHECKOUT_HORA}}</strong>. Precisa de late checkout? Fale com a anfitriã.":
    "<strong>Check-out is until {{CHECKOUT_HORA}}</strong>. Need a late checkout? Message the host.",
  "O <strong>horário limite de saída é 11h</strong>. Precisa de late checkout? Fale com a anfitriã.":
    "<strong>Check-out is until 11am</strong>. Need a late checkout? Message the host.",
  "Deixe o <strong>Cartão Branco</strong> de garagem sobre a mesa de jantar (a não devolução gera taxa de R$ 300).":
    "Leave the <strong>White garage Card</strong> on the dining table (non-return incurs a R$ 300 fee).",
  "Ensaque o lixo e deixe na lixeira comum do corredor, perto dos elevadores.":
    "Bag the trash and drop it in the shared hallway bin, near the elevators.",
  "Feche as janelas, desligue o ar-condicionado e confira se não esqueceu nada. É só fechar a porta ao sair.":
    "Close the windows, turn off the A/C and double-check for forgotten items. Just shut the door on your way out.",
  "Boa estadia. Qualquer coisa, é só chamar a gente.": "Enjoy your stay. Anything you need, just message us.",

  // ── Regras ─────────────────────────────────────────────────────────────
  "Combinações simples para a boa convivência no prédio.": "Simple ground rules for getting along in the building.",
  "Em todo o apartamento, inclusive na varanda.": "Anywhere in the apartment, including the balcony.",
  "Uso da varanda": "Balcony use",
  "É terminantemente proibido estender roupas, toalhas ou objetos na sacada. O descumprimento gera multa de um salário mínimo aplicada pelo condomínio.":
    "Hanging clothes, towels or any objects on the balcony is strictly prohibited. Violations carry a fine of one minimum wage, charged by the building association.",
  "Lei do silêncio · 22h às 08h": "Quiet hours · 10pm to 8am",
  "Respeite o sossego dos vizinhos.": "Please respect the neighbors' rest.",
  "Lixo ensacado": "Bag your trash",
  "Deposite na lixeira comum do corredor, perto dos elevadores.": "Drop it in the shared bin in the hallway, near the elevators.",
  "Passe roupa só na tábua": "Iron only on the board",
  "Nunca sobre a cama ou os móveis.": "Never on the bed or furniture.",
  "Somente hóspedes registrados": "Registered guests only",
  "Sobre convidados, consulte a anfitriã antes.": "For visitors, please check with the host first.",
  "Cartão de garagem · R$ 300": "Garage card · R$ 300",
  "Taxa em caso de perda ou não devolução.": "Fee in case of loss or non-return.",

  // ── Contatos ───────────────────────────────────────────────────────────
  "Toque em um número para ligar.": "Tap a number to call.",
  "Interfone <b>*2</b> ou telefone": "Intercom <b>*2</b> or phone",

  // ── A Casa ─────────────────────────────────────────────────────────────
  "O que tem no apartamento e como usar.": "What's in the apartment and how to use it.",
  "Quarto premium": "Premium bedroom",
  "Cama de casal com enxoval novo, cortina blackout dupla e ar-condicionado.":
    "Double bed with fresh linens, double blackout curtains and air conditioning.",
  "Cozinha equipada": "Full kitchen",
  "Fogão de indução, micro-ondas, panelas, cafeteira elétrica e sanduicheira Oster.":
    "Induction cooktop, microwave, cookware, coffee maker and an Oster sandwich press.",
  "Lazer & home office": "Leisure & home office",
  'Smart TV 65" com os streamings liberados e mesa de trabalho.': '65" smart TV with streaming included and a work desk.',
  "Fogão de indução": "Induction cooktop",
  "Pressione <strong>Power</strong> no painel touch.": "Press <strong>Power</strong> on the touch panel.",
  "Use as <strong>panelas da casa</strong> (fundo magnético) sobre a boca. O fogão só ativa com o peso e o material corretos.":
    "Use the <strong>apartment's pans</strong> (magnetic bottom) on the burner. It only turns on with the right weight and material.",
  'Ajuste a potência com <strong>+ / −</strong> (0 a 9).<span class="hint">⚠️ O nível 9 é extremamente rápido.</span>':
    'Adjust power with <strong>+ / −</strong> (0 to 9).<span class="hint">⚠️ Level 9 heats extremely fast.</span>',
  "Se quiser, programe o <strong>timer</strong> no ícone de relógio.":
    "If you like, set the <strong>timer</strong> via the clock icon.",
  "Cafeteira elétrica": "Coffee maker",
  "Abra a tampa superior e adicione <strong>água filtrada</strong> no reservatório traseiro, sem passar do nível máximo.":
    "Open the top lid and add <strong>filtered water</strong> to the rear tank, without passing the max line.",
  "Coloque o <strong>pó de café</strong> no filtro plástico lavável do suporte superior.":
    "Add <strong>ground coffee</strong> to the washable plastic filter in the top holder.",
  "Centralize a <strong>jarra de inox</strong> na base de aquecimento.":
    "Center the <strong>steel carafe</strong> on the warming base.",
  'Ligue na tomada <strong>(220V!)</strong> e pressione o botão lateral em <strong>“I”</strong>. A luz acende e o café começa a passar.':
    'Plug it in <strong>(220V!)</strong> and flip the side switch to <strong>“I”</strong>. The light turns on and brewing starts.',
  "Tampa do reservatório": "Water tank lid",
  "Filtro lavável": "Washable filter",
  "Suporte do filtro": "Filter holder",
  "Corta-pingo": "Drip-stop",
  "Reservatório de água": "Water reservoir",
  "Marcador de nível": "Level indicator",
  "Jarra": "Carafe",
  "Base de aquecimento": "Warming base",
  "Botão liga/desliga": "On/Off switch",
  "Cabo de força": "Power cord",

  // ── Lazer ──────────────────────────────────────────────────────────────
  "Tudo no <strong>Andar M (Mezanino)</strong>, é só descer de elevador.":
    "All on <strong>Floor M (Mezzanine)</strong>, just take the elevator down.",
  "Piscina infinita · 25 m": "Infinity pool · 25 m",
  "Traje de banho obrigatório. Fechada para limpeza às segundas e terças pela manhã. Crianças sempre acompanhadas.":
    "Proper swimwear required. Closed for cleaning Monday and Tuesday mornings. Children must be supervised.",
  "Academia": "Gym",
  "Acesso pela digital cadastrada no check-in. Use calçado fechado.":
    "Access via the fingerprint registered at check-in. Closed shoes required.",
  "Agende com a anfitriã ou portaria com 48h de antecedência.": "Book via the host or front desk 48h in advance.",
  "Lavanderia": "Laundry",
  "Máquinas industriais. Funciona com fichas vendidas no local.": "Industrial machines. Works with tokens sold on site.",
  "Sala de jogos": "Game room",
  "Sinuca e jogos de mesa, uso rotativo e compartilhado.": "Pool table and board games, shared rotating use.",
  "Espaço Mulher": "Beauty room",
  "Área de autocuidado e beleza.": "A dedicated self-care and beauty area.",
  "Silencioso e climatizado, ideal para home office e estudos.":
    "Quiet and air-conditioned, ideal for remote work and studying.",

  // ── Guia de Brasília ───────────────────────────────────────────────────
  "Quatro paradas que valem o deslocamento.": "Four stops worth the trip.",
  "Projeto de Oscar Niemeyer, com os vitrais de Marianne Peretti. O fim de tarde é a melhor hora para fotos.":
    "Designed by Oscar Niemeyer, with stained glass by Marianne Peretti. Late afternoon is the best time for photos.",
  "Na mesma praça ficam o Panteão da Pátria e o mastro da maior bandeira hasteada do mundo.":
    "The Pantheon of the Fatherland and the mast of the world's largest flown flag share the same square.",
  "Visita guiada de cerca de 50 minutos pelo Salão Verde, plenários e exposições. Os dias e horários mudam conforme a agenda legislativa, então confirme e reserve no site oficial.":
    "A guided tour of about 50 minutes through the Green Hall, chambers and exhibitions. Days and times follow the legislative calendar, so check and book on the official site.",
  "Restaurantes, quiosques e um calçadão na beira do Lago Paranoá. O pôr do sol ali é o programa.":
    "Restaurants, kiosks and a promenade on the shore of Lake Paranoá. Sunset there is the whole point.",

  // ── Onde Comer ─────────────────────────────────────────────────────────
  "O shopping tem várias opções. Saindo dele, estas são as nossas preferidas.":
    "The mall has plenty of options. Beyond it, these are our favorites.",
  "Mexicano e tex-mex, com porções fartas para dividir.": "Mexican and tex-mex, with generous plates to share.",
  "Japonês com rodízio na esteira e também à la carte.": "Japanese with conveyor-belt rodízio and an à la carte menu.",
  "Cozinha nordestina e carne de sol, com grelhados para dividir.":
    "Northeastern Brazilian cooking and carne de sol, with grilled dishes to share.",
};

/** Ordinal inglês: 1st, 2nd, 3rd, 4th… 11th, 12th, 13th… 21st, 22nd, 23rd. */
function ordinal(n: number): string {
  const centena = n % 100;
  if (centena >= 11 && centena <= 13) return `${n}th`;
  const sufixo = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${sufixo}`;
}

/**
 * Horário de saída em inglês, para o marcador {{CHECKOUT_HORA}}: "11h" →
 * "11am", "14h30" → "2:30pm", "12h" → "12pm" (`undefined` fora desse formato).
 * Fica fora de `translateEn` de propósito: um texto avulso "15h" continua como
 * está, e o espanhol, que sem tradução cai no inglês, não ganha "3pm".
 */
export function horaEmIngles(hora: string): string | undefined {
  const m = /^(\d{1,2})\s*[h:]\s*(\d{2})?\s*h?$/i.exec(hora.trim());
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = m[2];
  if (h > 23 || (min !== undefined && Number(min) > 59)) return undefined;
  const minutos = min && min !== "00" ? `:${min}` : "";
  return `${h % 12 || 12}${minutos}${h < 12 ? "am" : "pm"}`;
}

/** Inglês de um texto em português, se conhecido (`undefined` = sem inglês no dicionário). */
export function translateEn(pt: string): string | undefined {
  // Só chave própria: `EN["constructor"]` acharia a função herdada de Object.
  if (Object.hasOwn(EN, pt)) return EN[pt];
  // "22º andar" (o campo "Andar" do apartamento), como o espanhol faz com "N hóspedes".
  // O campo é digitado à mão: aceita também "22° andar" (sinal de grau),
  // "22o andar", "22 andar" e "Andar" com maiúscula.
  const andar = /^(\d+)\s*[º°ªo]?\s*andar$/i.exec(pt);
  if (andar) return `${ordinal(Number(andar[1]))} floor`;
  return undefined;
}
