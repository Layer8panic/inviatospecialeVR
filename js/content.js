// Testi delle missioni: briefing, notizie da leggere in diretta e prova finale.
// Ogni notizia descrive esattamente quello che lo studente vede e sente nel mondo virtuale in quel momento.

export const COMMON_BRIEF =
  'Guardati intorno, ascolta e osserva i dettagli: ti serviranno per la diretta. ' +
  'Tra circa un minuto comparirà una telecamera e leggerai la notizia sul gobbo, il monitor accanto all\'obiettivo.';

export const WORLDS = {
  sport: {
    id: 'sport',
    category: 'SPORT',
    title: 'La notte della grande finale',
    place: 'STADIO – FINALE INTERNAZIONALE',
    color: '#1f8a3b',
    briefing:
      'Sei il nostro inviato speciale a bordo campo. Stasera si gioca la finale internazionale tra Real Madrid e Barcellona ' +
      'e mancano pochi minuti al fischio d\'inizio. Devi documentare l\'evento.',
    news: {
      title: 'IL MONDO DEL CALCIO TRATTIENE IL RESPIRO: TRA POCHI MINUTI LA GRANDE FINALE',
      subtitle: 'Stadio gremito, cori e tamburi sugli spalti, milioni di spettatori davanti agli schermi. Real Madrid e Barcellona si giocano il trofeo.',
      body: [
        'Buonasera da bordo campo. Siamo nello stadio che questa sera ospita la finale internazionale tra Real Madrid e Barcellona. Mancano pochi minuti al fischio d\'inizio.',
        'Le tribune sono piene in ogni settore. Da una parte la curva bianca del Real Madrid, dall\'altra i colori blaugrana del Barcellona. Le bandiere sventolano, i tamburi dettano il ritmo dei cori e sugli spalti parte la ola.',
        'In campo i giocatori stanno completando il riscaldamento: corse leggere, scatti e passaggi. Gli allenatori sono già davanti alle panchine e seguono ogni movimento.',
        'Sopra di noi la telecamera sospesa sui cavi sorvola il campo, mentre i maxischermi annunciano la sfida. Le torri dei riflettori illuminano il prato come se fosse giorno.',
        'La tensione si sente nell\'aria: è una notte che promette emozioni. Da bordo campo è tutto, la linea torna in studio.'
      ]
    },
    quiz: [
      { q: 'Quali squadre giocano la finale?', options: ['Real Madrid e Barcellona', 'Juventus e Milan', 'Real Madrid e Atletico Madrid'], correct: 0, explain: 'La notizia parla della finale internazionale tra Real Madrid e Barcellona.' },
      { q: 'A che punto è la serata quando vai in diretta?', options: ['È finito il primo tempo', 'Mancano pochi minuti al fischio d\'inizio', 'La partita si è chiusa ai rigori'], correct: 1, explain: '«Mancano pochi minuti al fischio d\'inizio».' },
      { q: 'Che cosa stanno facendo i giocatori in campo?', options: ['Stanno festeggiando la vittoria', 'Stanno battendo i rigori', 'Stanno completando il riscaldamento'], correct: 2, explain: '«I giocatori stanno completando il riscaldamento: corse leggere, scatti e passaggi».' },
      { q: 'FAKE NEWS? Un post dice: «Finale rinviata, stadio vuoto per la pioggia». Secondo la tua notizia è…', options: ['Vera, l\'ho letta online', 'Falsa: le tribune sono piene e la partita sta per cominciare', 'Impossibile da capire'], correct: 1, explain: 'Tu eri lì: tribune piene, cori, riscaldamento in corso. Un post senza fonte non basta a renderlo vero.' },
      { q: 'OSSERVAZIONE: che cosa sorvolava il campo, appeso ai cavi?', options: ['Una telecamera sospesa', 'Un elicottero', 'Un pallone aerostatico'], correct: 0, explain: 'Sopra il campo si muoveva la telecamera sospesa sui cavi, usata per le riprese televisive.' }
    ]
  },

  vesuvio: {
    id: 'vesuvio',
    category: 'CRONACA',
    title: 'Il Vesuvio si risveglia: Napoli in allerta',
    place: 'NAPOLI – LUNGOMARE',
    color: '#c2410c',
    briefing:
      'Sei il nostro inviato speciale sul lungomare di Napoli. Il Vesuvio è entrato in eruzione ed è scattata l\'emergenza. ' +
      'È una simulazione a scopo didattico. Devi documentare ciò che sta accadendo.',
    news: {
      title: 'IL VESUVIO SI RISVEGLIA: UNA COLONNA DI FUMO E CENERE SOVRASTA NAPOLI',
      subtitle: 'Boati, colate di lava e sirene sul lungomare. Scatta il piano di emergenza. Lo scenario è una simulazione.',
      body: [
        'Siamo sul lungomare di Napoli. Davanti a noi, dall\'altra parte del golfo, il Vesuvio è in eruzione: una gigantesca colonna di fumo e cenere sale dal cratere e si allarga nel cielo, mentre colate di lava scendono lungo i fianchi del vulcano.',
        'Ogni pochi secondi arriva un boato. Dentro la nube si vedono lampi e fulmini, e una cenere sottile sta già cadendo sulla città.',
        'Sulla strada alle nostre spalle passano ambulanze e mezzi dei vigili del fuoco, della polizia e della Protezione Civile. Due elicotteri sorvolano la zona.',
        'Il piano di emergenza è scattato. Le persone si allontanano a piedi lungo il lungomare, seguendo i percorsi indicati. I pannelli luminosi ripetono le istruzioni: allontanarsi dalla zona rossa e non avvicinarsi al vulcano.',
        'Accanto a noi una squadra di soccorritori è pronta a intervenire. La priorità è una sola: proteggere la popolazione.',
        'Da Napoli è tutto. Continueremo a seguire l\'evolversi dell\'emergenza.'
      ]
    },
    quiz: [
      { q: 'Che cosa sale dal cratere del Vesuvio?', options: ['Una gigantesca colonna di fumo e cenere', 'Un arcobaleno', 'Una nuvola di neve'], correct: 0, explain: '«Una gigantesca colonna di fumo e cenere sale dal cratere».' },
      { q: 'Che cosa scende lungo i fianchi del vulcano?', options: ['Acqua piovana', 'Colate di lava', 'Neve fresca'], correct: 1, explain: '«Colate di lava scendono lungo i fianchi del vulcano».' },
      { q: 'Che cosa ripetono i pannelli luminosi?', options: ['Di avvicinarsi per fare foto', 'Di restare in strada ad aspettare', 'Di allontanarsi dalla zona rossa e non avvicinarsi al vulcano'], correct: 2, explain: 'I pannelli ripetono: allontanarsi dalla zona rossa e non avvicinarsi al vulcano.' },
      { q: 'FAKE NEWS? Ti arriva un messaggio: «Il Vesuvio esploderà stanotte alle 3, me l\'ha detto mio cugino. Condividi!». Cosa fai?', options: ['Lo inoltro a tutti, non si sa mai', 'Non lo condivido e seguo solo le comunicazioni ufficiali', 'Ci credo perché è scritto in maiuscolo'], correct: 1, explain: 'Le informazioni affidabili arrivano dalle fonti ufficiali, come la Protezione Civile. Le voci senza fonte creano panico.' },
      { q: 'OSSERVAZIONE: che cosa sorvolava la zona?', options: ['Due elicotteri', 'Un aereo di linea', 'Una mongolfiera'], correct: 0, explain: 'Sopra il golfo giravano due elicotteri, uno rosso dei vigili del fuoco e uno blu della polizia.' }
    ]
  },

  marte: {
    id: 'marte',
    category: 'SCIENZA',
    title: 'Destinazione Marte: l\'umanità conquista lo spazio',
    place: 'A BORDO DELLA NAVICELLA AURORA',
    color: '#b45309',
    briefing:
      'Sei il nostro inviato speciale a bordo della navicella Aurora, diretta verso Marte. Non guarderai il lancio da lontano: ' +
      'partirai insieme agli astronauti. Ascolta il conto alla rovescia e osserva dai finestrini.',
    news: {
      title: 'DESTINAZIONE MARTE: SIAMO NELLO SPAZIO, UNA NUOVA FRONTIERA SI AVVICINA',
      subtitle: 'Il conto alla rovescia è finito, i motori si sono accesi. La navicella Aurora ha lasciato la Terra.',
      body: [
        'Siamo a bordo della navicella Aurora, diretta verso Marte. Pochi minuti fa abbiamo vissuto il conto alla rovescia, poi l\'accensione dei motori: un rombo fortissimo e le vibrazioni della partenza.',
        'Fuori dai finestrini il cielo è passato dall\'azzurro al nero. Ora vediamo la Terra: un\'immensa sfera blu e bianca che diventa sempre più piccola.',
        'Qui in cabina due astronauti controllano gli strumenti. Sugli schermi scorrono la rotta e la distanza dalla Terra, che cresce di minuto in minuto. Dalla sala di controllo arrivano continue comunicazioni.',
        'La missione ha un obiettivo ambizioso: studiare il pianeta rosso, analizzare il suo terreno e cercare tracce di acqua e condizioni che in passato potrebbero aver favorito la vita.',
        'L\'emozione è enorme, ma la responsabilità lo è ancora di più. Siamo lontani da casa e stiamo scrivendo una nuova pagina della storia dell\'umanità. Dalla navicella Aurora è tutto.'
      ]
    },
    quiz: [
      { q: 'Dove si trova l\'inviato mentre racconta la notizia?', options: ['Nella sala di controllo sulla Terra', 'A bordo della navicella Aurora, diretta verso Marte', 'Sulla Luna'], correct: 1, explain: '«Siamo a bordo della navicella Aurora, diretta verso Marte».' },
      { q: 'Che cosa si vede dai finestrini durante la diretta?', options: ['La Terra che diventa sempre più piccola', 'Il Sole che tramonta sul mare', 'Una città su Marte'], correct: 0, explain: '«Vediamo la Terra: un\'immensa sfera blu e bianca che diventa sempre più piccola».' },
      { q: 'Qual è l\'obiettivo della missione?', options: ['Costruire una città su Marte', 'Portare turisti nello spazio', 'Studiare il pianeta, analizzare il terreno e cercare tracce di acqua'], correct: 2, explain: 'La missione vuole studiare il pianeta rosso, analizzare il terreno e cercare tracce di acqua.' },
      { q: 'FAKE NEWS? Un titolo dice: «Gli astronauti hanno trovato una città aliena su Marte!». Secondo la tua notizia…', options: ['È falso: la missione cerca tracce di acqua e condizioni passate per la vita', 'È vero, lo dice la missione', 'È vero, ma è segreto'], correct: 0, explain: 'La notizia parla di ricerca scientifica, non di alieni. Un titolo sensazionale non è una prova.' },
      { q: 'OSSERVAZIONE: quanti astronauti c\'erano con te in cabina?', options: ['Nessuno', 'Due', 'Cinque'], correct: 1, explain: 'In cabina c\'erano due astronauti davanti alle console.' }
    ]
  },

  times: {
    id: 'times',
    category: 'BREAKING NEWS',
    title: 'Natale al buio a Times Square',
    place: 'NEW YORK – TIMES SQUARE',
    color: '#b91c1c',
    briefing:
      'Sei il nostro inviato speciale a New York. È la sera di Natale e ti trovi nel cuore di Times Square, tra luci, neve e musica. ' +
      'Osserva bene: potrebbe succedere qualcosa all\'improvviso.',
    news: {
      title: 'NATALE AL BUIO A NEW YORK: BLACKOUT NEL CUORE DI TIMES SQUARE',
      subtitle: 'Si spengono all\'improvviso maxischermi, luci e decorazioni. Migliaia di persone restano al buio sotto la neve.',
      body: [
        'Siamo a Times Square, nel cuore di New York. Fino a pochi minuti fa la piazza era accesa da giganteschi schermi pubblicitari, dalle luci dell\'albero di Natale e dalle decorazioni sopra la strada. La musica natalizia accompagnava la neve che cadeva.',
        'Poi, all\'improvviso, il blackout. Gli schermi hanno tremolato e si sono spenti uno dopo l\'altro, la musica si è interrotta e l\'albero è rimasto al buio.',
        'La folla ha reagito con stupore. Molte persone hanno acceso la torcia del telefono per vedere dove camminare. Le uniche luci rimaste sono i fari dei taxi gialli, che continuano a passare lentamente.',
        'In fondo alla strada lampeggiano le auto della polizia e si sentono le sirene. Le prime informazioni parlano di un possibile guasto alla rete elettrica e le squadre tecniche sono già al lavoro.',
        'Le autorità invitano a mantenere la calma e a seguire le indicazioni di sicurezza. Da Times Square è tutto: vi aggiorneremo appena arriveranno nuove informazioni.'
      ]
    },
    quiz: [
      { q: 'Che cosa è successo a Times Square?', options: ['Un grande concerto', 'Una nevicata ha bloccato il traffico', 'Un improvviso blackout'], correct: 2, explain: '«Poi, all\'improvviso, il blackout».' },
      { q: 'Qual è la causa secondo le prime informazioni?', options: ['Un possibile guasto alla rete elettrica', 'Uno sciopero dei tecnici', 'Un fulmine sulla torre principale'], correct: 0, explain: '«Le prime informazioni parlano di un possibile guasto alla rete elettrica».' },
      { q: 'Che cosa hanno acceso molte persone?', options: ['Delle candele', 'La torcia del telefono', 'I fuochi d\'artificio'], correct: 1, explain: '«Molte persone hanno acceso la torcia del telefono per vedere dove camminare».' },
      { q: 'FAKE NEWS? Un post dice: «CONFERMATO: gli hacker hanno spento New York!». Secondo la tua notizia…', options: ['È confermato, lo dice il post', 'È vero perché ha tanti like', 'Non è confermato: si parla solo di un possibile guasto alla rete elettrica'], correct: 2, explain: 'La notizia usa la parola «possibile» e non parla di hacker. «CONFERMATO» in maiuscolo non rende vera un\'informazione.' },
      { q: 'OSSERVAZIONE: quali luci sono rimaste accese dopo il blackout?', options: ['I fari dei taxi e i lampeggianti della polizia', 'I maxischermi pubblicitari', 'Le luci dell\'albero di Natale'], correct: 0, explain: 'Sono rimasti accesi solo i fari dei taxi, le torce dei telefoni e i lampeggianti della polizia.' }
    ]
  }
};

export const WORLD_ORDER = ['sport', 'vesuvio', 'marte', 'times'];

export const STORY_TASK =
  'ULTIMA PROVA: togli il visore e racconta alla classe in 3 frasi che cosa hai visto, che cosa hai sentito e come ti sei sentito come inviato speciale.';
