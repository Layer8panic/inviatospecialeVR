# Inviato Speciale VR

Giornalismo immersivo in realtà virtuale per la scuola. Lo studente indossa il visore, viene catapultato in un ambiente realistico e diventa l'inviato speciale che deve documentare quello che succede: legge la notizia dal gobbo, in diretta, mentre intorno a lui l'ambiente continua a vivere.

**Apri l'esperienza:** https://layer8panic.github.io/inviatospecialeVR/

## Come si usa con il Meta Quest 3

1. Sul visore apri l'app **Browser**.
2. Vai all'indirizzo qui sopra (conviene salvarlo nei preferiti).
3. Scegli la missione, scrivi il nome dello studente e premi **ENTRA IN VR**.

Non serve installare niente: è una pagina WebXR. L'audio è generato dal browser, quindi tieni il volume del visore acceso.

### Comandi nel visore

| Comando | Azione |
| --- | --- |
| Grilletto (o pizzico con le mani) | premere i pulsanti puntando il raggio |
| Levetta su/giù | scorrere il testo del gobbo |
| Tasto laterale (grip) | riportare i pannelli davanti agli occhi |
| Pulsanti sul gobbo | SU, GIÙ, PAUSA/AVVIA, LENTO, VELOCE, HO FINITO |

## Struttura di ogni missione

1. **Lancio della missione**: la redazione comunica dove si trova lo studente e cosa deve documentare.
2. **Immersione**: almeno 1 minuto (configurabile a 1,5 o 2 minuti) per osservare a 360° e ascoltare.
3. **Telecamera e conto alla rovescia**: appare una telecamera che inquadra lo studente e il cartello «COLLEGAMENTO IN DIRETTA TRA 10, 9, 8…».
4. **Diretta**: accanto all'obiettivo compare il gobbo con titolo, sottotitolo e testo della notizia. Caratteri grandi, alto contrasto, pannello fermo davanti agli occhi, a un'altezza comoda. I suoni ambientali continuano a volume ridotto.
5. **Prova finale**: 5 domande (comprensione, fake news, osservazione) e invito a raccontare l'esperienza alla classe.

## I quattro mondi

- **SPORT – La notte della grande finale**: stadio gremito, Real Madrid contro Barcellona, giocatori che si riscaldano, bandiere, maxischermi, telecamere TV, cori, tamburi, fischi, speaker e telecronaca.
- **CRONACA – Il Vesuvio si risveglia**: Napoli durante un'emergenza vulcanica simulata, colonna di fumo e cenere, mezzi di soccorso, persone che si allontanano, elicotteri, boati, sirene, radio e annunci della Protezione Civile.
- **SCIENZA – Destinazione Marte**: a bordo della navicella con gli astronauti, conto alla rovescia, decollo, la Terra che si allontana dal finestrino, poi arrivo su Marte e atterraggio sul pianeta rosso.
- **BREAKING NEWS – Natale al buio a Times Square**: maxischermi, albero, neve, musica di Natale, taxi e folla. Poi il blackout: schermi neri, musica interrotta, voci, torce dei telefoni e sirene in lontananza.

## Anteprima su schermo

Il pulsante **Anteprima su schermo** fa partire l'esperienza su PC o LIM: si trascina per guardarsi intorno e si clicca sui pulsanti. Rotellina o frecce scorrono il gobbo, `R` riporta i pannelli davanti, `Esc` esce.

## Registro

A fine missione il punteggio viene salvato nel registro della pagina iniziale (solo su quel dispositivo, nel browser).

## Dettagli tecnici

- WebXR con [three.js](https://threejs.org/) 0.160 caricato da CDN (jsDelivr).
- Tutti i suoni (folla, sirene, motori, musica, radio) sono sintetizzati con la Web Audio API, con audio spaziale. Le voci usano la sintesi vocale del browser, dove disponibile.
- Nessuna immagine o file audio esterno: ambienti e testi sono generati nel codice.
- Pubblicato con GitHub Pages dalla radice del branch.

Parametri utili per i test: `?fast` accorcia l'immersione a 8 secondi, `?debug` abilita il tasto `N` per saltare la fase corrente in anteprima.
