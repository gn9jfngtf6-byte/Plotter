// quiz_pow.js — Quizfragen zu den Potenzfunktionen (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).pow = {

    // ───────────────────────── Potenzfunktionen x^n ─────────────────────────
    fam: [
      { l: 1, q: r`Durch welche zwei Punkte gehen alle Graphen von $f(x)=x^n$ (mit natürlichem $n\ge1$)?`, a: [r`Durch $(0\,|\,0)$ und $(1\,|\,1)$`, r`Durch $(0\,|\,1)$ und $(1\,|\,0)$`, r`Durch $(0\,|\,0)$ und $(-1\,|\,1)$`, r`Durch $(1\,|\,1)$ und $(2\,|\,4)$`], e: r`$0^n=0$ und $1^n=1$ für jedes $n$.` },
      { l: 1, q: r`Welche Symmetrie hat der Graph von $x^n$ für gerades $n$?`, a: [r`Achsensymmetrie zur $y$-Achse.`, r`Punktsymmetrie zum Ursprung.`, r`Keine Symmetrie.`, r`Achsensymmetrie zur $x$-Achse.`], e: r`$(-x)^n=x^n$ für gerades $n$.` },
      { l: 1, q: r`Welche Symmetrie hat der Graph von $x^n$ für ungerades $n$?`, a: [r`Punktsymmetrie zum Ursprung.`, r`Achsensymmetrie zur $y$-Achse.`, r`Keine Symmetrie.`, r`Achsensymmetrie zur $x$-Achse.`], e: r`$(-x)^n=-x^n$ für ungerades $n$.` },
      { l: 1, q: r`$f(x)=x^3$. Wie gross ist $f(2)$?`, a: [r`$8$`, r`$6$`, r`$9$`, r`$5$`], e: r`$2\cdot2\cdot2=8$.` },
      { l: 1, q: r`$f(x)=x^4$. Wie gross ist $f(-1)$?`, a: [r`$1$`, r`$-1$`, r`$-4$`, r`$4$`], e: r`Eine gerade Anzahl von Faktoren $-1$ ergibt $+1$.` },
      { l: 1, q: r`Der Graph von $f(x)=x^2$ heisst Normalparabel.`, tf: true, e: r`Sie ist die einfachste Parabel, mit dem Scheitel im Ursprung.` },
      { l: 1, q: r`$f(x)=x^3$. Wie gross ist $f(-2)$?`, a: [r`$-8$`, r`$8$`, r`$-6$`, r`$6$`], e: r`$(-2)\cdot(-2)\cdot(-2)=-8$.` },
      { l: 1, q: r`Welchen Wertebereich hat $x^n$ für gerades $n$?`, a: [r`Alle $y\ge0$`, r`Alle reellen Zahlen`, r`Alle $y>0$`, r`Alle $y\le0$`], e: r`Eine gerade Potenz ist nie negativ.` },
      { l: 1, q: r`Welchen Wertebereich hat $x^n$ für ungerades $n$?`, a: [r`Alle reellen Zahlen`, r`Alle $y\ge0$`, r`Alle $y>0$`, r`Alle $y\neq0$`], e: r`Negative $x$ liefern negative, positive $x$ positive Werte.` },
      { l: 1, q: r`Welcher Wert ist für $0<x<1$ grösser: $x^2$ oder $x^3$?`, a: [r`$x^2$`, r`$x^3$`, r`Beide sind gleich.`, r`Das hängt von $x$ ab.`], e: r`Zum Beispiel $0.5^2=0.25$ und $0.5^3=0.125$: Mit jeder weiteren Multiplikation wird der Wert kleiner.` },
      { l: 1, q: r`Welcher Wert ist für $x>1$ grösser: $x^2$ oder $x^3$?`, a: [r`$x^3$`, r`$x^2$`, r`Beide sind gleich.`, r`Das hängt von $x$ ab.`], e: r`Zum Beispiel $2^2=4$ und $2^3=8$.` },
      { l: 1, q: r`Für ungerades $n$ gilt $(-x)^n=-x^n$.`, tf: true, e: r`Eine ungerade Anzahl von Minuszeichen ergibt ein Minus.` },

      { l: 2, q: r`Durch welchen weiteren Punkt gehen alle Graphen von $x^n$ mit geradem $n$?`, a: [r`Durch $(-1\,|\,1)$`, r`Durch $(-1\,|\,-1)$`, r`Durch $(2\,|\,4)$`, r`Durch $(0\,|\,1)$`], e: r`$(-1)^n=1$ für gerades $n$.` },
      { l: 2, q: r`Durch welchen weiteren Punkt gehen alle Graphen von $x^n$ mit ungeradem $n$?`, a: [r`Durch $(-1\,|\,-1)$`, r`Durch $(-1\,|\,1)$`, r`Durch $(2\,|\,8)$`, r`Durch $(0\,|\,-1)$`], e: r`$(-1)^n=-1$ für ungerades $n$.` },
      { l: 2, q: r`$f(x)=x^4$. Wie gross ist $f(0.5)$?`, a: [r`$0.0625$`, r`$0.25$`, r`$2$`, r`$0.125$`], e: r`$0.5^4=\frac{1}{16}$.` },
      { l: 2, q: r`Wie verändert sich der Graph von $x^n$, wenn $n$ grösser wird?`, a: [r`Zwischen $-1$ und $1$ wird er flacher, ausserhalb steiler.`, r`Er wird überall steiler.`, r`Er wird überall flacher.`, r`Er verschiebt sich nach oben.`], e: r`Zahlen mit Betrag unter 1 werden beim Potenzieren kleiner, Zahlen mit Betrag über 1 grösser.` },
      { l: 2, q: r`Der Graph von $f(x)=x^3$ hat im Ursprung eine waagrechte Tangente.`, tf: true, e: r`Er schmiegt sich dort an die $x$-Achse an (Terrassenpunkt).` },
      { l: 2, q: r`$f(x)=x^3$. Was geschieht mit dem Funktionswert, wenn man $x$ verdoppelt?`, a: [r`Er wird achtmal so gross.`, r`Er wird doppelt so gross.`, r`Er wird sechsmal so gross.`, r`Er wird dreimal so gross.`], e: r`$(2x)^3=8x^3$.` },
      { l: 2, q: r`Wie viele Lösungen hat $x^4=16$?`, a: [r`Zwei.`, r`Eine.`, r`Vier.`, r`Keine.`], e: r`$x=2$ und $x=-2$.` },
      { l: 2, q: r`Wie viele Lösungen hat $x^3=-8$?`, a: [r`Eine.`, r`Zwei.`, r`Drei.`, r`Keine.`], e: r`Nur $x=-2$.` },
      { l: 2, q: r`Welche Potenzfunktionen $x^n$ steigen überall?`, a: [r`Die mit ungeradem $n$.`, r`Die mit geradem $n$.`, r`Alle.`, r`Keine.`], e: r`Für gerades $n$ fällt der Graph links von der $y$-Achse.` },
      { l: 2, q: r`Für $0<x<1$ gilt $x^5<x^2$.`, tf: true, e: r`Je höher der Exponent, desto kleiner die Potenz einer Zahl zwischen 0 und 1.` },

      { l: 3, q: r`Die Kantenlänge eines Würfels wird verdreifacht. Wie ändert sich sein Volumen?`, a: [r`Es wird 27-mal so gross.`, r`Es wird 3-mal so gross.`, r`Es wird 9-mal so gross.`, r`Es wird 6-mal so gross.`], e: r`$V=s^3$, und $(3s)^3=27\,s^3$.` },
      { l: 3, q: r`Wie viele gemeinsame Punkte haben die Graphen von $x^2$ und $x^4$?`, a: [r`Drei.`, r`Zwei.`, r`Einen.`, r`Vier.`], e: r`$x^4=x^2$ ergibt $x^2(x^2-1)=0$, also $x=0$, $x=1$ und $x=-1$.` },
      { l: 3, q: r`Für $f(x)=x^n$ gilt $f(2)=32$. Wie gross ist $n$?`, a: [r`$5$`, r`$4$`, r`$16$`, r`$6$`], e: r`$2^5=32$.` },
      { l: 3, q: r`$x$ wächst um 10 %. Um wie viel Prozent wächst $x^3$?`, a: [r`Um 33.1 %`, r`Um 30 %`, r`Um 10 %`, r`Um 1000 %`], e: r`$1.1^3=1.331$.` },
      { l: 3, q: r`Für alle $x$ gilt $x^4\ge x^2$.`, tf: false, e: r`Zwischen $-1$ und $1$ ist es umgekehrt, zum Beispiel $0.5^4=0.0625<0.25$.` },
      { l: 3, q: r`Welche Steigung hat die Tangente an $f(x)=x^n$ im Punkt $(1\,|\,1)$?`, a: [r`$n$`, r`$1$`, r`$n-1$`, r`$0$`], e: r`$f'(x)=n\,x^{n-1}$, also $f'(1)=n$: Je grösser $n$, desto steiler geht der Graph durch $(1\,|\,1)$.` },
      { l: 3, q: r`$n$ ist gerade, und für $f(x)=x^n$ gilt $f(a)=f(b)$ mit $a\neq b$. Was folgt?`, a: [r`$b=-a$`, r`$b=\frac1a$`, r`$b=a^2$`, r`Das ist nicht möglich.`], e: r`Gleich hohe Punkte liegen symmetrisch zur $y$-Achse.` },
      { l: 3, q: r`Wie sind die Werte für $x=-0.5$ der Grösse nach geordnet?`, a: [r`$x^3<x^4<x^2$`, r`$x^2<x^3<x^4$`, r`$x^4<x^3<x^2$`, r`$x^3<x^2<x^4$`], e: r`$-0.125<0.0625<0.25$.` }
    ],

    // ───────────────────────── Negative Exponenten ─────────────────────────
    neg: [
      { l: 1, q: r`Was bedeutet $x^{-n}$?`, a: [r`$\frac{1}{x^n}$`, r`$-x^n$`, r`$\frac{n}{x}$`, r`$x^n-1$`], e: r`Ein negativer Exponent bedeutet den Kehrwert der Potenz.` },
      { l: 1, q: r`Wie gross ist $2^{-3}$?`, a: [r`$\frac18$`, r`$-8$`, r`$-6$`, r`$\frac16$`], e: r`$\frac{1}{2^3}$.` },
      { l: 1, q: r`Welchen Definitionsbereich hat $f(x)=\frac1x$?`, a: [r`Alle $x\neq0$`, r`Alle reellen Zahlen`, r`Alle $x>0$`, r`Alle $x\ge0$`], e: r`Durch 0 kann man nicht teilen.` },
      { l: 1, q: r`$f(x)=\frac1x$. Wie gross ist $f(4)$?`, a: [r`$0.25$`, r`$4$`, r`$-4$`, r`$0.4$`], e: r`$\frac14=0.25$.` },
      { l: 1, q: r`Wie heisst der Graph von $f(x)=\frac1x$?`, a: [r`Hyperbel`, r`Parabel`, r`Gerade`, r`Ellipse`], e: r`Er besteht aus zwei getrennten Ästen.` },
      { l: 1, q: r`Welche Asymptoten hat der Graph von $f(x)=\frac1x$?`, a: [r`Die $x$-Achse und die $y$-Achse.`, r`Nur die $x$-Achse.`, r`Nur die $y$-Achse.`, r`Die Gerade $y=x$.`], e: r`Er kommt beiden Achsen beliebig nahe, ohne sie zu erreichen.` },
      { l: 1, q: r`$f(x)=\frac1x$ hat eine Nullstelle.`, tf: false, e: r`Ein Bruch mit dem Zähler 1 wird nie 0.` },
      { l: 1, q: r`Welchem Wert nähert sich $\frac1x$, wenn $x$ sehr gross wird?`, a: [r`$0$`, r`$1$`, r`Unendlich`, r`$-1$`], e: r`Der Kehrwert einer grossen Zahl ist klein.` },
      { l: 1, q: r`Wo liegt der Graph von $f(x)=\frac{1}{x^2}$?`, a: [r`Ganz oberhalb der $x$-Achse.`, r`Ganz unterhalb der $x$-Achse.`, r`Links unterhalb, rechts oberhalb.`, r`Auf der $x$-Achse.`], e: r`$x^2$ ist positiv, also auch sein Kehrwert.` },
      { l: 1, q: r`Welche Symmetrie hat der Graph von $f(x)=\frac1x$?`, a: [r`Punktsymmetrie zum Ursprung.`, r`Achsensymmetrie zur $y$-Achse.`, r`Achsensymmetrie zur $x$-Achse.`, r`Keine Symmetrie.`], e: r`$\frac{1}{-x}=-\frac1x$.` },
      { l: 1, q: r`Welche Symmetrie hat der Graph von $f(x)=\frac{1}{x^2}$?`, a: [r`Achsensymmetrie zur $y$-Achse.`, r`Punktsymmetrie zum Ursprung.`, r`Achsensymmetrie zur $x$-Achse.`, r`Keine Symmetrie.`], e: r`$\frac{1}{(-x)^2}=\frac{1}{x^2}$.` },
      { l: 1, q: r`$x^{-1}$ ist dasselbe wie $-x$.`, tf: false, e: r`$x^{-1}=\frac1x$. Der negative Exponent bildet den Kehrwert, nicht die Gegenzahl.` },

      { l: 2, q: r`$f(x)=\frac1x$. Was geschieht mit dem Funktionswert, wenn man $x$ verdoppelt?`, a: [r`Er halbiert sich.`, r`Er verdoppelt sich.`, r`Er wird um 2 kleiner.`, r`Er bleibt gleich.`], e: r`$\frac{1}{2x}=\frac12\cdot\frac1x$.` },
      { l: 2, q: r`$f(x)=\frac{1}{x^2}$. Was geschieht mit dem Funktionswert, wenn man $x$ verdoppelt?`, a: [r`Er wird ein Viertel so gross.`, r`Er halbiert sich.`, r`Er wird viermal so gross.`, r`Er verdoppelt sich.`], e: r`$\frac{1}{(2x)^2}=\frac14\cdot\frac{1}{x^2}$.` },
      { l: 2, q: r`Wie gross ist $10^{-2}$?`, a: [r`$0.01$`, r`$-100$`, r`$-20$`, r`$0.2$`], e: r`$\frac{1}{10^2}=\frac{1}{100}$.` },
      { l: 2, q: r`Wie gross ist $\left(\frac12\right)^{-2}$?`, a: [r`$4$`, r`$\frac14$`, r`$-\frac14$`, r`$-4$`], e: r`Kehrwert bilden, dann quadrieren: $2^2$.` },
      { l: 2, q: r`Wie verhält sich $f(x)=\frac{1}{x^2}$ nahe bei $x=0$?`, a: [r`Auf beiden Seiten wächst es über alle Grenzen.`, r`Links fällt es, rechts wächst es über alle Grenzen.`, r`Es geht gegen 0.`, r`Es geht gegen 1.`], e: r`Der Nenner ist auf beiden Seiten eine kleine positive Zahl.` },
      { l: 2, q: r`Der Graph von $f(x)=\frac1x$ schneidet keine der beiden Achsen.`, tf: true, e: r`$x=0$ ist nicht erlaubt, und der Wert 0 wird nie angenommen.` },
      { l: 2, q: r`Wo schneiden sich die Graphen von $y=\frac1x$ und $y=x$?`, a: [r`In $(1\,|\,1)$ und $(-1\,|\,-1)$`, r`Nur in $(1\,|\,1)$`, r`In $(0\,|\,0)$`, r`Gar nicht`], e: r`$\frac1x=x$ ergibt $x^2=1$.` },
      { l: 2, q: r`Welcher Wert ist bei $x=0.5$ grösser: $\frac1x$ oder $\frac{1}{x^2}$?`, a: [r`$\frac{1}{x^2}$`, r`$\frac1x$`, r`Beide sind gleich.`, r`Beide sind kleiner als 1.`], e: r`$\frac{1}{0.25}=4$ gegen $\frac{1}{0.5}=2$.` },
      { l: 2, q: r`12 Arbeiter brauchen für eine Arbeit 6 Tage. Wie lange brauchen 9 Arbeiter (bei gleichem Tempo)?`, a: [r`$8$ Tage`, r`$4.5$ Tage`, r`$9$ Tage`, r`$3$ Tage`], e: r`Antiproportional: $12\cdot6=72$ Arbeitstage, geteilt durch 9.` },
      { l: 2, q: r`Durch welchen Punkt gehen alle Graphen von $f(x)=x^{-n}$?`, a: [r`Durch $(1\,|\,1)$`, r`Durch $(0\,|\,0)$`, r`Durch $(0\,|\,1)$`, r`Durch $(1\,|\,0)$`], e: r`$1^{-n}=1$.` },

      { l: 3, q: r`Die Anziehungskraft zwischen zwei Körpern ist proportional zu $\frac{1}{r^2}$. Wie ändert sie sich, wenn der Abstand $r$ verdreifacht wird?`, a: [r`Sie wird ein Neuntel so gross.`, r`Sie wird ein Drittel so gross.`, r`Sie wird ein Sechstel so gross.`, r`Sie wird neunmal so gross.`], e: r`$\frac{1}{(3r)^2}=\frac19\cdot\frac{1}{r^2}$.` },
      { l: 3, q: r`Welche Lösungen hat $\frac{1}{x^2}=4$?`, a: [r`$x=\frac12$ und $x=-\frac12$`, r`Nur $x=\frac12$`, r`$x=2$ und $x=-2$`, r`$x=\frac14$`], e: r`$x^2=\frac14$.` },
      { l: 3, q: r`Wie gross ist $4^{-1/2}$?`, a: [r`$\frac12$`, r`$-2$`, r`$2$`, r`$-\frac12$`], e: r`$\frac{1}{\sqrt4}$.` },
      { l: 3, q: r`Aus $a<b$ folgt immer $\frac1a>\frac1b$.`, tf: false, e: r`Das gilt nur, wenn $a$ und $b$ dasselbe Vorzeichen haben. Für $a=-1$, $b=1$ ist $\frac1a=-1<1$.` },
      { l: 3, q: r`Ein Rechteck hat eine Ecke im Ursprung und die gegenüberliegende Ecke auf dem Graphen von $y=\frac1x$ ($x>0$). Wie gross ist seine Fläche?`, a: [r`Immer 1.`, r`Sie wächst mit $x$.`, r`Sie fällt mit $x$.`, r`Immer $\frac12$.`], e: r`Breite mal Höhe: $x\cdot\frac1x=1$.` },
      { l: 3, q: r`Was ist die Gerade $y=-x+2$ für den Graphen von $y=\frac1x$ ($x>0$)?`, a: [r`Eine Tangente im Punkt $(1\,|\,1)$.`, r`Eine Sekante.`, r`Eine Passante.`, r`Eine Asymptote.`], e: r`$\frac1x=-x+2$ ergibt $x^2-2x+1=0$ mit der einzigen Lösung $x=1$.` },
      { l: 3, q: r`Was ergibt $\left(a^{-2}\right)^{-3}$?`, a: [r`$a^6$`, r`$a^{-6}$`, r`$a^{-5}$`, r`$a^5$`], e: r`Exponenten multiplizieren: $(-2)\cdot(-3)=6$.` },
      { l: 3, q: r`Welchen kleinsten Wert nimmt $x+\frac1x$ für $x>0$ an?`, a: [r`$2$`, r`$1$`, r`$0$`, r`Es gibt keinen.`], e: r`$x+\frac1x-2=\frac{(x-1)^2}{x}\ge0$, mit Gleichheit bei $x=1$.` }
    ],

    // ───────────────────────── Wurzelfunktionen und Umkehrung ─────────────────────────
    root: [
      { l: 1, q: r`Von welcher Funktion ist $\sqrt{x}$ die Umkehrfunktion?`, a: [r`Von $x^2$ (für $x\ge0$)`, r`Von $2x$`, r`Von $\frac1x$`, r`Von $x^3$`], e: r`Wurzelziehen macht das Quadrieren rückgängig.` },
      { l: 1, q: r`Wie schreibt man $\sqrt[n]{x}$ als Potenz?`, a: [r`$x^{1/n}$`, r`$x^{-n}$`, r`$x^{n}$`, r`$\frac{x}{n}$`], e: r`Denn $\left(x^{1/n}\right)^n=x^1$.` },
      { l: 1, q: r`Wie gross ist $\sqrt{16}$?`, a: [r`$4$`, r`$8$`, r`$\pm4$`, r`$256$`], e: r`Die Wurzel ist die nichtnegative Zahl, deren Quadrat 16 ist.` },
      { l: 1, q: r`Wie gross ist $\sqrt[3]{27}$?`, a: [r`$3$`, r`$9$`, r`$13.5$`, r`$81$`], e: r`$3^3=27$.` },
      { l: 1, q: r`Wie entsteht der Graph von $\sqrt{x}$ aus dem Graphen von $x^2$ (für $x\ge0$)?`, a: [r`Durch Spiegeln an der Geraden $y=x$.`, r`Durch Spiegeln an der $x$-Achse.`, r`Durch Spiegeln an der $y$-Achse.`, r`Durch Verschieben nach rechts.`], e: r`Bei der Umkehrfunktion tauschen $x$ und $y$ die Rollen.` },
      { l: 1, q: r`Welchen Definitionsbereich hat $f(x)=\sqrt{x}$?`, a: [r`Alle $x\ge0$`, r`Alle reellen Zahlen`, r`Alle $x>0$`, r`Alle $x\neq0$`], e: r`Aus negativen Zahlen gibt es keine reelle Quadratwurzel.` },
      { l: 1, q: r`Wie gross ist $16^{1/4}$?`, a: [r`$2$`, r`$4$`, r`$8$`, r`$64$`], e: r`Die vierte Wurzel: $2^4=16$.` },
      { l: 1, q: r`$\sqrt{x}$ ist nie negativ.`, tf: true, e: r`Die Wurzel ist als nichtnegative Zahl festgelegt.` },
      { l: 1, q: r`$P(3\,|\,9)$ liegt auf dem Graphen von $x^2$. Welcher Punkt liegt dann auf dem Graphen von $\sqrt{x}$?`, a: [r`$(9\,|\,3)$`, r`$(3\,|\,9)$`, r`$(-3\,|\,9)$`, r`$(9\,|\,81)$`], e: r`Spiegeln an $y=x$ vertauscht die Koordinaten.` },
      { l: 1, q: r`Wie gross ist $8^{1/3}$?`, a: [r`$2$`, r`$\frac83$`, r`$4$`, r`$24$`], e: r`Die dritte Wurzel: $2^3=8$.` },
      { l: 1, q: r`Welche Gleichung hat die Winkelhalbierende, an der gespiegelt wird?`, a: [r`$y=x$`, r`$y=-x$`, r`$y=0$`, r`$x=0$`], e: r`Auf ihr sind $x$- und $y$-Koordinate gleich.` },
      { l: 1, q: r`Es gilt $\sqrt{a+b}=\sqrt{a}+\sqrt{b}$.`, tf: false, e: r`Zum Beispiel $\sqrt{9+16}=5$, aber $\sqrt9+\sqrt{16}=7$.` },

      { l: 2, q: r`Wie gross ist $8^{2/3}$?`, a: [r`$4$`, r`$\frac{16}{3}$`, r`$2$`, r`$16$`], e: r`Zuerst die dritte Wurzel, dann quadrieren: $2^2$.` },
      { l: 2, q: r`Was ist $\sqrt{x^2}$ für beliebiges $x$?`, a: [r`$|x|$`, r`$x$`, r`$-x$`, r`$x^2$`], e: r`Für negatives $x$ ist das Ergebnis $-x$, also positiv: zum Beispiel $\sqrt{(-3)^2}=3$.` },
      { l: 2, q: r`Was geschieht mit $\sqrt{x}$, wenn man $x$ vervierfacht?`, a: [r`Der Wert verdoppelt sich.`, r`Der Wert vervierfacht sich.`, r`Der Wert wächst um 2.`, r`Der Wert wird 16-mal so gross.`], e: r`$\sqrt{4x}=2\sqrt{x}$.` },
      { l: 2, q: r`Wird $\sqrt{x}$ beliebig gross, wenn $x$ wächst?`, a: [r`Ja, aber immer langsamer.`, r`Nein, es gibt eine obere Grenze.`, r`Ja, und immer schneller.`, r`Nein, es fällt wieder.`], e: r`Zu jeder Zahl $M$ ist $\sqrt{x}>M$, sobald $x>M^2$ ist.` },
      { l: 2, q: r`Wo schneiden sich die Graphen von $\sqrt{x}$ und $y=x$?`, a: [r`Bei $x=0$ und $x=1$`, r`Nur bei $x=1$`, r`Nur bei $x=0$`, r`Gar nicht`], e: r`$\sqrt{x}=x$ ergibt $x=x^2$.` },
      { l: 2, q: r`Für $0<x<1$ ist $\sqrt{x}>x$.`, tf: true, e: r`Zum Beispiel $\sqrt{0.25}=0.5$.` },
      { l: 2, q: r`Wie lässt sich $\sqrt{50}$ vereinfachen?`, a: [r`$5\sqrt2$`, r`$25\sqrt2$`, r`$2\sqrt5$`, r`$10\sqrt5$`], e: r`$\sqrt{25\cdot2}=\sqrt{25}\cdot\sqrt2$.` },
      { l: 2, q: r`Warum muss man $x^2$ auf $x\ge0$ einschränken, bevor man die Umkehrfunktion bildet?`, a: [r`Weil sonst zu einem Wert zwei Stellen gehören.`, r`Weil $x^2$ für negative $x$ nicht definiert ist.`, r`Weil die Wurzel sonst zu gross wird.`, r`Das ist nicht nötig.`], e: r`$2^2=(-2)^2=4$: Ohne Einschränkung wäre der Rückweg von 4 nicht eindeutig.` },
      { l: 2, q: r`Wie gross ist $27^{-1/3}$?`, a: [r`$\frac13$`, r`$-3$`, r`$-9$`, r`$3$`], e: r`$\frac{1}{\sqrt[3]{27}}$.` },
      { l: 2, q: r`Für $x\ge0$ gilt $\sqrt{x}\cdot\sqrt{x}=x$.`, tf: true, e: r`So ist die Wurzel festgelegt.` },

      { l: 3, q: r`Was ergibt $x^{1/2}\cdot x^{1/3}$?`, a: [r`$x^{5/6}$`, r`$x^{1/6}$`, r`$x^{1/5}$`, r`$x^{2/5}$`], e: r`Exponenten addieren: $\frac12+\frac13=\frac56$.` },
      { l: 3, q: r`Was ist $\sqrt{\sqrt{x}}$?`, a: [r`$x^{1/4}$`, r`$x^{1/2}$`, r`$x$`, r`$x^{2}$`], e: r`$\left(x^{1/2}\right)^{1/2}$: Exponenten multiplizieren.` },
      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=x^3+1$?`, a: [r`$f^{-1}(x)=\sqrt[3]{x-1}$`, r`$f^{-1}(x)=\sqrt[3]{x}-1$`, r`$f^{-1}(x)=\sqrt[3]{x+1}$`, r`$f^{-1}(x)=\frac{1}{x^3+1}$`], e: r`$y=x^3+1$ nach $x$ auflösen: zuerst 1 abziehen, dann die dritte Wurzel ziehen.` },
      { l: 3, q: r`Welche Lösungen hat $\sqrt{x}=x-2$?`, a: [r`Nur $x=4$`, r`$x=1$ und $x=4$`, r`Nur $x=1$`, r`Keine`], e: r`Quadrieren ergibt $x^2-5x+4=0$; $x=1$ fällt bei der Probe weg, denn $\sqrt1\neq-1$.` },
      { l: 3, q: r`Der Graph von $\sqrt{x}$ hat im Ursprung eine senkrechte Tangente.`, tf: true, e: r`Er ist das Spiegelbild der Normalparabel, deren Tangente im Ursprung waagrecht ist.` },
      { l: 3, q: r`Welcher Wert ist für $x=64$ grösser: $\sqrt{x}$ oder $\sqrt[3]{x}$?`, a: [r`$\sqrt{x}$`, r`$\sqrt[3]{x}$`, r`Beide sind gleich.`, r`Das lässt sich nicht sagen.`], e: r`$\sqrt{64}=8$ und $\sqrt[3]{64}=4$. Für $0<x<1$ ist es umgekehrt.` },
      { l: 3, q: r`Was ist $\sqrt[3]{x^6}$?`, a: [r`$x^2$`, r`$x^3$`, r`$x^{18}$`, r`$x^{1/2}$`], e: r`$\left(x^6\right)^{1/3}=x^{6/3}$.` },
      { l: 3, q: r`Ein Würfel soll das doppelte Volumen bekommen. Mit welchem Faktor muss man die Kantenlänge multiplizieren?`, a: [r`Mit $\sqrt[3]{2}\approx1.26$`, r`Mit 2`, r`Mit $\sqrt2\approx1.41$`, r`Mit 8`], e: r`$(k\,s)^3=2\,s^3$ ergibt $k^3=2$.` }
    ],

    // ───────────────────────── Allgemeine Form a·(x−v)^n + h ─────────────────────────
    gen: [
      { l: 1, q: r`Was bewirkt $v$ in $f(x)=a\,(x-v)^n+h$?`, a: [r`Eine Verschiebung um $v$ nach rechts.`, r`Eine Verschiebung um $v$ nach oben.`, r`Eine Streckung mit dem Faktor $v$.`, r`Eine Spiegelung.`], e: r`Die Klammer ist null bei $x=v$.` },
      { l: 1, q: r`Was bewirkt $h$ in $f(x)=a\,(x-v)^n+h$?`, a: [r`Eine Verschiebung um $h$ nach oben.`, r`Eine Verschiebung um $h$ nach rechts.`, r`Eine Streckung mit dem Faktor $h$.`, r`Eine Spiegelung.`], e: r`Zu jedem Funktionswert kommt $h$ dazu.` },
      { l: 1, q: r`Was bewirkt $a$ in $f(x)=a\,(x-v)^n+h$?`, a: [r`Eine Streckung in $y$-Richtung (für $a<0$ mit Spiegelung).`, r`Eine Verschiebung nach rechts.`, r`Eine Verschiebung nach oben.`, r`Eine Änderung des Exponenten.`], e: r`Alle Werte der Grundfunktion werden mit $a$ multipliziert.` },
      { l: 1, q: r`Wie entsteht $f(x)=(x-2)^3$ aus $x^3$?`, a: [r`Durch Verschieben um 2 nach rechts.`, r`Durch Verschieben um 2 nach links.`, r`Durch Verschieben um 2 nach unten.`, r`Durch Strecken mit 2.`], e: r`Die Klammer ist null bei $x=2$.` },
      { l: 1, q: r`Wie entsteht $f(x)=x^2+3$ aus $x^2$?`, a: [r`Durch Verschieben um 3 nach oben.`, r`Durch Verschieben um 3 nach rechts.`, r`Durch Verschieben um 3 nach links.`, r`Durch Strecken mit 3.`], e: r`Jeder Wert wird um 3 grösser.` },
      { l: 1, q: r`Wie entsteht $f(x)=-x^4$ aus $x^4$?`, a: [r`Durch Spiegeln an der $x$-Achse.`, r`Durch Spiegeln an der $y$-Achse.`, r`Durch Verschieben nach unten.`, r`Gar nicht; es ist dieselbe Funktion.`], e: r`Alle Funktionswerte wechseln das Vorzeichen.` },
      { l: 1, q: r`Wohin wird der Ursprung der Grundfunktion bei $f(x)=2\,(x-1)^3+4$ verschoben?`, a: [r`Nach $S(1\,|\,4)$`, r`Nach $S(-1\,|\,4)$`, r`Nach $S(2\,|\,4)$`, r`Nach $S(1\,|\,2)$`], e: r`$v=1$ und $h=4$.` },
      { l: 1, q: r`$f(x)=(x+3)^2$ ist die um 3 nach links verschobene Normalparabel.`, tf: true, e: r`$(x+3)=(x-(-3))$, also $v=-3$.` },
      { l: 1, q: r`$f(x)=3x^2$. Wie gross ist $f(1)$?`, a: [r`$3$`, r`$1$`, r`$9$`, r`$6$`], e: r`Der Punkt $(1\,|\,1)$ der Grundfunktion wird auf $(1\,|\,a)$ gestreckt.` },
      { l: 1, q: r`$f(x)=(x-1)^2+2$. Wie gross ist $f(1)$?`, a: [r`$2$`, r`$1$`, r`$3$`, r`$0$`], e: r`Die Klammer ist null, es bleibt $h=2$.` },
      { l: 1, q: r`Bei welcher Funktion liegt der Punkt $S$ in $(-2\,|\,5)$?`, a: [r`$f(x)=(x+2)^3+5$`, r`$f(x)=(x-2)^3+5$`, r`$f(x)=(x+2)^3-5$`, r`$f(x)=(x-5)^3-2$`], e: r`$v=-2$ ergibt die Klammer $(x+2)$, dahinter $h=5$.` },
      { l: 1, q: r`Der Faktor $a$ verändert die Lage des Punktes $S(v\,|\,h)$ nicht.`, tf: true, e: r`Bei $x=v$ ist die Klammer null, und $a\cdot0=0$.` },

      { l: 2, q: r`$f(x)=2\,(x-1)^3+4$. Wie gross ist $f(2)$?`, a: [r`$6$`, r`$12$`, r`$5$`, r`$20$`], e: r`$2\cdot1^3+4$.` },
      { l: 2, q: r`Welchen Wertebereich hat $f(x)=-(x-3)^4+1$?`, a: [r`Alle $y\le1$`, r`Alle $y\ge1$`, r`Alle $y\le3$`, r`Alle reellen Zahlen`], e: r`$-(x-3)^4$ ist höchstens 0.` },
      { l: 2, q: r`Welche Asymptoten hat $f(x)=\frac{1}{x-2}+1$?`, a: [r`$x=2$ und $y=1$`, r`$x=-2$ und $y=1$`, r`$x=2$ und $y=0$`, r`$x=1$ und $y=2$`], e: r`Die Asymptoten von $\frac1x$ werden mit verschoben: 2 nach rechts, 1 nach oben.` },
      { l: 2, q: r`Welchen Definitionsbereich hat $f(x)=\sqrt{x-3}$?`, a: [r`Alle $x\ge3$`, r`Alle $x\ge0$`, r`Alle $x\ge-3$`, r`Alle $x>3$`], e: r`Die um 3 nach rechts verschobene Wurzelfunktion beginnt bei $x=3$.` },
      { l: 2, q: r`In welchem Punkt beginnt der Graph von $f(x)=\sqrt{x+1}-2$?`, a: [r`In $(-1\,|\,-2)$`, r`In $(1\,|\,-2)$`, r`In $(-1\,|\,2)$`, r`In $(1\,|\,2)$`], e: r`$v=-1$ und $h=-2$.` },
      { l: 2, q: r`Wie entsteht $f(x)=2\,(x-1)^3+4$ aus $x^3$?`, a: [r`Mit 2 strecken, um 1 nach rechts und um 4 nach oben verschieben.`, r`Mit 2 strecken, um 1 nach links und um 4 nach oben verschieben.`, r`Um 2 nach rechts, um 1 nach oben verschieben, mit 4 strecken.`, r`Mit 4 strecken, um 1 nach rechts und um 2 nach oben verschieben.`], e: r`$a=2$, $v=1$, $h=4$.` },
      { l: 2, q: r`$f(x)=(2x)^2$ und $g(x)=4x^2$ sind dieselbe Funktion.`, tf: true, e: r`$(2x)^2=4x^2$: Eine Stauchung in $x$-Richtung wirkt hier wie eine Streckung in $y$-Richtung.` },
      { l: 2, q: r`Welche Nullstelle hat $f(x)=(x-2)^3-8$?`, a: [r`$x=4$`, r`$x=2$`, r`$x=0$`, r`$x=10$`], e: r`$(x-2)^3=8$ ergibt $x-2=2$.` },
      { l: 2, q: r`Welche Nullstellen hat $f(x)=(x-1)^4-16$?`, a: [r`$x=3$ und $x=-1$`, r`Nur $x=3$`, r`$x=5$ und $x=-3$`, r`$x=17$`], e: r`$(x-1)^4=16$ ergibt $x-1=\pm2$.` },
      { l: 2, q: r`Zu welchem Punkt ist der Graph von $f(x)=(x-2)^3+1$ punktsymmetrisch?`, a: [r`Zu $(2\,|\,1)$`, r`Zum Ursprung`, r`Zu $(-2\,|\,1)$`, r`Zu $(1\,|\,2)$`], e: r`Das Symmetriezentrum von $x^3$ wird mit verschoben.` },

      { l: 3, q: r`$f(x)=a\,(x-1)^3+2$ geht durch $(3\,|\,18)$. Wie gross ist $a$?`, a: [r`$a=2$`, r`$a=8$`, r`$a=4$`, r`$a=6$`], e: r`$a\cdot2^3+2=18$ ergibt $8a=16$.` },
      { l: 3, q: r`$f(x)=\frac{a}{x-1}-2$ geht durch $(2\,|\,1)$. Wie gross ist $a$?`, a: [r`$a=3$`, r`$a=1$`, r`$a=-1$`, r`$a=2$`], e: r`$\frac{a}{1}-2=1$.` },
      { l: 3, q: r`Welche Nullstelle hat $f(x)=\frac{2}{x-1}-4$?`, a: [r`$x=1.5$`, r`$x=3$`, r`$x=0.5$`, r`$x=1$`], e: r`$\frac{2}{x-1}=4$ ergibt $x-1=\frac12$.` },
      { l: 3, q: r`$f(x)=-(x-2)^3$ ist dasselbe wie $g(x)=(2-x)^3$.`, tf: true, e: r`$(2-x)^3=\big(-(x-2)\big)^3=-(x-2)^3$, weil der Exponent ungerade ist.` },
      { l: 3, q: r`Der Graph von $f(x)=(x-2)^3$ wird an der $y$-Achse gespiegelt. Welche Funktion entsteht?`, a: [r`$-(x+2)^3$`, r`$(x+2)^3$`, r`$-(x-2)^3$`, r`$(x-2)^3$`], e: r`$x$ wird durch $-x$ ersetzt: $(-x-2)^3=-(x+2)^3$.` },
      { l: 3, q: r`Welchen Definitionsbereich hat $f(x)=\sqrt{4-x}$?`, a: [r`Alle $x\le4$`, r`Alle $x\ge4$`, r`Alle $x\ge-4$`, r`Alle $x\le-4$`], e: r`$4-x\ge0$. Der Graph ist eine gespiegelte Wurzelfunktion, die bei $x=4$ beginnt und nach links läuft.` },
      { l: 3, q: r`Für welches $h$ hat $f(x)=(x-1)^4+h$ genau eine Nullstelle?`, a: [r`$h=0$`, r`$h=1$`, r`$h=-1$`, r`Für kein $h$`], e: r`Für $h<0$ sind es zwei, für $h>0$ keine; bei $h=0$ berührt der Graph die $x$-Achse.` },
      { l: 3, q: r`Wie viele Nullstellen hat $f(x)=a\,(x-v)^n+h$ für ungerades $n$ und $a\neq0$?`, a: [r`Immer genau eine.`, r`Keine, eine oder zwei.`, r`Immer zwei.`, r`Mindestens eine, höchstens $n$.`], e: r`$(x-v)^n=-\frac ha$ hat für ungerades $n$ genau eine Lösung.` }
    ],

    // ───────────────────────── Potenz- und Wurzelgleichungen ─────────────────────────
    eq: [
      { l: 1, q: r`Welche Lösungen hat $x^2=9$?`, a: [r`$3$ und $-3$`, r`Nur $3$`, r`$4.5$`, r`$81$`], e: r`Auch $(-3)^2=9$.` },
      { l: 1, q: r`Welche Lösung hat $x^3=8$?`, a: [r`$2$`, r`$2$ und $-2$`, r`$\frac83$`, r`$512$`], e: r`$2^3=8$; $(-2)^3=-8$ passt nicht.` },
      { l: 1, q: r`Welche reellen Lösungen hat $x^2=-4$?`, a: [r`Keine.`, r`$2$ und $-2$`, r`$-2$`, r`$-16$`], e: r`Ein Quadrat ist nie negativ.` },
      { l: 1, q: r`Welche Lösung hat $x^3=-27$?`, a: [r`$-3$`, r`Keine.`, r`$3$ und $-3$`, r`$-9$`], e: r`$(-3)^3=-27$: Bei ungeradem Exponenten sind negative rechte Seiten möglich.` },
      { l: 1, q: r`Welche Lösung hat $\sqrt{x}=5$?`, a: [r`$25$`, r`$\sqrt5$`, r`$10$`, r`$2.5$`], e: r`Beide Seiten quadrieren.` },
      { l: 1, q: r`Welche Lösungen hat $x^4=16$?`, a: [r`$2$ und $-2$`, r`Nur $2$`, r`$4$ und $-4$`, r`$8$`], e: r`$2^4=(-2)^4=16$.` },
      { l: 1, q: r`Wie liest man die Lösungen von $f(x)=y_0$ am Bild ab?`, a: [r`Als Schnittstellen des Graphen mit der waagrechten Geraden $y=y_0$.`, r`Als Schnittpunkte mit der $y$-Achse.`, r`Als Nullstellen.`, r`Als Hochpunkte.`], e: r`Dort hat $f$ genau den Wert $y_0$.` },
      { l: 1, q: r`Für gerades $n$ und $c>0$ hat $x^n=c$ zwei Lösungen.`, tf: true, e: r`$x=\sqrt[n]{c}$ und $x=-\sqrt[n]{c}$.` },
      { l: 1, q: r`Welche Lösungen hat $\sqrt{x}=-2$?`, a: [r`Keine.`, r`$4$`, r`$-4$`, r`$2$`], e: r`Eine Wurzel ist nie negativ.` },
      { l: 1, q: r`Welche Lösungen hat $2x^2=50$?`, a: [r`$5$ und $-5$`, r`Nur $5$`, r`$25$`, r`$12.5$`], e: r`Zuerst durch 2 teilen: $x^2=25$.` },
      { l: 1, q: r`Wie viele Lösungen hat $x^2=0$?`, a: [r`Eine.`, r`Zwei.`, r`Keine.`, r`Unendlich viele.`], e: r`Nur $x=0$.` },
      { l: 1, q: r`$x^3=c$ hat für jede reelle Zahl $c$ genau eine Lösung.`, tf: true, e: r`Der Graph von $x^3$ steigt überall und nimmt jeden Wert genau einmal an.` },

      { l: 2, q: r`Welche Lösungen hat $(x-1)^2=16$?`, a: [r`$5$ und $-3$`, r`Nur $5$`, r`$4$ und $-4$`, r`$17$`], e: r`$x-1=\pm4$.` },
      { l: 2, q: r`Welche Lösung hat $2x^3+16=0$?`, a: [r`$-2$`, r`$2$`, r`Keine.`, r`$-8$`], e: r`$x^3=-8$.` },
      { l: 2, q: r`Welche Lösung hat $\sqrt{x+3}=4$?`, a: [r`$13$`, r`$1$`, r`$19$`, r`$5$`], e: r`Quadrieren: $x+3=16$.` },
      { l: 2, q: r`Welche reellen Lösungen hat $x^4=-1$?`, a: [r`Keine.`, r`$-1$`, r`$1$ und $-1$`, r`$1$`], e: r`Eine gerade Potenz ist nie negativ.` },
      { l: 2, q: r`Welche Lösungen hat $3\,(x-2)^4=48$?`, a: [r`$4$ und $0$`, r`Nur $4$`, r`$18$ und $-14$`, r`$6$ und $-2$`], e: r`$(x-2)^4=16$ ergibt $x-2=\pm2$.` },
      { l: 2, q: r`Welche Lösung hat $\sqrt{2x-1}=3$?`, a: [r`$5$`, r`$2$`, r`$4$`, r`$10$`], e: r`$2x-1=9$.` },
      { l: 2, q: r`Welche Lösungen hat $\frac{1}{x^2}=4$?`, a: [r`$\frac12$ und $-\frac12$`, r`$2$ und $-2$`, r`Nur $\frac12$`, r`$\frac14$`], e: r`$x^2=\frac14$.` },
      { l: 2, q: r`Beim Quadrieren einer Gleichung können Scheinlösungen entstehen.`, tf: true, e: r`Aus $a^2=b^2$ folgt nicht $a=b$. Deshalb gehört zu Wurzelgleichungen eine Probe.` },
      { l: 2, q: r`Welche Lösung hat $x^5=32$?`, a: [r`$2$`, r`$2$ und $-2$`, r`$6.4$`, r`$16$`], e: r`$2^5=32$; der Exponent ist ungerade, also gibt es nur eine Lösung.` },
      { l: 2, q: r`Welche Lösung hat $(x+1)^3=-8$?`, a: [r`$-3$`, r`$1$`, r`$-9$`, r`Keine.`], e: r`$x+1=-2$.` },

      { l: 3, q: r`Welche Lösungen hat $\sqrt{x+6}=x$?`, a: [r`Nur $x=3$`, r`$3$ und $-2$`, r`Nur $x=-2$`, r`Keine`], e: r`$x^2-x-6=0$ ergibt 3 und $-2$; die Probe scheidet $-2$ aus, denn $\sqrt4\neq-2$.` },
      { l: 3, q: r`Welche Lösungen hat $x^{2/3}=4$?`, a: [r`$8$ und $-8$`, r`Nur $8$`, r`$6$`, r`$\frac83$`], e: r`$\sqrt[3]{x^2}=4$ ergibt $x^2=64$.` },
      { l: 3, q: r`Welche Lösung hat $\sqrt{x}+\sqrt{x+5}=5$?`, a: [r`$4$`, r`$20$`, r`$10$`, r`$0$`], e: r`Probe: $\sqrt4+\sqrt9=2+3$. Die linke Seite steigt mit $x$, also gibt es nur diese Lösung.` },
      { l: 3, q: r`Welche Lösungen hat $x^6-9x^3+8=0$?`, a: [r`$1$ und $2$`, r`$1$ und $8$`, r`$\pm1$ und $\pm2$`, r`Nur $2$`], e: r`Mit $z=x^3$: $z^2-9z+8=0$ ergibt $z=1$ oder $z=8$.` },
      { l: 3, q: r`Die Gleichung $x^2=a^2$ hat nur die Lösung $x=a$.`, tf: false, e: r`Auch $x=-a$ ist eine Lösung.` },
      { l: 3, q: r`Für welche $c$ hat $(x-1)^4+2=c$ zwei Lösungen?`, a: [r`Für $c>2$`, r`Für $c<2$`, r`Für $c=2$`, r`Für alle $c$`], e: r`$(x-1)^4=c-2$ braucht eine positive rechte Seite.` },
      { l: 3, q: r`Welche Lösung hat $\sqrt[3]{x-1}=2$?`, a: [r`$9$`, r`$7$`, r`$5$`, r`$3$`], e: r`Beide Seiten hoch 3: $x-1=8$.` },
      { l: 3, q: r`Welche Lösungen hat $\sqrt{x^2}=3$?`, a: [r`$3$ und $-3$`, r`Nur $3$`, r`$9$`, r`Keine`], e: r`$\sqrt{x^2}=|x|$.` }
    ]
  };
})();
