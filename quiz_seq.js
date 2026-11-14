// quiz_seq.js — Quizfragen zu Folgen und Reihen (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).seq = {

    // ───────────────────────── Folgen: explizit und rekursiv ─────────────────────────
    def: [
      { l: 1, q: r`Was ist eine Folge?`, a: [r`Eine durchnummerierte Liste von Zahlen $a_1, a_2, a_3, \ldots$`, r`Die Summe von Zahlen.`, r`Eine Gleichung mit der Unbekannten $n$.`, r`Eine Menge von Zahlen ohne Reihenfolge.`], e: r`Jedes Glied hat eine Nummer, und die Reihenfolge zählt.` },
      { l: 1, q: r`Es ist $a_n=3n+1$. Wie gross ist $a_4$?`, a: [r`$13$`, r`$12$`, r`$16$`, r`$7$`], e: r`$3\cdot4+1$.` },
      { l: 1, q: r`Was heisst «explizit» bei einer Folge?`, a: [r`Jedes Glied wird direkt aus seiner Nummer $n$ berechnet.`, r`Jedes Glied wird aus seinem Vorgänger berechnet.`, r`Die Glieder werden einzeln aufgezählt.`, r`Die Folge hat nur endlich viele Glieder.`], e: r`Beispiel: $a_n=3n+1$.` },
      { l: 1, q: r`Was heisst «rekursiv» bei einer Folge?`, a: [r`Jedes Glied wird aus seinem Vorgänger berechnet.`, r`Jedes Glied wird direkt aus $n$ berechnet.`, r`Die Glieder werden immer kleiner.`, r`Die Folge wiederholt sich.`], e: r`Beispiel: $a_{n+1}=a_n+3$.` },
      { l: 1, q: r`Es ist $a_1=2$ und $a_{n+1}=a_n+3$. Wie gross ist $a_3$?`, a: [r`$8$`, r`$5$`, r`$11$`, r`$9$`], e: r`$2,\ 5,\ 8$.` },
      { l: 1, q: r`Es ist $a_n=n^2$. Wie gross ist $a_5$?`, a: [r`$25$`, r`$10$`, r`$32$`, r`$7$`], e: r`$5^2$.` },
      { l: 1, q: r`Eine rekursive Regel legt die Folge erst zusammen mit einem Startwert fest.`, tf: true, e: r`Ohne $a_1$ weiss man nicht, wo man beginnt.` },
      { l: 1, q: r`Wie stellt man eine Folge im Koordinatensystem dar?`, a: [r`Als einzelne Punkte $(n\,|\,a_n)$.`, r`Als durchgezogene Kurve.`, r`Als Balken von $a_1$ bis $a_n$.`, r`Als Gerade durch den Ursprung.`], e: r`Es gibt nur Glieder zu ganzen Nummern $n$.` },
      { l: 1, q: r`Wie lauten die ersten vier Glieder von $a_n=2^n$?`, a: [r`$2,\ 4,\ 8,\ 16$`, r`$2,\ 4,\ 6,\ 8$`, r`$1,\ 2,\ 4,\ 8$`, r`$1,\ 4,\ 9,\ 16$`], e: r`$2^1,\ 2^2,\ 2^3,\ 2^4$.` },
      { l: 1, q: r`Wie geht die Folge $5,\ 8,\ 11,\ 14,\ \ldots$ weiter?`, a: [r`$17$`, r`$16$`, r`$18$`, r`$19$`], e: r`Es kommt immer 3 dazu.` },
      { l: 1, q: r`Was bedeutet der Index $n$ in $a_n$?`, a: [r`Die Nummer des Glieds.`, r`Den Wert des Glieds.`, r`Die Anzahl aller Glieder.`, r`Einen Exponenten.`], e: r`$a_7$ ist das siebte Glied.` },
      { l: 1, q: r`Die Punkte einer Folge verbindet man im Bild zu einer durchgezogenen Kurve.`, tf: false, e: r`Zwischen $n=1$ und $n=2$ gibt es kein Glied.` },

      { l: 2, q: r`Welcher Term gehört zur Folge $1,\ 4,\ 9,\ 16,\ \ldots$?`, a: [r`$a_n=n^2$`, r`$a_n=3n-2$`, r`$a_n=2^n$`, r`$a_n=n+3$`], e: r`Es sind die Quadratzahlen.` },
      { l: 2, q: r`Es ist $a_1=1$ und $a_{n+1}=2a_n+1$. Wie gross ist $a_4$?`, a: [r`$15$`, r`$7$`, r`$9$`, r`$31$`], e: r`$1,\ 3,\ 7,\ 15$.` },
      { l: 2, q: r`Welcher explizite Term gehört zu $a_1=2$, $a_{n+1}=a_n+3$?`, a: [r`$a_n=3n-1$`, r`$a_n=3n+2$`, r`$a_n=2n+3$`, r`$a_n=n+3$`], e: r`Die Glieder sind $2,\ 5,\ 8,\ \ldots$; Probe mit $n=1$: $3-1=2$.` },
      { l: 2, q: r`Wie verhält sich die Folge $a_n=(-1)^n$?`, a: [r`Sie springt zwischen $-1$ und $1$ hin und her.`, r`Sie ist konstant $-1$.`, r`Sie wird immer kleiner.`, r`Sie wächst über alle Grenzen.`], e: r`Ungerade Exponenten geben $-1$, gerade geben 1.` },
      { l: 2, q: r`Es ist $a_n=\frac{n}{n+1}$. Wie gross ist $a_9$?`, a: [r`$0.9$`, r`$0.1$`, r`$1.1$`, r`$0.99$`], e: r`$\frac{9}{10}$.` },
      { l: 2, q: r`Welchen Vorteil hat ein expliziter Term?`, a: [r`Man kann $a_{100}$ direkt berechnen, ohne die 99 Glieder davor.`, r`Er ist immer kürzer als die rekursive Regel.`, r`Er braucht keinen Startwert und keine Nummer.`, r`Er gilt auch für negative Nummern.`], e: r`Rekursiv muss man sich Glied für Glied vorarbeiten.` },
      { l: 2, q: r`Es ist $a_1=a_2=1$ und $a_{n+2}=a_{n+1}+a_n$ (Fibonacci). Wie gross ist $a_6$?`, a: [r`$8$`, r`$5$`, r`$13$`, r`$6$`], e: r`$1,\ 1,\ 2,\ 3,\ 5,\ 8$.` },
      { l: 2, q: r`Eine rekursive Regel und ein expliziter Term können dieselbe Folge beschreiben.`, tf: true, e: r`Zum Beispiel $a_{n+1}=a_n+3$ mit $a_1=2$ und $a_n=3n-1$.` },
      { l: 2, q: r`Es ist $a_n=20-3n$. Welches ist das erste negative Glied?`, a: [r`$a_7$`, r`$a_6$`, r`$a_8$`, r`$a_{20}$`], e: r`$a_6=2$ und $a_7=-1$.` },
      { l: 2, q: r`Es ist $a_n=n^2-n$. Welches Glied hat den Wert 30?`, a: [r`$a_6$`, r`$a_5$`, r`$a_{30}$`, r`Keines`], e: r`$36-6=30$.` },

      { l: 3, q: r`Es ist $a_1=2$ und $a_{n+1}=\frac{1}{a_n}$. Wie gross ist $a_{100}$?`, a: [r`$\frac12$`, r`$2$`, r`$\frac{1}{100}$`, r`$\frac{1}{2^{100}}$`], e: r`Die Folge wechselt ab: $2,\ \frac12,\ 2,\ \frac12,\ \ldots$ Gerade Nummern haben den Wert $\frac12$.` },
      { l: 3, q: r`Welcher Term gehört zur Folge $1,\ 3,\ 6,\ 10,\ 15,\ \ldots$?`, a: [r`$a_n=\frac{n\,(n+1)}{2}$`, r`$a_n=n^2-n+1$`, r`$a_n=2n-1$`, r`$a_n=\frac{n^2+1}{2}$`], e: r`Die Zuwächse sind $2,\ 3,\ 4,\ 5$: Es sind die Summen $1+2+\ldots+n$.` },
      { l: 3, q: r`Es ist $a_1=1$ und $a_{n+1}=a_n+2n+1$. Welcher explizite Term gehört dazu?`, a: [r`$a_n=n^2$`, r`$a_n=2n-1$`, r`$a_n=n^2+1$`, r`$a_n=2^n-1$`], e: r`$1,\ 4,\ 9,\ 16$; und $n^2+2n+1=(n+1)^2$.` },
      { l: 3, q: r`Durch die ersten vier Glieder $2,\ 4,\ 8,\ 16$ ist eine Folge eindeutig festgelegt.`, tf: false, e: r`Naheliegend ist $2^n$ mit $a_5=32$. Es gibt aber auch einen Term dritten Grades mit denselben vier Werten, und er liefert $a_5=30$.` },
      { l: 3, q: r`Es ist $a_1=4$ und $a_{n+1}=\frac{a_n}{2}+1$. Welcher Zahl nähern sich die Glieder?`, a: [r`$2$`, r`$0$`, r`$1$`, r`$4$`], e: r`$4,\ 3,\ 2.5,\ 2.25,\ \ldots$ Bei 2 bleibt die Regel stehen: $\frac22+1=2$.` },
      { l: 3, q: r`Wie viele Glieder der Folge $a_n=\frac{100}{n}$ sind grösser als 3?`, a: [r`$33$`, r`$3$`, r`$34$`, r`$97$`], e: r`$\frac{100}{n}>3$ gilt für $n<33.3$.` },
      { l: 3, q: r`Welches ist das kleinste Glied der Folge $a_n=n^2-10n$?`, a: [r`$a_5=-25$`, r`$a_1=-9$`, r`$a_{10}=0$`, r`Es gibt kein kleinstes Glied.`], e: r`Die Punkte liegen auf einer Parabel mit dem Scheitel bei $n=5$.` },
      { l: 3, q: r`Welcher explizite Term gehört zu $a_1=3$, $a_{n+1}=2a_n$?`, a: [r`$a_n=3\cdot2^{n-1}$`, r`$a_n=3\cdot2^n$`, r`$a_n=2\cdot3^{n-1}$`, r`$a_n=6^{n-1}$`], e: r`Von $a_1$ bis $a_n$ wird $(n-1)$-mal verdoppelt.` }
    ],

    // ───────────────────────── Arithmetische Folgen ─────────────────────────
    ari: [
      { l: 1, q: r`Was kennzeichnet eine arithmetische Folge?`, a: [r`Die Differenz benachbarter Glieder ist immer gleich.`, r`Der Quotient benachbarter Glieder ist immer gleich.`, r`Die Glieder werden immer grösser.`, r`Alle Glieder sind ganze Zahlen.`], e: r`Von Glied zu Glied kommt dieselbe Zahl $d$ dazu.` },
      { l: 1, q: r`Welche Differenz $d$ hat die Folge $3,\ 7,\ 11,\ 15,\ \ldots$?`, a: [r`$4$`, r`$3$`, r`$7$`, r`$\frac73$`], e: r`$7-3=11-7=4$.` },
      { l: 1, q: r`Wie lautet der explizite Term einer arithmetischen Folge?`, a: [r`$a_n=a_1+(n-1)\cdot d$`, r`$a_n=a_1+n\cdot d$`, r`$a_n=a_1\cdot d^{\,n-1}$`, r`$a_n=a_1\cdot n+d$`], e: r`Von $a_1$ bis $a_n$ sind es $n-1$ Schritte.` },
      { l: 1, q: r`Es ist $a_1=5$ und $d=3$. Wie gross ist $a_4$?`, a: [r`$14$`, r`$17$`, r`$12$`, r`$15$`], e: r`$5+3\cdot3$.` },
      { l: 1, q: r`Wie lautet die rekursive Regel einer arithmetischen Folge?`, a: [r`$a_{n+1}=a_n+d$`, r`$a_{n+1}=a_n\cdot d$`, r`$a_{n+1}=a_n+n$`, r`$a_{n+1}=d-a_n$`], e: r`Zum Vorgänger kommt $d$ dazu.` },
      { l: 1, q: r`Wie liegen die Punkte $(n\,|\,a_n)$ einer arithmetischen Folge?`, a: [r`Auf einer Geraden.`, r`Auf einer Parabel.`, r`Auf einer Exponentialkurve.`, r`Auf einem Kreis.`], e: r`Gleiche Schritte nach rechts geben gleiche Schritte nach oben.` },
      { l: 1, q: r`Die Folge $2,\ 4,\ 8,\ 16,\ \ldots$ ist arithmetisch.`, tf: false, e: r`Die Differenzen sind $2,\ 4,\ 8$ und damit nicht gleich.` },
      { l: 1, q: r`Welche Differenz $d$ hat die Folge $20,\ 17,\ 14,\ \ldots$?`, a: [r`$-3$`, r`$3$`, r`$-17$`, r`$0.85$`], e: r`$17-20$.` },
      { l: 1, q: r`Es ist $a_1=2$ und $d=5$. Wie gross ist $a_{10}$?`, a: [r`$47$`, r`$52$`, r`$50$`, r`$45$`], e: r`$2+9\cdot5$.` },
      { l: 1, q: r`Wie nennt man das Wachstum einer arithmetischen Folge?`, a: [r`Lineares Wachstum`, r`Exponentielles Wachstum`, r`Quadratisches Wachstum`, r`Beschränktes Wachstum`], e: r`In jedem Schritt kommt gleich viel dazu.` },
      { l: 1, q: r`Was gilt für eine arithmetische Folge mit $d=0$?`, a: [r`Alle Glieder sind gleich.`, r`Alle Glieder sind 0.`, r`Die Glieder wechseln das Vorzeichen.`, r`Eine solche Folge gibt es nicht.`], e: r`Es kommt nichts dazu.` },
      { l: 1, q: r`Bei negativem $d$ werden die Glieder von Schritt zu Schritt kleiner.`, tf: true, e: r`Es wird jedes Mal derselbe Betrag abgezogen.` },

      { l: 2, q: r`Es ist $a_3=10$ und $a_7=22$. Wie gross ist $d$?`, a: [r`$3$`, r`$4$`, r`$12$`, r`$2.4$`], e: r`Vier Schritte bringen 12.` },
      { l: 2, q: r`Es ist $a_3=10$ und $d=3$. Wie gross ist $a_1$?`, a: [r`$4$`, r`$7$`, r`$1$`, r`$16$`], e: r`Zwei Schritte zurück: $10-2\cdot3$.` },
      { l: 2, q: r`Es ist $a_1=7$ und $d=4$. Das wievielte Glied hat den Wert 99?`, a: [r`Das 24.`, r`Das 23.`, r`Das 25.`, r`Das 26.`], e: r`$7+(n-1)\cdot4=99$ ergibt $n-1=23$.` },
      { l: 2, q: r`Es ist $a_n=5n-2$. Wie gross sind $a_1$ und $d$?`, a: [r`$a_1=3$ und $d=5$`, r`$a_1=-2$ und $d=5$`, r`$a_1=5$ und $d=-2$`, r`$a_1=3$ und $d=-2$`], e: r`Der Faktor vor $n$ ist die Differenz; $a_1=5-2$.` },
      { l: 2, q: r`Was gilt in einer arithmetischen Folge für drei aufeinanderfolgende Glieder?`, a: [r`Das mittlere ist der Durchschnitt der beiden äusseren.`, r`Das mittlere ist das Produkt der beiden äusseren.`, r`Das mittlere ist die Differenz der beiden äusseren.`, r`Das mittlere ist die Wurzel aus dem Produkt der beiden äusseren.`], e: r`Daher der Name: arithmetisches Mittel.` },
      { l: 2, q: r`Die Zahlen $4,\ x,\ 16$ bilden eine arithmetische Folge. Wie gross ist $x$?`, a: [r`$10$`, r`$8$`, r`$12$`, r`$6$`], e: r`Die Mitte zwischen 4 und 16.` },
      { l: 2, q: r`Welche Steigung hat die Gerade durch die Punkte $(n\,|\,a_n)$ einer arithmetischen Folge?`, a: [r`$d$`, r`$a_1$`, r`$\frac1d$`, r`$n$`], e: r`Ein Schritt nach rechts, $d$ nach oben.` },
      { l: 2, q: r`Die Folge $a_n=n^2$ ist arithmetisch.`, tf: false, e: r`Die Differenzen $3,\ 5,\ 7,\ \ldots$ wachsen.` },
      { l: 2, q: r`Ein Saal hat in der ersten Reihe 12 Plätze, in jeder weiteren 2 mehr. Wie viele Plätze hat die 15. Reihe?`, a: [r`$40$`, r`$42$`, r`$30$`, r`$38$`], e: r`$12+14\cdot2$.` },
      { l: 2, q: r`Es ist $a_1=100$ und $d=-7$. Welches ist das erste negative Glied?`, a: [r`$a_{16}$`, r`$a_{15}$`, r`$a_{14}$`, r`$a_{17}$`], e: r`$a_{15}=2$ und $a_{16}=-5$.` },

      { l: 3, q: r`Es ist $a_5=20$ und $a_{12}=41$. Wie gross ist $a_{20}$?`, a: [r`$65$`, r`$62$`, r`$68$`, r`$61$`], e: r`Sieben Schritte bringen 21, also $d=3$; dann $41+8\cdot3$.` },
      { l: 3, q: r`Wie viele Vielfache von 7 liegen zwischen 100 und 500?`, a: [r`$57$`, r`$56$`, r`$58$`, r`$71$`], e: r`Von $105=7\cdot15$ bis $497=7\cdot71$: $71-15+1$.` },
      { l: 3, q: r`Die Summe dreier aufeinanderfolgender Glieder einer arithmetischen Folge ist 27. Wie gross ist das mittlere?`, a: [r`$9$`, r`$13.5$`, r`$3$`, r`Das lässt sich nicht sagen.`], e: r`$(m-d)+m+(m+d)=3m$.` },
      { l: 3, q: r`Addiert man zwei arithmetische Folgen Glied für Glied, so entsteht wieder eine arithmetische Folge.`, tf: true, e: r`Die neue Differenz ist die Summe der beiden Differenzen.` },
      { l: 3, q: r`Wie viele Glieder der Folge $3,\ 7,\ 11,\ \ldots$ sind kleiner als 200?`, a: [r`$50$`, r`$49$`, r`$51$`, r`$48$`], e: r`$a_{50}=3+49\cdot4=199$ und $a_{51}=203$.` },
      { l: 3, q: r`Die Winkel eines Dreiecks bilden eine arithmetische Folge, der kleinste misst $40^\circ$. Wie gross ist der grösste?`, a: [r`$80^\circ$`, r`$60^\circ$`, r`$100^\circ$`, r`$70^\circ$`], e: r`Der mittlere Winkel ist ein Drittel von $180^\circ$, also $60^\circ$; damit ist $d=20^\circ$.` },
      { l: 3, q: r`In einer arithmetischen Folge ist $a_1=2$ und $a_1+a_2+a_3=15$. Wie gross ist $d$?`, a: [r`$3$`, r`$5$`, r`$4.5$`, r`$6.5$`], e: r`Die Summe ist $3a_2$, also $a_2=5$.` },
      { l: 3, q: r`Wie viele Zahlen kommen sowohl in der Folge $3,\ 7,\ 11,\ \ldots$ als auch in der Folge $2,\ 8,\ 14,\ \ldots$ vor?`, a: [r`Keine`, r`Genau eine`, r`Jede dritte`, r`Unendlich viele`], e: r`Die erste Folge enthält nur ungerade, die zweite nur gerade Zahlen.` }
    ],

    // ───────────────────────── Geometrische Folgen ─────────────────────────
    geo: [
      { l: 1, q: r`Was kennzeichnet eine geometrische Folge?`, a: [r`Der Quotient benachbarter Glieder ist immer gleich.`, r`Die Differenz benachbarter Glieder ist immer gleich.`, r`Die Glieder sind Quadratzahlen.`, r`Die Glieder wechseln das Vorzeichen.`], e: r`Von Glied zu Glied wird mit derselben Zahl $q$ multipliziert.` },
      { l: 1, q: r`Welchen Quotienten $q$ hat die Folge $3,\ 6,\ 12,\ 24,\ \ldots$?`, a: [r`$2$`, r`$3$`, r`$6$`, r`$\frac12$`], e: r`$\frac63=\frac{12}{6}=2$.` },
      { l: 1, q: r`Wie lautet der explizite Term einer geometrischen Folge?`, a: [r`$a_n=a_1\cdot q^{\,n-1}$`, r`$a_n=a_1\cdot q^{\,n}$`, r`$a_n=a_1+(n-1)\cdot q$`, r`$a_n=(a_1\cdot q)^{n-1}$`], e: r`Von $a_1$ bis $a_n$ wird $(n-1)$-mal mit $q$ multipliziert.` },
      { l: 1, q: r`Es ist $a_1=2$ und $q=3$. Wie gross ist $a_4$?`, a: [r`$54$`, r`$18$`, r`$162$`, r`$24$`], e: r`$2\cdot3^3$.` },
      { l: 1, q: r`Wie lautet die rekursive Regel einer geometrischen Folge?`, a: [r`$a_{n+1}=q\cdot a_n$`, r`$a_{n+1}=a_n+q$`, r`$a_{n+1}=a_n^{\,q}$`, r`$a_{n+1}=q^{\,n}$`], e: r`Der Vorgänger wird mit $q$ multipliziert.` },
      { l: 1, q: r`Die Folge $5,\ 10,\ 15,\ 20,\ \ldots$ ist geometrisch.`, tf: false, e: r`Die Quotienten $2,\ 1.5,\ 1.33\ldots$ sind nicht gleich. Die Folge ist arithmetisch.` },
      { l: 1, q: r`Welchen Quotienten $q$ hat die Folge $80,\ 40,\ 20,\ \ldots$?`, a: [r`$\frac12$`, r`$2$`, r`$-40$`, r`$-\frac12$`], e: r`Jedes Glied ist die Hälfte des vorigen.` },
      { l: 1, q: r`Wie nennt man das Wachstum einer geometrischen Folge mit $a_1>0$ und $q>1$?`, a: [r`Exponentielles Wachstum`, r`Lineares Wachstum`, r`Quadratisches Wachstum`, r`Gleichmässiges Wachstum`], e: r`In jedem Schritt kommt derselbe Prozentsatz dazu.` },
      { l: 1, q: r`Was geschieht mit den Gliedern für $0<q<1$?`, a: [r`Sie nähern sich 0.`, r`Sie wachsen über alle Grenzen.`, r`Sie werden negativ.`, r`Sie bleiben gleich.`], e: r`Jedes Glied ist nur noch ein Bruchteil des vorigen.` },
      { l: 1, q: r`Es ist $a_1=5$ und $q=2$. Wie gross ist $a_5$?`, a: [r`$80$`, r`$160$`, r`$50$`, r`$40$`], e: r`$5\cdot2^4$.` },
      { l: 1, q: r`Was gilt für eine geometrische Folge mit $q=1$?`, a: [r`Alle Glieder sind gleich.`, r`Alle Glieder sind 1.`, r`Die Glieder wachsen um 1.`, r`Eine solche Folge gibt es nicht.`], e: r`Mal 1 ändert nichts.` },
      { l: 1, q: r`Bei negativem $q$ wechseln die Glieder von Schritt zu Schritt das Vorzeichen.`, tf: true, e: r`Zum Beispiel $1,\ -2,\ 4,\ -8$ für $q=-2$.` },

      { l: 2, q: r`In einer geometrischen Folge mit $q>0$ ist $a_2=6$ und $a_4=54$. Wie gross ist $q$?`, a: [r`$3$`, r`$9$`, r`$24$`, r`$4.5$`], e: r`Zwei Schritte: $q^2=\frac{54}{6}=9$.` },
      { l: 2, q: r`Die positiven Zahlen $4,\ x,\ 36$ bilden eine geometrische Folge. Wie gross ist $x$?`, a: [r`$12$`, r`$20$`, r`$9$`, r`$18$`], e: r`$x^2=4\cdot36$: das geometrische Mittel.` },
      { l: 2, q: r`Ein Kapital wächst jedes Jahr um 5 %. Welcher Quotient $q$ gehört dazu?`, a: [r`$1.05$`, r`$0.05$`, r`$5$`, r`$1.5$`], e: r`$100\,\%+5\,\%$.` },
      { l: 2, q: r`1000 Fr. wachsen jedes Jahr um 5 %. Wie viel ist es nach 3 Jahren?`, a: [r`Rund 1158 Fr.`, r`1150 Fr.`, r`1050 Fr.`, r`1500 Fr.`], e: r`$1000\cdot1.05^3$. Der Zins wird mitverzinst.` },
      { l: 2, q: r`Eine Grösse nimmt in jedem Schritt um 20 % ab. Welcher Quotient $q$ gehört dazu?`, a: [r`$0.8$`, r`$0.2$`, r`$-0.2$`, r`$1.2$`], e: r`Es bleiben 80 %.` },
      { l: 2, q: r`Es ist $a_1=3$ und $q=2$. Welches ist das erste Glied über 1000?`, a: [r`$a_{10}$`, r`$a_9$`, r`$a_{11}$`, r`$a_8$`], e: r`$a_9=3\cdot2^8=768$ und $a_{10}=1536$.` },
      { l: 2, q: r`In einer geometrischen Folge mit positiven Gliedern ist jedes Glied das geometrische Mittel seiner beiden Nachbarn.`, tf: true, e: r`$\sqrt{\frac{a}{q}\cdot a\,q}=a$.` },
      { l: 2, q: r`Es ist $a_n=3\cdot2^n$. Wie gross sind $a_1$ und $q$?`, a: [r`$a_1=6$ und $q=2$`, r`$a_1=3$ und $q=2$`, r`$a_1=2$ und $q=3$`, r`$a_1=6$ und $q=3$`], e: r`$a_1=3\cdot2^1$.` },
      { l: 2, q: r`Eine Grösse halbiert sich in jedem Schritt. Nach wie vielen Schritten ist zum ersten Mal weniger als 1 % übrig?`, a: [r`Nach 7 Schritten`, r`Nach 5 Schritten`, r`Nach 6 Schritten`, r`Nach 50 Schritten`], e: r`$\frac{1}{64}\approx1.6\,\%$ und $\frac{1}{128}\approx0.8\,\%$.` },
      { l: 2, q: r`Auf welcher Kurve liegen die Punkte $(n\,|\,a_n)$ einer geometrischen Folge mit $q>0$?`, a: [r`Auf dem Graphen einer Exponentialfunktion.`, r`Auf einer Geraden.`, r`Auf einer Parabel.`, r`Auf einer Hyperbel.`], e: r`$a_n=a_1\cdot q^{\,n-1}$ hat $n$ im Exponenten.` },

      { l: 3, q: r`In einer geometrischen Folge ist $a_3=12$ und $a_6=96$. Wie gross ist $a_1$?`, a: [r`$3$`, r`$6$`, r`$4$`, r`$1.5$`], e: r`Drei Schritte: $q^3=8$, also $q=2$ und $a_1=\frac{12}{4}$.` },
      { l: 3, q: r`Ein 0.1 mm dickes Papier wird (in Gedanken) 20-mal gefaltet. Wie dick ist der Stapel?`, a: [r`Etwa 105 m`, r`2 mm`, r`Etwa 1 m`, r`Etwa 10 m`], e: r`$0.1\,\text{mm}\cdot2^{20}\approx105\,000\,\text{mm}$.` },
      { l: 3, q: r`Auf dem ersten Feld eines Schachbretts liegt 1 Korn, auf jedem weiteren doppelt so viele. Wie viele liegen auf dem 64. Feld?`, a: [r`$2^{63}$`, r`$2^{64}$`, r`$64^2$`, r`$2\cdot64$`], e: r`$a_{64}=1\cdot2^{63}$.` },
      { l: 3, q: r`Addiert man zwei geometrische Folgen Glied für Glied, so entsteht wieder eine geometrische Folge.`, tf: false, e: r`$1,\ 2,\ 4$ und $1,\ 3,\ 9$ ergeben $2,\ 5,\ 13$, und $\frac52\ne\frac{13}{5}$.` },
      { l: 3, q: r`Zwei geometrische Folgen mit den Quotienten $q_1$ und $q_2$ werden Glied für Glied multipliziert. Was entsteht?`, a: [r`Eine geometrische Folge mit dem Quotienten $q_1\cdot q_2$.`, r`Eine geometrische Folge mit dem Quotienten $q_1+q_2$.`, r`Eine arithmetische Folge.`, r`Weder eine arithmetische noch eine geometrische Folge.`], e: r`In jedem Schritt wird mit $q_1$ und mit $q_2$ multipliziert.` },
      { l: 3, q: r`Man bildet von allen Gliedern einer geometrischen Folge (mit positiven Gliedern) den Logarithmus. Was entsteht?`, a: [r`Eine arithmetische Folge.`, r`Eine geometrische Folge.`, r`Eine konstante Folge.`, r`Keine besondere Folge.`], e: r`$\lg\left(a_1q^{\,n-1}\right)=\lg a_1+(n-1)\lg q$.` },
      { l: 3, q: r`Eine Grösse wächst jedes Jahr um 5 %. Nach etwa wie vielen Jahren hat sie sich verdoppelt?`, a: [r`Nach etwa 14 Jahren`, r`Nach 20 Jahren`, r`Nach etwa 10 Jahren`, r`Nach 40 Jahren`], e: r`$1.05^n=2$ ergibt $n=\frac{\ln2}{\ln1.05}\approx14.2$.` },
      { l: 3, q: r`Drei Zahlen bilden eine geometrische Folge, ihr Produkt ist 216. Wie gross ist die mittlere?`, a: [r`$6$`, r`$72$`, r`$36$`, r`Das lässt sich nicht sagen.`], e: r`$\frac{m}{q}\cdot m\cdot m\,q=m^3$.` }
    ],

    // ───────────────────────── Summenzeichen verstehen ─────────────────────────
    sig: [
      { l: 1, q: r`Wie gross ist $\sum_{k=1}^{4}k$?`, a: [r`$10$`, r`$4$`, r`$5$`, r`$24$`], e: r`$1+2+3+4$.` },
      { l: 1, q: r`Was gibt die untere Grenze beim Summenzeichen an?`, a: [r`Bei welchem Wert die Laufvariable beginnt.`, r`Wie viele Summanden es gibt.`, r`Den kleinsten Summanden.`, r`Den Wert der Summe.`], e: r`Unter dem Zeichen steht zum Beispiel $k=1$.` },
      { l: 1, q: r`Wie heisst das $k$ in $\sum_{k=1}^{n}a_k$?`, a: [r`Laufvariable`, r`Summand`, r`Obere Grenze`, r`Exponent`], e: r`Sie läuft von der unteren zur oberen Grenze.` },
      { l: 1, q: r`Wie gross ist $\sum_{k=1}^{3}2k$?`, a: [r`$12$`, r`$6$`, r`$8$`, r`$14$`], e: r`$2+4+6$.` },
      { l: 1, q: r`Wie gross ist $\sum_{k=1}^{5}1$?`, a: [r`$5$`, r`$1$`, r`$15$`, r`$0$`], e: r`Fünfmal der Summand 1.` },
      { l: 1, q: r`Wie viele Summanden hat $\sum_{k=1}^{10}a_k$?`, a: [r`$10$`, r`$9$`, r`$11$`, r`$55$`], e: r`$k$ nimmt die Werte 1 bis 10 an.` },
      { l: 1, q: r`Wie gross ist $\sum_{k=1}^{3}k^2$?`, a: [r`$14$`, r`$36$`, r`$9$`, r`$12$`], e: r`$1+4+9$.` },
      { l: 1, q: r`Es spielt keine Rolle, ob die Laufvariable $k$, $i$ oder $j$ heisst.`, tf: true, e: r`$\sum_{k=1}^{4}k$ und $\sum_{i=1}^{4}i$ sind beide $1+2+3+4$.` },
      { l: 1, q: r`Wie gross ist $\sum_{k=2}^{4}k$?`, a: [r`$9$`, r`$10$`, r`$6$`, r`$7$`], e: r`$2+3+4$.` },
      { l: 1, q: r`Wie schreibt man $1+2+3+\ldots+50$ mit dem Summenzeichen?`, a: [r`$\sum_{k=1}^{50}k$`, r`$\sum_{k=1}^{50}50$`, r`$\sum_{k=0}^{50}1$`, r`$\sum_{k=50}^{1}k$`], e: r`Der Summand ist $k$ selbst.` },
      { l: 1, q: r`Wie gross ist $\sum_{k=0}^{3}2^k$?`, a: [r`$15$`, r`$14$`, r`$16$`, r`$8$`], e: r`$1+2+4+8$. Der erste Summand ist $2^0=1$.` },
      { l: 1, q: r`Die Laufvariable nimmt nur ganze Zahlen an.`, tf: true, e: r`Sie geht in Einerschritten von der unteren zur oberen Grenze.` },

      { l: 2, q: r`Wie viele Summanden hat $\sum_{k=3}^{8}a_k$?`, a: [r`$6$`, r`$5$`, r`$8$`, r`$11$`], e: r`$8-3+1$.` },
      { l: 2, q: r`Wie schreibt man $2+4+6+\ldots+20$ mit dem Summenzeichen?`, a: [r`$\sum_{k=1}^{10}2k$`, r`$\sum_{k=1}^{20}2k$`, r`$\sum_{k=2}^{20}k$`, r`$\sum_{k=1}^{10}(k+2)$`], e: r`Der zehnte Summand ist $2\cdot10=20$.` },
      { l: 2, q: r`Wie schreibt man $1+3+5+7+9$ mit dem Summenzeichen?`, a: [r`$\sum_{k=1}^{5}(2k-1)$`, r`$\sum_{k=1}^{5}(2k+1)$`, r`$\sum_{k=1}^{9}k$`, r`$\sum_{k=1}^{9}(2k-1)$`], e: r`$2k-1$ liefert für $k=1$ bis 5 die ungeraden Zahlen 1 bis 9.` },
      { l: 2, q: r`Wie gross ist $\sum_{k=1}^{4}(k+1)$?`, a: [r`$14$`, r`$11$`, r`$10$`, r`$15$`], e: r`$2+3+4+5$.` },
      { l: 2, q: r`Was ergibt $\sum_{k=1}^{n}c$ für eine feste Zahl $c$?`, a: [r`$n\cdot c$`, r`$c$`, r`$c^n$`, r`$n+c$`], e: r`$n$ gleiche Summanden.` },
      { l: 2, q: r`Was darf man mit einem festen Faktor im Summanden tun?`, a: [r`Man darf ihn vor das Summenzeichen ziehen.`, r`Man darf ihn weglassen.`, r`Man darf ihn zur oberen Grenze addieren.`, r`Man muss ihn potenzieren.`], e: r`Ausklammern: $\sum 3a_k=3\sum a_k$.` },
      { l: 2, q: r`Welche Summe ist dasselbe wie $\sum_{k=3}^{8}(k-2)$?`, a: [r`$\sum_{j=1}^{6}j$`, r`$\sum_{j=1}^{8}j$`, r`$\sum_{j=3}^{8}j$`, r`$\sum_{j=1}^{6}(j-2)$`], e: r`Beide sind $1+2+\ldots+6$: Der Index wurde um 2 verschoben.` },
      { l: 2, q: r`Es gilt $\sum_{k=1}^{3}k^2=\left(\sum_{k=1}^{3}k\right)^2$.`, tf: false, e: r`Links steht 14, rechts $6^2=36$.` },
      { l: 2, q: r`Wie gross ist $\sum_{k=1}^{4}(-1)^k$?`, a: [r`$0$`, r`$-4$`, r`$4$`, r`$-1$`], e: r`$-1+1-1+1$.` },
      { l: 2, q: r`Wie gross ist $\sum_{k=1}^{100}k$?`, a: [r`$5050$`, r`$5000$`, r`$10\,100$`, r`$4950$`], e: r`50 Paare mit der Summe 101.` },

      { l: 3, q: r`Was ergibt $\sum_{k=1}^{n}(2k-1)$?`, a: [r`$n^2$`, r`$n\,(n+1)$`, r`$2n-1$`, r`$n^2-1$`], e: r`Die Summe der ersten $n$ ungeraden Zahlen ist eine Quadratzahl: $1+3=4$, $1+3+5=9$.` },
      { l: 3, q: r`Wie gross ist $\sum_{k=1}^{99}\left(\frac1k-\frac{1}{k+1}\right)$?`, a: [r`$\frac{99}{100}$`, r`$1$`, r`$\frac{1}{100}$`, r`$\frac{98}{99}$`], e: r`Fast alles hebt sich auf, es bleibt $1-\frac{1}{100}$.` },
      { l: 3, q: r`Wie gross ist $\sum_{k=1}^{10}(3k+2)$?`, a: [r`$185$`, r`$167$`, r`$175$`, r`$320$`], e: r`$3\cdot55+10\cdot2$.` },
      { l: 3, q: r`Es gilt $\sum_{k=1}^{n}a_k\,b_k=\left(\sum_{k=1}^{n}a_k\right)\cdot\left(\sum_{k=1}^{n}b_k\right)$.`, tf: false, e: r`Schon für $n=2$: $a_1b_1+a_2b_2$ ist nicht $(a_1+a_2)(b_1+b_2)$.` },
      { l: 3, q: r`Wie viele Summanden hat $\sum_{k=0}^{n}a_k$?`, a: [r`$n+1$`, r`$n$`, r`$n-1$`, r`$2n$`], e: r`Von 0 bis $n$ sind es $n+1$ Zahlen.` },
      { l: 3, q: r`Wie gross ist $\sum_{i=1}^{2}\sum_{j=1}^{3}i\cdot j$?`, a: [r`$18$`, r`$9$`, r`$12$`, r`$36$`], e: r`$(1+2)\cdot(1+2+3)$.` },
      { l: 3, q: r`Wie gross ist $\sum_{k=5}^{20}k$?`, a: [r`$200$`, r`$210$`, r`$205$`, r`$190$`], e: r`$(1+\ldots+20)-(1+\ldots+4)=210-10$.` },
      { l: 3, q: r`Wie schreibt man $\frac12+\frac14+\frac18+\ldots+\frac{1}{1024}$ mit dem Summenzeichen?`, a: [r`$\sum_{k=1}^{10}\frac{1}{2^k}$`, r`$\sum_{k=1}^{1024}\frac1k$`, r`$\sum_{k=1}^{10}\frac{1}{2k}$`, r`$\sum_{k=0}^{10}\frac{1}{2^k}$`], e: r`$1024=2^{10}$, und der erste Summand ist $\frac{1}{2^1}$.` }
    ],

    // ───────────────────────── Arithmetische und geometrische Reihen ─────────────────────────
    sum: [
      { l: 1, q: r`Was bedeutet $s_n$?`, a: [r`Die Summe der ersten $n$ Glieder.`, r`Das $n$-te Glied.`, r`Die Differenz zweier Glieder.`, r`Das Produkt der ersten $n$ Glieder.`], e: r`$s_n=a_1+a_2+\ldots+a_n$.` },
      { l: 1, q: r`Wie lautet die Summenformel der arithmetischen Reihe?`, a: [r`$s_n=\frac{n\,(a_1+a_n)}{2}$`, r`$s_n=n\,(a_1+a_n)$`, r`$s_n=\frac{a_1+a_n}{2}$`, r`$s_n=a_1\cdot\frac{q^n-1}{q-1}$`], e: r`$n$-mal der Durchschnitt aus erstem und letztem Glied.` },
      { l: 1, q: r`Wie gross ist $1+2+3+\ldots+100$?`, a: [r`$5050$`, r`$5000$`, r`$10\,100$`, r`$1000$`], e: r`$\frac{100\cdot101}{2}$.` },
      { l: 1, q: r`Wie lautet die Summenformel der geometrischen Reihe (für $q\ne1$)?`, a: [r`$s_n=a_1\cdot\frac{q^n-1}{q-1}$`, r`$s_n=a_1\cdot q^{\,n-1}$`, r`$s_n=\frac{n\,(a_1+a_n)}{2}$`, r`$s_n=a_1\cdot\frac{q^n}{q-1}$`], e: r`Im Zähler steht $q^n-1$, im Nenner $q-1$.` },
      { l: 1, q: r`Wie gross ist $1+2+4+8$?`, a: [r`$15$`, r`$16$`, r`$14$`, r`$32$`], e: r`$2^4-1$.` },
      { l: 1, q: r`Worin besteht der Trick von Gauss?`, a: [r`Man schreibt die Summe vorwärts und rückwärts untereinander; jede Spalte hat dieselbe Summe.`, r`Man multipliziert alle Glieder miteinander.`, r`Man lässt jedes zweite Glied weg.`, r`Man ersetzt alle Glieder durch das erste.`], e: r`So entstehen $n$ gleiche Paare, und die gesuchte Summe ist die Hälfte davon.` },
      { l: 1, q: r`Wie gross ist $2+4+6+8+10$?`, a: [r`$30$`, r`$20$`, r`$32$`, r`$60$`], e: r`$\frac{5\cdot(2+10)}{2}$.` },
      { l: 1, q: r`Es gilt $s_1=a_1$.`, tf: true, e: r`Die «Summe» besteht aus dem ersten Glied allein.` },
      { l: 1, q: r`Wie gross ist $1+2+3+\ldots+10$?`, a: [r`$55$`, r`$50$`, r`$45$`, r`$100$`], e: r`$\frac{10\cdot11}{2}$.` },
      { l: 1, q: r`Wie gross ist $1+3+9+27$?`, a: [r`$40$`, r`$39$`, r`$81$`, r`$36$`], e: r`$\frac{3^4-1}{3-1}$.` },
      { l: 1, q: r`Was ergibt $s_n-s_{n-1}$?`, a: [r`$a_n$`, r`$a_1$`, r`$d$`, r`$s_1$`], e: r`Die beiden Summen unterscheiden sich nur um das letzte Glied.` },
      { l: 1, q: r`Die Formel $s_n=a_1\cdot\frac{q^n-1}{q-1}$ gilt auch für $q=1$.`, tf: false, e: r`Dann stünde 0 im Nenner. Für $q=1$ sind alle Glieder gleich, und $s_n=n\cdot a_1$.` },

      { l: 2, q: r`Arithmetische Folge mit $a_1=3$ und $d=2$. Wie gross ist $s_{10}$?`, a: [r`$120$`, r`$105$`, r`$240$`, r`$210$`], e: r`$a_{10}=21$, also $\frac{10\cdot(3+21)}{2}$.` },
      { l: 2, q: r`Wie gross ist $1+2+4+\ldots+2^9$?`, a: [r`$1023$`, r`$1024$`, r`$511$`, r`$2047$`], e: r`Zehn Glieder: $2^{10}-1$.` },
      { l: 2, q: r`Was ergibt $1+2+3+\ldots+n$?`, a: [r`$\frac{n\,(n+1)}{2}$`, r`$\frac{n^2}{2}$`, r`$n\,(n+1)$`, r`$\frac{n\,(n-1)}{2}$`], e: r`$n$ Glieder, erstes 1, letztes $n$.` },
      { l: 2, q: r`Wie gross ist $5+10+15+\ldots+100$?`, a: [r`$1050$`, r`$1000$`, r`$2100$`, r`$5050$`], e: r`20 Glieder: $\frac{20\cdot105}{2}$.` },
      { l: 2, q: r`Geometrische Folge mit $a_1=100$ und $q=\frac12$. Wie gross ist $s_4$?`, a: [r`$187.5$`, r`$175$`, r`$200$`, r`$12.5$`], e: r`$100+50+25+12.5$.` },
      { l: 2, q: r`Ein Saal hat in der ersten Reihe 12 Plätze, in jeder weiteren 2 mehr. Wie viele Plätze haben 15 Reihen zusammen?`, a: [r`$390$`, r`$600$`, r`$180$`, r`$420$`], e: r`Letzte Reihe 40 Plätze: $\frac{15\cdot(12+40)}{2}$.` },
      { l: 2, q: r`Wie gross ist die Summe der ersten 10 ungeraden Zahlen?`, a: [r`$100$`, r`$99$`, r`$110$`, r`$81$`], e: r`$1+3+\ldots+19=\frac{10\cdot20}{2}=10^2$.` },
      { l: 2, q: r`Bei einer arithmetischen Reihe ist $s_n$ das $n$-Fache des Durchschnitts aus erstem und letztem Glied.`, tf: true, e: r`Genau das sagt $s_n=n\cdot\frac{a_1+a_n}{2}$.` },
      { l: 2, q: r`Jemand legt im ersten Monat 10 Fr. zur Seite und danach jeden Monat doppelt so viel wie im Monat davor. Wie viel ist es nach 10 Monaten zusammen?`, a: [r`10 230 Fr.`, r`5120 Fr.`, r`1000 Fr.`, r`10 240 Fr.`], e: r`$10\cdot\left(2^{10}-1\right)$.` },
      { l: 2, q: r`Wie gross ist $3+6+12+\ldots+96$?`, a: [r`$189$`, r`$192$`, r`$186$`, r`$288$`], e: r`Sechs Glieder: $3\cdot\left(2^6-1\right)$.` },

      { l: 3, q: r`Wie viele Glieder von $1+2+3+\ldots$ braucht man mindestens, damit die Summe 1000 übertrifft?`, a: [r`$45$`, r`$44$`, r`$32$`, r`$50$`], e: r`$\frac{44\cdot45}{2}=990$ und $\frac{45\cdot46}{2}=1035$.` },
      { l: 3, q: r`Jemand zahlt 10 Jahre lang jeweils am Jahresanfang 1000 Fr. ein, der Zins beträgt 5 %. Wie viel ist es am Ende des 10. Jahres?`, a: [r`Etwa 13 207 Fr.`, r`10 500 Fr.`, r`Etwa 12 578 Fr.`, r`Etwa 16 289 Fr.`], e: r`Geometrische Reihe: $1000\cdot1.05\cdot\frac{1.05^{10}-1}{0.05}$. Die erste Einzahlung wird zehnmal verzinst, die letzte einmal.` },
      { l: 3, q: r`Wie gross ist die Summe aller dreistelligen Zahlen?`, a: [r`$494\,550$`, r`$499\,500$`, r`$450\,000$`, r`$549\,450$`], e: r`900 Zahlen von 100 bis 999: $\frac{900\cdot1099}{2}$.` },
      { l: 3, q: r`Die Summe $1+2+4+\ldots+2^{n-1}$ ist immer um 1 kleiner als die nächste Zweierpotenz $2^n$.`, tf: true, e: r`$\frac{2^n-1}{2-1}=2^n-1$.` },
      { l: 3, q: r`Für eine Folge gilt $s_n=n^2+2n$ für alle $n$. Wie gross ist $a_5$?`, a: [r`$11$`, r`$35$`, r`$12$`, r`$7$`], e: r`$a_5=s_5-s_4=35-24$.` },
      { l: 3, q: r`Ein Ball fällt aus 2 m Höhe und springt jedes Mal auf 60 % der vorigen Höhe zurück. Welchen Weg hat er bis zum dritten Aufprall zurückgelegt?`, a: [r`$5.84$ m`, r`$3.92$ m`, r`$4.40$ m`, r`$7.84$ m`], e: r`$2+2\cdot1.2+2\cdot0.72$: Nach dem ersten Aufprall geht es jeweils hinauf und wieder hinunter.` },
      { l: 3, q: r`Wie gross ist $1-2+4-8+\ldots+256$?`, a: [r`$171$`, r`$-255$`, r`$511$`, r`$85$`], e: r`Neun Glieder mit $q=-2$: $\frac{(-2)^9-1}{-2-1}=\frac{-513}{-3}$.` },
      { l: 3, q: r`Arithmetische Folge mit $a_1=5$ und $d=3$. Wie viele Glieder ergeben zusammen 98?`, a: [r`$7$`, r`$6$`, r`$8$`, r`$14$`], e: r`$5+8+11+14+17+20+23=98$; als Gleichung $\frac{n\,(3n+7)}{2}=98$.` }
    ],

    // ───────────────────────── Grenzwert und unendliche Reihe ─────────────────────────
    lim: [
      { l: 1, q: r`Was ist der Grenzwert einer Folge?`, a: [r`Die Zahl, der die Glieder für grosse $n$ beliebig nahe kommen.`, r`Das grösste Glied der Folge.`, r`Das letzte Glied der Folge.`, r`Die Summe aller Glieder.`], e: r`Eine unendliche Folge hat kein letztes Glied.` },
      { l: 1, q: r`Welchen Grenzwert hat $a_n=\frac1n$?`, a: [r`$0$`, r`$1$`, r`$\infty$`, r`Keinen`], e: r`Die Glieder $1,\ \frac12,\ \frac13,\ \ldots$ werden beliebig klein.` },
      { l: 1, q: r`Wie nennt man eine Folge, die einen Grenzwert hat?`, a: [r`Konvergent`, r`Divergent`, r`Arithmetisch`, r`Alternierend`], e: r`Sie «läuft zusammen» auf eine Zahl.` },
      { l: 1, q: r`Wie nennt man eine Folge, die keinen Grenzwert hat?`, a: [r`Divergent`, r`Konvergent`, r`Konstant`, r`Geometrisch`], e: r`Zum Beispiel $a_n=n$.` },
      { l: 1, q: r`Welchen Grenzwert hat $a_n=\left(\frac12\right)^n$?`, a: [r`$0$`, r`$\frac12$`, r`$1$`, r`Keinen`], e: r`Fortgesetztes Halbieren führt beliebig nahe an 0.` },
      { l: 1, q: r`Wie verhält sich $a_n=n$?`, a: [r`Die Folge wächst über alle Grenzen und hat keinen Grenzwert.`, r`Sie hat den Grenzwert 0.`, r`Sie hat den Grenzwert 1.`, r`Sie hat den Grenzwert $n$.`], e: r`Jede noch so grosse Zahl wird irgendwann überschritten.` },
      { l: 1, q: r`Die Folge $a_n=(-1)^n$ hat den Grenzwert 0.`, tf: false, e: r`Sie springt zwischen $-1$ und 1 und nähert sich keiner Zahl.` },
      { l: 1, q: r`Welchen Grenzwert hat $a_n=3+\frac1n$?`, a: [r`$3$`, r`$4$`, r`$0$`, r`Keinen`], e: r`Der Zusatz $\frac1n$ verschwindet.` },
      { l: 1, q: r`Was ist der $\varepsilon$-Streifen um den Grenzwert $g$?`, a: [r`Der Bereich von $g-\varepsilon$ bis $g+\varepsilon$.`, r`Der Bereich von 0 bis $\varepsilon$.`, r`Der Bereich von $g$ bis $\varepsilon$.`, r`Der Bereich aller Glieder der Folge.`], e: r`Wer im Streifen liegt, ist höchstens $\varepsilon$ vom Grenzwert entfernt.` },
      { l: 1, q: r`Welchen Wert hat $\frac12+\frac14+\frac18+\ldots$?`, a: [r`$1$`, r`$2$`, r`$\frac12$`, r`Keinen, die Summe wächst über alle Grenzen.`], e: r`Jeder Summand halbiert den Rest bis 1.` },
      { l: 1, q: r`Welchen Wert hat die unendliche geometrische Reihe für $|q|<1$?`, a: [r`$\frac{a_1}{1-q}$`, r`$\frac{a_1}{q-1}$`, r`$a_1\cdot(1-q)$`, r`$\frac{1}{1-a_1}$`], e: r`In $a_1\cdot\frac{1-q^n}{1-q}$ verschwindet $q^n$.` },
      { l: 1, q: r`Eine Folge kann sich ihrem Grenzwert nähern, ohne ihn je zu erreichen.`, tf: true, e: r`$\frac1n$ ist für kein $n$ gleich 0.` },

      { l: 2, q: r`Welchen Grenzwert hat $a_n=\frac{2n+1}{n}$?`, a: [r`$2$`, r`$3$`, r`$1$`, r`Keinen`], e: r`$\frac{2n+1}{n}=2+\frac1n$.` },
      { l: 2, q: r`Welchen Grenzwert hat $a_n=\frac{3n^2+1}{n^2+5}$?`, a: [r`$3$`, r`$\frac15$`, r`$\frac46$`, r`Keinen`], e: r`Für grosse $n$ zählen nur die höchsten Potenzen: $\frac{3n^2}{n^2}$.` },
      { l: 2, q: r`Welchen Wert hat $1+\frac13+\frac19+\ldots$?`, a: [r`$\frac32$`, r`$\frac43$`, r`$2$`, r`$3$`], e: r`$\frac{1}{1-\frac13}$.` },
      { l: 2, q: r`Es ist $a_n=\frac1n$ und $\varepsilon=0.01$. Ab welchem Glied liegen alle Glieder näher als $\varepsilon$ beim Grenzwert 0?`, a: [r`Ab $a_{101}$`, r`Ab $a_{100}$`, r`Ab $a_{10}$`, r`Ab $a_{1000}$`], e: r`$\frac1n<0.01$ verlangt $n>100$.` },
      { l: 2, q: r`Für welche $q$ hat die unendliche geometrische Reihe einen Wert?`, a: [r`Für $|q|<1$`, r`Für $q<1$`, r`Für $q>0$`, r`Für alle $q\ne1$`], e: r`Nur dann geht $q^n$ gegen 0. Für $q=-2$ zum Beispiel nicht.` },
      { l: 2, q: r`Welchen Wert hat $0.9+0.09+0.009+\ldots$?`, a: [r`$1$`, r`Etwas weniger als 1`, r`$0.99$`, r`Keinen`], e: r`$\frac{0.9}{1-0.1}$. Darum ist $0.999\ldots=1$.` },
      { l: 2, q: r`Macht man $\varepsilon$ kleiner, so liegt der Index $N$, ab dem alle Glieder im Streifen sind, weiter rechts (oder bleibt gleich).`, tf: true, e: r`In einen schmaleren Streifen gelangen die Glieder später.` },
      { l: 2, q: r`Welchen Grenzwert hat $a_n=\frac{n}{n^2+1}$?`, a: [r`$0$`, r`$1$`, r`$\frac12$`, r`Keinen`], e: r`Der Nenner wächst schneller als der Zähler.` },
      { l: 2, q: r`Hat die geometrische Folge mit $a_1=1$ und $q=1.01$ einen Grenzwert?`, a: [r`Nein, sie wächst über alle Grenzen.`, r`Ja, den Grenzwert 1.01.`, r`Ja, den Grenzwert 100.`, r`Ja, den Grenzwert 1.`], e: r`Auch ein kleiner Zuwachs von 1 % führt mit der Zeit zu beliebig grossen Werten.` },
      { l: 2, q: r`Welchen Wert hat $8+4+2+1+\ldots$?`, a: [r`$16$`, r`$15$`, r`$32$`, r`Keinen`], e: r`$\frac{8}{1-\frac12}$.` },

      { l: 3, q: r`Welchen Wert hat $\frac{3}{10}+\frac{3}{100}+\frac{3}{1000}+\ldots$?`, a: [r`$\frac13$`, r`$0.3$`, r`$\frac{3}{10}$`, r`$\frac{33}{100}$`], e: r`$\frac{0.3}{1-0.1}=\frac{0.3}{0.9}$: Das ist $0.333\ldots$` },
      { l: 3, q: r`Gehen die Summanden gegen 0, so hat die unendliche Reihe einen Wert.`, tf: false, e: r`Gegenbeispiel: $1+\frac12+\frac13+\frac14+\ldots$ wächst über alle Grenzen, obwohl die Summanden gegen 0 gehen.` },
      { l: 3, q: r`Ein Ball fällt aus 2 m Höhe und springt jedes Mal auf 60 % der vorigen Höhe zurück. Welchen Weg legt er insgesamt zurück?`, a: [r`$8$ m`, r`$5$ m`, r`$10$ m`, r`Unendlich viel`], e: r`$2+2\cdot(1.2+0.72+\ldots)=2+2\cdot\frac{1.2}{1-0.6}$.` },
      { l: 3, q: r`Welchen Grenzwert hat $a_n=\left(1+\frac1n\right)^n$?`, a: [r`$e\approx2.718$`, r`$1$`, r`$2$`, r`Keinen, die Folge wächst über alle Grenzen.`], e: r`So ist die Eulersche Zahl definiert.` },
      { l: 3, q: r`Die Folge $a_n=\frac{2n+3}{n+1}$ hat den Grenzwert 2. Ab welchem $n$ ist der Abstand zum Grenzwert kleiner als 0.01?`, a: [r`Ab $n=100$`, r`Ab $n=99$`, r`Ab $n=101$`, r`Ab $n=200$`], e: r`$a_n-2=\frac{1}{n+1}<0.01$ verlangt $n+1>100$.` },
      { l: 3, q: r`Achilles läuft zehnmal so schnell wie die Schildkröte, die 100 m Vorsprung hat. Nach welcher Strecke holt er sie ein?`, a: [r`Nach $111.1\ldots$ m`, r`Nach $110$ m`, r`Nach $200$ m`, r`Nie`], e: r`$100+10+1+0.1+\ldots=\frac{100}{1-0.1}$.` },
      { l: 3, q: r`Eine unendliche geometrische Reihe mit $q=\frac12$ hat den Wert 10. Wie gross ist $a_1$?`, a: [r`$5$`, r`$20$`, r`$10$`, r`$2.5$`], e: r`$\frac{a_1}{1-\frac12}=10$.` },
      { l: 3, q: r`Welcher Bruch ist $0.121212\ldots$?`, a: [r`$\frac{4}{33}$`, r`$\frac{3}{25}$`, r`$\frac{12}{100}$`, r`$\frac{1}{8}$`], e: r`$\frac{12}{100}+\frac{12}{10\,000}+\ldots=\frac{0.12}{1-0.01}=\frac{12}{99}$.` }
    ],

    // ───────────────────────── Vollständige Induktion ─────────────────────────
    ind: [
      { l: 1, q: r`Aus welchen zwei Teilen besteht ein Beweis mit vollständiger Induktion?`, a: [r`Induktionsanfang und Induktionsschritt`, r`Behauptung und Gegenbeispiel`, r`Wertetabelle und Graph`, r`Probe und Rundung`], e: r`Erst der Anfang, dann der Schritt von $n$ auf $n+1$.` },
      { l: 1, q: r`Was zeigt man im Induktionsanfang?`, a: [r`Die Aussage gilt für die erste Zahl, meist $n=1$.`, r`Die Aussage gilt für alle $n$.`, r`Die Aussage gilt für $n+1$.`, r`Die Aussage gilt für grosse $n$.`], e: r`Man setzt die kleinste Zahl ein und rechnet nach.` },
      { l: 1, q: r`Was zeigt man im Induktionsschritt?`, a: [r`Wenn die Aussage für $n$ gilt, dann gilt sie auch für $n+1$.`, r`Die Aussage gilt für $n=1$.`, r`Die Aussage gilt für $n=2$ und $n=3$.`, r`Die Aussage gilt für kein $n$.`], e: r`Von jeder Zahl geht es weiter zur nächsten.` },
      { l: 1, q: r`Was ist die Induktionsvoraussetzung?`, a: [r`Die Annahme, dass die Aussage für $n$ gilt.`, r`Die Behauptung für $n+1$.`, r`Die Rechnung für $n=1$.`, r`Die Aussage, die man widerlegen will.`], e: r`Auf sie stützt man sich im Induktionsschritt.` },
      { l: 1, q: r`Mit welchem Bild veranschaulicht man die vollständige Induktion?`, a: [r`Mit einer Reihe von Dominosteinen.`, r`Mit einer Waage.`, r`Mit einem Würfel.`, r`Mit einem Kreis.`], e: r`Fällt der erste Stein und wirft jeder den nächsten um, so fallen alle.` },
      { l: 1, q: r`Für welche Zahlen beweist die vollständige Induktion eine Aussage?`, a: [r`Für alle natürlichen Zahlen ab dem Startwert.`, r`Für alle reellen Zahlen.`, r`Nur für die geprüften Beispiele.`, r`Nur für gerade Zahlen.`], e: r`Der Schritt führt von jeder natürlichen Zahl zur nächsten.` },
      { l: 1, q: r`Hat man eine Aussage für $n=1$, 2 und 3 nachgerechnet, so ist sie für alle $n$ bewiesen.`, tf: false, e: r`Beispiele beweisen nichts; es braucht den Schritt von $n$ auf $n+1$.` },
      { l: 1, q: r`Was prüft man im Induktionsanfang für $1+2+\ldots+n=\frac{n\,(n+1)}{2}$?`, a: [r`Für $n=1$: links 1, rechts $\frac{1\cdot2}{2}=1$.`, r`Für $n=0$: links 1, rechts 0.`, r`Für $n=1$: links 1, rechts 2.`, r`Dass $n$ eine gerade Zahl ist.`], e: r`Beide Seiten stimmen überein.` },
      { l: 1, q: r`Was entspricht bei den Dominosteinen dem Induktionsanfang?`, a: [r`Der erste Stein fällt.`, r`Alle Steine stehen.`, r`Der letzte Stein fällt.`, r`Die Steine sind gleich gross.`], e: r`Ohne Anstoss fällt nichts.` },
      { l: 1, q: r`Was entspricht bei den Dominosteinen dem Induktionsschritt?`, a: [r`Jeder fallende Stein wirft den nächsten um.`, r`Der erste Stein fällt.`, r`Die Steine stehen in einer geraden Reihe.`, r`Es gibt nur endlich viele Steine.`], e: r`Die Steine stehen nahe genug beieinander.` },
      { l: 1, q: r`Ohne Induktionsanfang ist der Beweis unvollständig.`, tf: true, e: r`Der Schritt allein sagt nur «wenn …, dann …».` },
      { l: 1, q: r`Welche Aussagen beweist man mit vollständiger Induktion?`, a: [r`Aussagen, die von einer natürlichen Zahl $n$ abhängen.`, r`Aussagen über Winkel.`, r`Aussagen über eine einzige Zahl.`, r`Aussagen über Dezimalbrüche.`], e: r`Zum Beispiel Summenformeln, die für alle $n$ gelten sollen.` },

      { l: 2, q: r`Was addiert man im Induktionsschritt für $1+2+\ldots+n=\frac{n\,(n+1)}{2}$ auf beiden Seiten?`, a: [r`Das nächste Glied $n+1$`, r`Die Zahl 1`, r`Das Glied $n$`, r`Den Faktor 2`], e: r`So steht links die Summe bis $n+1$.` },
      { l: 2, q: r`Wie lautet die Behauptung für $n+1$ bei $1+2+\ldots+n=\frac{n\,(n+1)}{2}$?`, a: [r`$1+2+\ldots+(n+1)=\frac{(n+1)(n+2)}{2}$`, r`$1+2+\ldots+(n+1)=\frac{n\,(n+1)}{2}+1$`, r`$1+2+\ldots+(n+1)=\frac{(n+1)^2}{2}$`, r`$1+2+\ldots+(n+1)=\frac{n\,(n+2)}{2}$`], e: r`Überall wird $n$ durch $n+1$ ersetzt.` },
      { l: 2, q: r`Warum folgt aus $2^n>n$ auch $2^{n+1}>n+1$?`, a: [r`Weil $2^{n+1}=2\cdot2^n>2n\ge n+1$ ist.`, r`Weil $2^{n+1}=2^n+1$ ist.`, r`Weil man auf beiden Seiten 1 addiert.`, r`Weil $n+1$ immer gerade ist.`], e: r`Verdoppeln bringt mindestens so viel wie «plus 1», sobald $n\ge1$ ist.` },
      { l: 2, q: r`Die Aussage $2^n\ge n^2$ gilt erst ab $n=4$. Wo setzt man den Induktionsanfang?`, a: [r`Bei $n=4$`, r`Bei $n=1$`, r`Bei $n=0$`, r`Einen Anfang braucht es dann nicht.`], e: r`Der Anfang muss nicht bei 1 liegen; die Aussage ist dann für alle $n\ge4$ bewiesen.` },
      { l: 2, q: r`Im Induktionsschritt darf man die Aussage für $n$ verwenden.`, tf: true, e: r`Das ist die Induktionsvoraussetzung.` },
      { l: 2, q: r`Der Term $n^2-n+41$ liefert für $n=1$ bis 40 lauter Primzahlen. Was folgt daraus?`, a: [r`Nichts: Für $n=41$ ergibt er $41^2$, keine Primzahl.`, r`Er liefert für alle $n$ Primzahlen.`, r`Er liefert für alle ungeraden $n$ Primzahlen.`, r`Er liefert ab $n=41$ nur noch gerade Zahlen.`], e: r`$41^2-41+41=41^2$. Vierzig Beispiele sind kein Beweis.` },
      { l: 2, q: r`Die Dominosteine stehen so, dass jeder den nächsten umwerfen würde, aber niemand stösst den ersten an. Was geschieht?`, a: [r`Kein Stein fällt.`, r`Alle Steine fallen.`, r`Nur der erste Stein fällt.`, r`Jeder zweite Stein fällt.`], e: r`Der Schritt ist da, der Anfang fehlt.` },
      { l: 2, q: r`Was kommt im Induktionsschritt für $1+3+5+\ldots+(2n-1)=n^2$ auf beiden Seiten dazu?`, a: [r`$2n+1$`, r`$2n-1$`, r`$n+1$`, r`$2n$`], e: r`Die nächste ungerade Zahl; rechts wird daraus $n^2+2n+1=(n+1)^2$.` },
      { l: 2, q: r`Man will beweisen, dass $n^3-n$ für alle $n$ durch 3 teilbar ist. Was prüft man im Induktionsanfang?`, a: [r`Für $n=1$: $1-1=0$ ist durch 3 teilbar.`, r`Für $n=1$: 1 ist durch 3 teilbar.`, r`Für $n=3$: 3 ist durch 3 teilbar.`, r`Nichts, die Aussage beginnt erst bei $n=2$.`], e: r`0 ist durch jede Zahl teilbar.` },
      { l: 2, q: r`Ein Induktionsbeweis sichert die Aussage auch für $n=1\,000\,000$, obwohl man diesen Fall nie einzeln nachrechnet.`, tf: true, e: r`Vom Anfang führt der Schritt in einer Kette bis zu jeder natürlichen Zahl.` },

      { l: 3, q: r`Ein bekannter Scheinbeweis «zeigt» mit Induktion, dass alle Pferde dieselbe Farbe haben. Wo steckt der Fehler?`, a: [r`Der Schritt von einem Pferd auf zwei Pferde gelingt nicht.`, r`Der Induktionsanfang mit einem Pferd ist falsch.`, r`Induktion ist nur für Formeln erlaubt.`, r`Der Schritt misslingt erst bei sehr vielen Pferden.`], e: r`Der Schritt braucht zwei Teilgruppen, die sich überschneiden. Bei zwei Pferden haben die Teilgruppen kein gemeinsames Pferd.` },
      { l: 3, q: r`Für die (falsche) Aussage «$n=n+1$» gelingt der Induktionsschritt.`, tf: true, e: r`Aus $n=n+1$ folgt durch «plus 1» sofort $n+1=n+2$. Es gibt aber keinen Anfang, darum beweist der Schritt nichts.` },
      { l: 3, q: r`Welche Formel gilt für $1^2+2^2+\ldots+n^2$?`, a: [r`$\frac{n\,(n+1)(2n+1)}{6}$`, r`$\frac{n^2\,(n+1)}{2}$`, r`$\frac{n\,(n+1)^2}{4}$`, r`$\left(\frac{n\,(n+1)}{2}\right)^2$`], e: r`Für $n=1$ liefern alle vier den Wert 1. Erst $n=2$ mit der Summe 5 trennt sie.` },
      { l: 3, q: r`$n$ Geraden teilen die Ebene in höchstens $\frac{n^2+n+2}{2}$ Gebiete. Wie viele Gebiete kommen dazu, wenn zu $n$ Geraden eine weitere kommt?`, a: [r`$n+1$`, r`$n$`, r`$2n$`, r`$2$`], e: r`Die neue Gerade wird von den $n$ alten in $n+1$ Stücke zerlegt, und jedes Stück teilt ein Gebiet.` },
      { l: 3, q: r`Für die Türme von Hanoi mit $n$ Scheiben braucht man $T(n)=2^n-1$ Züge. Welche Beziehung trägt den Induktionsschritt?`, a: [r`$T(n+1)=2\cdot T(n)+1$`, r`$T(n+1)=T(n)+2$`, r`$T(n+1)=2\cdot T(n)$`, r`$T(n+1)=T(n)^2$`], e: r`$n$ Scheiben wegräumen, die grösste versetzen, $n$ Scheiben daraufsetzen: $2\,(2^n-1)+1=2^{n+1}-1$.` },
      { l: 3, q: r`Mit vollständiger Induktion findet man Formeln, die man vorher nicht kannte.`, tf: false, e: r`Man braucht zuerst eine Vermutung. Die Induktion bestätigt sie, findet sie aber nicht.` },
      { l: 3, q: r`Ab welchem $n$ gilt $2^n>n^2$ für alle folgenden $n$?`, a: [r`Ab $n=5$`, r`Ab $n=1$`, r`Ab $n=3$`, r`Ab $n=4$`], e: r`Für $n=1$ stimmt es, für $n=2$, 3 und 4 nicht ($16>16$ ist falsch). Der Anfang liegt bei $32>25$.` },
      { l: 3, q: r`Verbindet man $n$ Punkte auf einem Kreis paarweise, so entstehen für $n=1$ bis 5 höchstens $1,\ 2,\ 4,\ 8,\ 16$ Gebiete. Wie viele sind es höchstens für $n=6$?`, a: [r`$31$`, r`$32$`, r`$30$`, r`$64$`], e: r`Das Muster der Zweierpotenzen bricht ab. Ein Muster in den ersten Fällen ist kein Beweis.` }
    ]
  };
})();
