# Inviato Speciale VR

Giornalismo immersivo in realtà virtuale per la scuola. Lo studente indossa il visore, viene catapultato in un ambiente realistico e diventa l'inviato speciale che deve documentare quello che succede: legge la notizia dal gobbo, in diretta, mentre intorno a lui l'ambiente continua a vivere.

**Apri l'esperienza:** https://layer8panic.github.io/inviatospecialeVR/

## Come si usa con il Meta Quest 3

1. Sul visore apri l'app **Browser**.
2. Vai all'indirizzo qui sopra (conviene salvarlo nei preferiti).
3. Scegli la missione e premi **ENTRA IN VR**, oppure entra in redazione e scegli il mondo puntando gli schermi della parete video.

Non serve installare niente: è una pagina WebXR. L'audio è generato dal browser, quindi tieni il volume del visore acceso.

### Comandi nel visore

| Comando | Azione |
| --- | --- |
| Grilletto (o pizzico con le mani) | premere i pulsanti puntando il raggio |
| Levetta destra | spostarsi in modo fluido nella direzione in cui si guarda |
| Levetta sinistra | girare la visuale in modo continuo, senza scatti; in diretta su/giù scorre il gobbo |
| Tasto Y o B, oppure ≡ MENU sul polso sinistro | menu: riprendi, ricomincia, vai alla diretta, cambia mondo, redazione, esci |
| Tasto laterale (grip) | riportare i pannelli davanti agli occhi |
| Pulsanti sul gobbo | SU, GIÙ, PAUSA/AVVIA, LENTO, VELOCE, HO FINITO |

Dalla pagina iniziale si può entrare direttamente nella missione scelta oppure in **redazione**, dove si sceglie il mondo dentro il visore. A fine missione si passa al mondo successivo con un clic.

## Struttura di ogni missione

1. **Lancio della missione**: la redazione comunica dove si trova lo studente e cosa deve documentare.
2. **Immersione**: almeno 1 minuto (configurabile a 1,5 o 2 minuti) per osservare a 360° e ascoltare.
3. **Telecamera e conto alla rovescia**: appare una telecamera che inquadra lo studente e il cartello «COLLEGAMENTO IN DIRETTA TRA 10, 9, 8…».
4. **Diretta**: accanto all'obiettivo compare il gobbo con titolo, sottotitolo e testo della notizia. Caratteri grandi, alto contrasto, pannello fermo davanti agli occhi, a un'altezza comoda. I suoni ambientali continuano a volume ridotto.
5. **Fine del servizio**: con HO FINITO compare il compito da svolgere in classe, poi si può rifare la missione, cambiarla o tornare in redazione.

## I quattro mondi

- **SPORT – La notte della grande finale**: il Santiago Bernabéu con tre anelli, tetto e maxischermo a 360°, circa 60.000 tifosi animati, striscioni, bandiere, flash dei telefoni, giocatori che si riscaldano, panchine, telecamere e spidercam, cori veri e tamburi.
- **CRONACA – Il Vesuvio si risveglia**: via Caracciolo durante l'evacuazione, colonna di cenere, gente che corre, soccorritori, polizia, tenda della Protezione Civile, elicotteri, boati, sirene e annunci.
- **SCIENZA – Destinazione Marte**: a bordo con gli astronauti in tuta, il decollo trasmesso come in TV sugli schermi di bordo, la Terra che si rimpicciolisce dal finestrino, la Luna, poi l'arrivo su Marte 10 secondi dopo la fine del servizio.
- **BREAKING NEWS – Natale al buio a Times Square**: maxischermi, albero, neve, musica di Natale, taxi, passanti animati, metro, carretto degli hot dog. Poi il blackout: schermi neri, musica interrotta, la gente accende la torcia del telefono, sirene in lontananza.

## Anteprima su schermo

Il pulsante **Anteprima su schermo** fa partire l'esperienza su PC o LIM: si trascina per guardarsi intorno, W A S D o frecce per spostarsi, Q ed E per girarsi, si clicca sui pulsanti. La rotellina scorre il gobbo, `M` o `Esc` aprono il menu.

## Registro

A fine missione la missione svolta viene salvata nel registro della pagina iniziale (solo su quel dispositivo, nel browser).

## Suoni e immagini

- I suoni ambientali sono **registrazioni reali** caricate da archive.org durante l'esperienza (serve internet): curve di stadio, il cratere dell'Etna e un'eruzione vera, traffico e ambulanze di Catania, il mare di Napoli, elicotteri, il conto alla rovescia e il lancio dell'Apollo (NASA, pubblico dominio), una passeggiata registrata a Times Square, sirene della polizia di New York. Se una registrazione non si carica parte un suono sintetico di riserva.
- L'elenco completo con autori e licenze è nella pagina iniziale, alla voce «Crediti di suoni e immagini», e in `js/sounds.js`.
- Texture fotografiche (asfalto, asfalto innevato, pietra, roccia vulcanica, suolo marziano) da [Poly Haven](https://polyhaven.com), CC0. Terra, Luna ed erba dagli esempi di three.js, inclusi nella cartella `assets/`.
- Persone animate: [Quaternius](https://quaternius.com) Animated Men e Animated Women, CC0 (`assets/people/`).

## Dettagli tecnici

- WebXR con [three.js](https://threejs.org/) 0.160 caricato da CDN (jsDelivr).
- Audio spaziale con Web Audio API: ogni sorgente arriva dalla sua direzione (il vulcano, il mare, gli elicotteri, le sirene).
- Persone vicine con scheletro animato, folle lontane come impostor istanziati in un'unica chiamata di disegno.
- Collisioni con muri, arredi, mezzi e persone: non si passa attraverso gli oggetti.
- I pannelli (briefing, gobbo, menu) sono sempre disegnati sopra la scena, così nessun oggetto o persona può coprire il testo.
- Pubblicato con GitHub Pages.

Parametri utili per i test: `?fast` accorcia l'immersione a 8 secondi, `?debug` abilita il tasto `N` per saltare la fase corrente in anteprima.
