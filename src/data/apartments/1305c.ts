import type { Apartment } from "@/data/types";

const CHAT =
  '<a class="chatlink" href="https://www.airbnb.com/guest/messages" target="_blank" rel="noopener">chat</a>';

export const ap1305c: Apartment = {
  slug: "1305c",
  lang: { default: "pt" },
  name: { pt: "Apartamento", en: "Apartment" },
  eyebrow: { pt: "Guia de boas-vindas", en: "Welcome guide" },
  building: "Residencial DF Plaza",

  hero: {
    img: "/media/hero.webp",
    sub: {
      pt: "<strong>Residencial DF Plaza</strong> · Águas Claras, Brasília. Sinta-se em casa — este guia resolve sua chegada em minutos.",
      en: "<strong>DF Plaza Residence</strong> · Águas Claras, Brasília. Make yourself at home — this guide gets you settled in minutes.",
    },
    facts: [
      { k: { pt: "Torre C", en: "Tower C" }, v: { pt: "13º andar", en: "13th floor" } },
      { k: { pt: "Portaria", en: "Lobby" }, v: { pt: "ao lado do Spoleto", en: "next to Spoleto" } },
      { k: { pt: "Vaga 269", en: "Spot 269" }, v: { pt: "Subsolo −3", en: "Level −3" } },
    ],
  },

  nav: [
    { href: "#checkin", label: { pt: "Check-in", en: "Check-in" } },
    { href: "#wifi", label: { pt: "Wi-Fi", en: "Wi-Fi" } },
    { href: "#regras", label: { pt: "Regras", en: "Rules" } },
    { href: "#contatos", label: { pt: "Contatos", en: "Contacts" } },
    { href: "#casa", label: { pt: "A Casa", en: "The Home" } },
    { href: "#lazer", label: { pt: "Lazer", en: "Amenities" } },
    { href: "#turismo", label: { pt: "Brasília", en: "Brasília" } },
    { href: "#comer", label: { pt: "Onde Comer", en: "Dining" } },
  ],

  wifi: {
    network: "Camon Ap 1305",
    password: "Luanna1214@",
    speed: {
      pt: "600 Mega · ideal para streaming e home office",
      en: "600 Mbps · great for streaming and remote work",
    },
  },

  checkin: {
    sub: {
      pt: "Direto ao ponto: da portaria à porta do apartamento.",
      en: "Straight to the point: from the lobby to your door.",
    },
    cards: [
      {
        title: { pt: "Entrando no prédio", en: "Entering the building" },
        steps: [
          {
            n: "1",
            body: {
              pt: '<strong>De Uber/táxi?</strong> Desça no DF Plaza Shopping, entrada do restaurante <strong>Coco Bambu (2º piso)</strong>.<span class="hint">Essa entrada fica a poucos metros da portaria da Torre C.</span>',
              en: '<strong>By Uber/taxi?</strong> Get off at DF Plaza Shopping, at the <strong>Coco Bambu restaurant entrance (2nd floor)</strong>.<span class="hint">This entrance is just a few meters from the Tower C lobby.</span>',
            },
          },
          {
            n: "2",
            body: {
              pt: `Vá à <strong>portaria 24h da Torre C</strong>, ao lado do restaurante <strong>Spoleto</strong>, e apresente seu <strong>documento</strong> (o mesmo enviado pelo ${CHAT}).`,
              en: `Go to the <strong>24h Tower C lobby</strong>, next to the <strong>Spoleto</strong> restaurant, and show your <strong>ID</strong> (the same one sent via ${CHAT}).`,
            },
          },
          {
            n: "3",
            body: {
              pt: "Suba ao <strong>13º andar</strong> — apartamento <strong>1305C</strong>.",
              en: "Go up to the <strong>13th floor</strong> — apartment <strong>1305C</strong>.",
            },
          },
          {
            n: "4",
            body: {
              pt: `Digite na fechadura eletrônica a <strong>senha enviada pelo ${CHAT}</strong>. Pronto, sinta-se em casa!`,
              en: `Enter the <strong>code sent via ${CHAT}</strong> on the electronic lock. That's it — welcome home!`,
            },
          },
        ],
      },
      {
        title: { pt: "Chegou de carro?", en: "Arriving by car?" },
        tag: { pt: "Vaga 269", en: "Spot 269" },
        banner: "/media/predio.webp",
        steps: [
          {
            n: "1",
            body: {
              pt: 'Estacione primeiro no <strong>Carrefour</strong> para descarregar as malas.<span class="hint">Grátis por 15 min — ou com compra de R$ 30.</span>',
              en: 'Park first at the <strong>Carrefour</strong> lot to unload your luggage.<span class="hint">Free for 15 min — or with a R$ 30 purchase.</span>',
            },
          },
          {
            n: "2",
            body: {
              pt: "Suba ao apartamento e pegue o <strong>Cartão Branco</strong> de acesso, deixado na sala de estar.",
              en: "Go up to the apartment and grab the <strong>White Card</strong> left in the living room.",
            },
          },
          {
            n: "3",
            body: {
              pt: "Retire o carro e use o cartão na entrada do estacionamento residencial: <strong>Subsolo −3, vaga nº 269</strong>.",
              en: "Drive to the residential parking entrance and use the card: <strong>Level −3, spot 269</strong>.",
            },
          },
        ],
        alerts: [
          {
            icon: "📍",
            body: {
              pt: "<strong>Dica de ouro:</strong> o GPS oscila no subsolo. Guarde: subsolo −3, vaga 269, próxima ao elevador da torre.",
              en: "<strong>Golden tip:</strong> GPS is unreliable underground. Remember: level −3, spot 269, near the tower elevator.",
            },
          },
          {
            icon: "💳",
            body: {
              pt: "<strong>Não esqueça o Cartão Branco</strong> antes de descer para guardar o carro. Perda ou não devolução: taxa de <strong>R$ 300</strong>.",
              en: "<strong>Don't forget the White Card</strong> before going down to park. Loss or non-return: <strong>R$ 300</strong> fee.",
            },
          },
        ],
        video: {
          src: "/media/como-estacionar.mp4",
          poster: "/media/como-estacionar-poster.jpg",
          label: {
            pt: "▶ Tutorial em vídeo · como chegar e estacionar",
            en: "▶ Video tutorial · arriving & parking",
          },
        },
      },
    ],
  },

  rules: {
    sub: {
      pt: "Cuide do nosso lar com o mesmo carinho que cuidamos de você.",
      en: "Care for our home the way we care for you.",
    },
    items: [
      {
        icon: "🚭",
        hot: true,
        title: { pt: "Proibido fumar", en: "No smoking" },
        text: {
          pt: "Em todo o apartamento, inclusive na varanda.",
          en: "Anywhere in the apartment, including the balcony.",
        },
      },
      {
        icon: "🤫",
        title: { pt: "Lei do silêncio · 22h às 08h", en: "Quiet hours · 10pm to 8am" },
        text: {
          pt: "Respeite o sossego dos vizinhos.",
          en: "Please respect the neighbors' rest.",
        },
      },
      {
        icon: "🗑️",
        title: { pt: "Lixo ensacado", en: "Bag your trash" },
        text: {
          pt: "Deposite na lixeira comum do corredor, perto dos elevadores.",
          en: "Drop it in the shared bin in the hallway, near the elevators.",
        },
      },
      {
        icon: "👕",
        title: { pt: "Passe roupa só na tábua", en: "Iron only on the board" },
        text: { pt: "Nunca sobre a cama ou os móveis.", en: "Never on the bed or furniture." },
      },
      {
        icon: "👥",
        title: { pt: "Somente hóspedes registrados", en: "Registered guests only" },
        text: {
          pt: "Sobre convidados, consulte a anfitriã antes.",
          en: "For visitors, please check with the host first.",
        },
      },
      {
        icon: "💳",
        hot: true,
        title: { pt: "Cartão de garagem · R$ 300", en: "Garage card · R$ 300" },
        text: {
          pt: "Taxa em caso de perda ou não devolução.",
          en: "Fee in case of loss or non-return.",
        },
      },
    ],
  },

  contacts: {
    sub: { pt: "Toque em um número para ligar.", en: "Tap a number to call." },
    items: [
      {
        icon: "💬",
        name: "Anna Júlia P. Oliveira",
        role: { pt: "Anfitriã · WhatsApp", en: "Host · WhatsApp" },
        phone: "(61) 98250-0188",
        tel: "+5561982500188",
      },
      {
        icon: "💬",
        name: "Anna Júlia · 2",
        role: { pt: "Anfitriã · WhatsApp", en: "Host · WhatsApp" },
        phone: "(61) 98608-5715",
        tel: "+5561986085715",
      },
      {
        icon: "🛎️",
        name: "",
        role: { pt: "Interfone <b>*2</b> ou telefone", en: "Intercom <b>*2</b> or phone" },
        phone: "(61) 99290-9099",
        tel: "+5561992909099",
      },
      {
        icon: "🚑",
        name: "SAMU",
        role: { pt: "Emergência médica", en: "Medical emergency" },
        phone: "192",
        tel: "192",
        sos: true,
      },
      {
        icon: "🚒",
        name: "",
        role: { pt: "Incêndio e resgate", en: "Fire and rescue" },
        phone: "193",
        tel: "193",
        sos: true,
      },
    ],
  },

  home: {
    sub: {
      pt: "Projetada em cada detalhe para o seu conforto.",
      en: "Designed down to the last detail for your comfort.",
    },
    slides: [
      {
        img: "/media/cama.webp",
        title: { pt: "Quarto premium", en: "Premium bedroom" },
        text: {
          pt: "Cama espaçosa com enxoval de primeira linha, blackout duplo e ar-condicionado potente.",
          en: "Spacious bed with top-tier linens, double blackout curtains and powerful A/C.",
        },
      },
      {
        img: "/media/cozinha.webp",
        title: { pt: "Cozinha equipada", en: "Full kitchen" },
        text: {
          pt: "Fogão de indução, micro-ondas, panelas premium, cafeteira elétrica e sanduicheira Oster.",
          en: "Induction cooktop, microwave, premium cookware, coffee maker and Oster sandwich press.",
        },
      },
      {
        img: "/media/sala.webp",
        title: { pt: "Lazer & home office", en: "Leisure & home office" },
        text: {
          pt: 'Smart TV 65" com streamings de cortesia e mesa de trabalho dedicada.',
          en: '65" Smart TV with complimentary streaming and a dedicated work desk.',
        },
      },
    ],
    accordions: [
      {
        icon: "🍳",
        title: { pt: "Fogão de indução", en: "Induction cooktop" },
        steps: [
          {
            n: "1",
            body: {
              pt: "Pressione <strong>Power</strong> no painel touch.",
              en: "Press <strong>Power</strong> on the touch panel.",
            },
          },
          {
            n: "2",
            body: {
              pt: "Use as <strong>panelas da casa</strong> (fundo magnético) sobre a boca — o fogão só ativa com o peso e material corretos.",
              en: "Use the <strong>apartment's pans</strong> (magnetic bottom) on the burner — it only activates with the right weight and material.",
            },
          },
          {
            n: "3",
            body: {
              pt: 'Ajuste a potência com <strong>+ / −</strong> (0 a 9).<span class="hint">⚠️ O nível 9 é extremamente rápido.</span>',
              en: 'Adjust power with <strong>+ / −</strong> (0 to 9).<span class="hint">⚠️ Level 9 heats extremely fast.</span>',
            },
          },
          {
            n: "4",
            body: {
              pt: "Se quiser, programe o <strong>timer</strong> no ícone de relógio.",
              en: "If you like, set the <strong>timer</strong> via the clock icon.",
            },
          },
        ],
      },
      {
        icon: "☕",
        title: { pt: "Cafeteira elétrica", en: "Coffee maker" },
        steps: [
          {
            n: "1",
            body: {
              pt: "Abra a tampa superior e adicione <strong>água filtrada</strong> no reservatório traseiro, sem passar do nível máximo.",
              en: "Open the top lid and add <strong>filtered water</strong> to the rear tank, without passing the max line.",
            },
          },
          {
            n: "2",
            body: {
              pt: "Coloque o <strong>pó de café</strong> no filtro plástico lavável do suporte superior.",
              en: "Add <strong>ground coffee</strong> to the washable plastic filter in the top holder.",
            },
          },
          {
            n: "3",
            body: {
              pt: "Centralize a <strong>jarra de inox</strong> na base de aquecimento.",
              en: "Center the <strong>steel carafe</strong> on the warming base.",
            },
          },
          {
            n: "4",
            body: {
              pt: 'Ligue na tomada <strong>(220V!)</strong> e pressione o botão lateral em <strong>“I”</strong>. A luz acende e o café começa a passar.',
              en: 'Plug it in <strong>(220V!)</strong> and flip the side switch to <strong>“I”</strong>. The light turns on and brewing starts.',
            },
          },
        ],
        diagram: {
          img: "/media/cafeteira.webp",
          alt: "Diagrama das partes da cafeteira",
          legend: [
            { n: "1", label: { pt: "Tampa do reservatório", en: "Water tank lid" } },
            { n: "2", label: { pt: "Filtro lavável", en: "Washable filter" } },
            { n: "3", label: { pt: "Suporte do filtro", en: "Filter holder" } },
            { n: "4", label: { pt: "Corta-pingo", en: "Drip-stop" } },
            { n: "5", label: { pt: "Reservatório de água", en: "Water reservoir" } },
            { n: "6", label: { pt: "Marcador de nível", en: "Level indicator" } },
            { n: "7", label: { pt: "Jarra", en: "Carafe" } },
            { n: "8", label: { pt: "Base de aquecimento", en: "Warming base" } },
            { n: "9", label: { pt: "Botão liga/desliga", en: "On/Off switch" } },
            { n: "10", label: { pt: "Cabo de força", en: "Power cord" } },
          ],
        },
      },
    ],
  },

  amenities: {
    sub: {
      pt: "Tudo no <strong>Andar M (Mezanino)</strong> — é só descer de elevador.",
      en: "Everything on <strong>Floor M (Mezzanine)</strong> — just take the elevator.",
    },
    items: [
      {
        img: "/media/piscina.webp",
        wide: true,
        title: { pt: "Piscina infinita · 25 m", en: "Infinity pool · 25 m" },
        text: {
          pt: "Traje de banho obrigatório. Fechada para limpeza às segundas e terças pela manhã. Crianças sempre acompanhadas.",
          en: "Proper swimwear required. Closed for cleaning Monday and Tuesday mornings. Children must be supervised.",
        },
      },
      {
        img: "/media/academia.webp",
        title: { pt: "Academia", en: "Gym" },
        text: {
          pt: "Acesso pela digital cadastrada no check-in. Use calçado fechado.",
          en: "Access via the fingerprint registered at check-in. Closed shoes required.",
        },
      },
      {
        img: "/media/cinema.webp",
        title: { pt: "Home Cinema", en: "Home Cinema" },
        text: {
          pt: "Agende com a anfitriã ou portaria com 48h de antecedência.",
          en: "Book via the host or front desk 48h in advance.",
        },
      },
      {
        img: "/media/lavanderia.webp",
        title: { pt: "Lavanderia", en: "Laundry" },
        text: {
          pt: "Máquinas industriais. Funciona com fichas vendidas no local.",
          en: "Industrial machines. Works with tokens sold on site.",
        },
      },
      {
        img: "/media/jogos.webp",
        title: { pt: "Sala de jogos", en: "Game room" },
        text: {
          pt: "Sinuca e jogos de mesa, uso rotativo e compartilhado.",
          en: "Pool table and board games, shared rotating use.",
        },
      },
      {
        img: "/media/mulher.webp",
        title: { pt: "Espaço Mulher", en: "Beauty room" },
        text: {
          pt: "Área de autocuidado e beleza.",
          en: "A dedicated self-care and beauty area.",
        },
      },
      {
        img: "/media/cowork.webp",
        title: { pt: "Coworking", en: "Coworking" },
        text: {
          pt: "Silencioso e climatizado, ideal para reuniões rápidas.",
          en: "Quiet and air-conditioned, great for quick meetings.",
        },
      },
    ],
  },

  tourism: {
    sub: { pt: "Os clássicos que valem o passeio.", en: "The classics worth the trip." },
    items: [
      {
        img: "/media/catedral.webp",
        title: "Catedral Metropolitana",
        text: {
          pt: "Obra-prima de Oscar Niemeyer com vitrais deslumbrantes. Ideal para fotos ao pôr do sol.",
          en: "An Oscar Niemeyer masterpiece with stunning stained glass. Perfect for sunset photos.",
        },
        meta: "Arquitetura",
      },
      {
        img: "/media/candangos.webp",
        title: "Praça dos Três Poderes",
        text: {
          pt: "Onde o design encontra a política. Visite o Panteão da Pátria e o mastro da maior bandeira hasteada do mundo.",
          en: "Where design meets politics. Visit the Pantheon and the mast of the world's largest hoisted flag.",
        },
        meta: "Arquitetura",
      },
      {
        img: "/media/congresso.webp",
        title: "Congresso Nacional",
        text: {
          pt: "Visita guiada de ~50 min pelo Salão Verde, plenários e exposições de arte. Agende online com antecedência — funciona diariamente, exceto terças e quartas.",
          en: "A ~50-min guided tour of the Green Hall, chambers and art exhibits. Book online in advance — open daily except Tuesdays and Wednesdays.",
        },
        meta: "Tour",
      },
      {
        title: "Pontão do Lago Sul",
        text: {
          pt: "O melhor “beach club” sem mar: restaurantes sofisticados e um calçadão perfeito à beira do Lago Paranoá.",
          en: "The best “beach club” with no sea: refined restaurants and a lovely promenade along Lake Paranoá.",
        },
        meta: "Natureza & lazer",
      },
    ],
  },

  dining: {
    sub: {
      pt: "Há muito no DF Plaza Shopping — mas, saindo dele, estas são as nossas favoritas.",
      en: "There's plenty at DF Plaza Shopping — but beyond it, these are our favorites.",
    },
    items: [
      {
        img: "/media/elpaso.webp",
        title: "El Paso",
        text: {
          pt: "Cozinha mexicana & tex-mex, ambiente vibrante e cheio de sabor.",
          en: "Mexican & tex-mex cuisine in a vibrant, flavor-packed setting.",
        },
        meta: "404 Sul · 110 Norte · Terraço Shopping",
      },
      {
        img: "/media/nazo.webp",
        title: "Nazo Sushi",
        text: {
          pt: "Japonesa contemporânea: técnica tradicional com toques modernos em ambiente minimalista.",
          en: "Contemporary Japanese: traditional technique with modern touches in a minimalist space.",
        },
        meta: "Av. das Araucárias, 635 · Águas Claras",
      },
      {
        img: "/media/mandaka.webp",
        title: "Mandaká",
        text: {
          pt: "Bar & cozinha nordestina — a descontração de um bar com grelhados premium.",
          en: "Northeastern-Brazilian bar & kitchen — laid-back vibes with premium grilled dishes.",
        },
        meta: "Max Mall · R. 7 Norte, 01 · Águas Claras",
      },
    ],
  },

  footer: {
    msg: {
      pt: "Esperamos que você desfrute de uma experiência inesquecível.",
      en: "We hope you enjoy an unforgettable stay.",
    },
    whoPrefix: { pt: "Com carinho, ", en: "Warmly, " },
    whoName: "Anna Júlia P. Oliveira",
    phones: "(61) 98250-0188 · (61) 98608-5715",
  },
};
