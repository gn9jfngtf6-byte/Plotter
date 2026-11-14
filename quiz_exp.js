// quiz_exp.js — Quizfragen zu Exponential- und Logarithmusfunktionen (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).exp = {

    // ───────────────────────── Wachstum und Zerfall a·b^x ─────────────────────────
    grow: [
      { l: 1, q: r`Was bedeutet $a$ in $f(x)=a\cdot b^x$?`, a: [r`Den Anfangswert $f(0)$.`, r`Den Wachstumsfaktor.`, r`Die Steigung.`, r`Die Verdopplungszeit.`], e: r`$f(0)=a\cdot b^0=a$.` },
      { l: 1, q: r`Was bedeutet $b$ in $f(x)=a\cdot b^x$?`, a: [r`Den Faktor, mit dem der Wert pro Schritt 1 multipliziert wird.`, r`Den Anfangswert.`, r`Den Betrag, der pro Schritt dazukommt.`, r`Den $y$-Achsenabschnitt.`], e: r`$f(x+1)=a\cdot b^x\cdot b=f(x)\cdot b$.` },
      { l: 1, q: r`Wie verhält sich $f(x)=a\cdot b^x$ (mit $a>0$) für $b>1$?`, a: [r`Die Funktion wächst.`, r`Die Funktion fällt.`, r`Die Funktion ist konstant.`, r`Die Funktion schwankt.`], e: r`Jeder Schritt multipliziert mit einer Zahl grösser als 1.` },
      { l: 1, q: r`Wie verhält sich $f(x)=a\cdot b^x$ (mit $a>0$) für $0<b<1$?`, a: [r`Die Funktion fällt (Zerfall).`, r`Die Funktion wächst.`, r`Die Funktion ist konstant.`, r`Die Funktion wird negativ.`], e: r`Jeder Schritt multipliziert mit einer Zahl kleiner als 1.` },
      { l: 1, q: r`$f(x)=3\cdot2^x$. Wie gross ist $f(0)$?`, a: [r`$3$`, r`$6$`, r`$0$`, r`$1$`], e: r`$2^0=1$.` },
      { l: 1, q: r`$f(x)=3\cdot2^x$. Wie gross ist $f(3)$?`, a: [r`$24$`, r`$18$`, r`$216$`, r`$9$`], e: r`$3\cdot2^3=3\cdot8$. Zuerst die Potenz, dann die Multiplikation.` },
      { l: 1, q: r`Was geschieht bei exponentiellem Wachstum bei jedem Schritt um 1?`, a: [r`Der Wert wird mit demselben Faktor multipliziert.`, r`Es kommt derselbe Betrag dazu.`, r`Der Wert wird quadriert.`, r`Der Wert verdoppelt sich immer.`], e: r`Gleicher Faktor pro Schritt: Das unterscheidet exponentielles von linearem Wachstum.` },
      { l: 1, q: r`Bei exponentiellem Wachstum kommt pro Schritt immer gleich viel dazu.`, tf: false, e: r`Das ist lineares Wachstum. Exponentiell heisst: gleicher Faktor, also immer grössere Zunahmen.` },
      { l: 1, q: r`$f(x)=100\cdot0.5^x$. Wie gross ist $f(2)$?`, a: [r`$25$`, r`$50$`, r`$100$`, r`$2500$`], e: r`Zweimal halbieren: $100\to50\to25$.` },
      { l: 1, q: r`Ein Bestand verdoppelt sich in jedem Schritt. Wie gross ist $b$?`, a: [r`$2$`, r`$1$`, r`$0.5$`, r`$100$`], e: r`Verdoppeln heisst mit 2 multiplizieren.` },
      { l: 1, q: r`Wo schneidet der Graph von $f(x)=a\cdot b^x$ die $y$-Achse?`, a: [r`Auf der Höhe $a$.`, r`Auf der Höhe $b$.`, r`Auf der Höhe 1.`, r`Im Ursprung.`], e: r`$f(0)=a$.` },
      { l: 1, q: r`$f(x)=a\cdot b^x$ mit $a>0$ und $b>0$ hat keine Nullstelle.`, tf: true, e: r`Eine Potenz mit positiver Basis ist immer positiv.` },

      { l: 2, q: r`Ein Wert nimmt pro Jahr um 5 % zu. Wie gross ist der Wachstumsfaktor?`, a: [r`$1.05$`, r`$0.05$`, r`$5$`, r`$1.5$`], e: r`$100\,\%+5\,\%=105\,\%$.` },
      { l: 2, q: r`Ein Wert nimmt pro Jahr um 20 % ab. Wie gross ist der Faktor?`, a: [r`$0.8$`, r`$0.2$`, r`$1.2$`, r`$-0.2$`], e: r`Es bleiben 80 %.` },
      { l: 2, q: r`Für eine Exponentialfunktion gilt $f(0)=4$ und $f(1)=12$. Wie lautet sie?`, a: [r`$f(x)=4\cdot3^x$`, r`$f(x)=4\cdot8^x$`, r`$f(x)=12\cdot4^x$`, r`$f(x)=3\cdot4^x$`], e: r`$a=4$, und von 4 auf 12 ist der Faktor 3.` },
      { l: 2, q: r`$f(x)=2^x$. Wie gross ist $\frac{f(x+1)}{f(x)}$?`, a: [r`Immer 2.`, r`Immer 1.`, r`Es hängt von $x$ ab.`, r`Immer $x$.`], e: r`$\frac{2^{x+1}}{2^x}=2$.` },
      { l: 2, q: r`Welche Asymptote hat der Graph von $f(x)=a\cdot b^x$?`, a: [r`Die $x$-Achse.`, r`Die $y$-Achse.`, r`Die Gerade $y=a$.`, r`Keine.`], e: r`Auf einer Seite kommen die Werte der 0 beliebig nahe, ohne sie zu erreichen.` },
      { l: 2, q: r`Jedes exponentielle Wachstum ($b>1$) überholt auf Dauer jedes lineare Wachstum.`, tf: true, e: r`Die Zunahmen pro Schritt werden immer grösser, beim linearen Wachstum bleiben sie gleich.` },
      { l: 2, q: r`1000 CHF werden zu 2 % pro Jahr angelegt. Wie viel sind es nach 10 Jahren (mit Zinseszins)?`, a: [r`Etwa 1219 CHF`, r`1200 CHF`, r`1020 CHF`, r`Etwa 1100 CHF`], e: r`$1000\cdot1.02^{10}\approx1218.99$. Ohne Zinseszins wären es 1200.` },
      { l: 2, q: r`Ein Stoff hat eine Halbwertszeit von 3 Tagen; am Anfang sind es 80 g. Wie viel ist nach 6 Tagen übrig?`, a: [r`$20$ g`, r`$40$ g`, r`$0$ g`, r`$10$ g`], e: r`Zwei Halbwertszeiten: $80\to40\to20$.` },
      { l: 2, q: r`Für eine Exponentialfunktion gilt $f(2)=18$ und $f(3)=54$. Wie lautet sie?`, a: [r`$f(x)=2\cdot3^x$`, r`$f(x)=6\cdot3^x$`, r`$f(x)=3\cdot2^x$`, r`$f(x)=18\cdot3^x$`], e: r`$b=\frac{54}{18}=3$; $a\cdot3^2=18$ ergibt $a=2$.` },
      { l: 2, q: r`$0.5^x$ ist dasselbe wie $2^{-x}$.`, tf: true, e: r`$0.5=2^{-1}$, also $0.5^x=\left(2^{-1}\right)^x$.` },

      { l: 3, q: r`Ein Kapital wächst um 7 % pro Jahr. Nach etwa wie vielen Jahren hat es sich verdoppelt?`, a: [r`Nach etwa 10 Jahren`, r`Nach etwa 14 Jahren`, r`Nach 7 Jahren`, r`Nach etwa 29 Jahren`], e: r`$1.07^t=2$ ergibt $t=\frac{\ln2}{\ln1.07}\approx10.2$.` },
      { l: 3, q: r`Bakterien verdoppeln sich alle 20 Minuten. Auf das Wievielfache wächst ihre Zahl in 2 Stunden?`, a: [r`Auf das 64-Fache`, r`Auf das 12-Fache`, r`Auf das 6-Fache`, r`Auf das 36-Fache`], e: r`2 Stunden sind 6 Verdopplungen: $2^6$.` },
      { l: 3, q: r`Ein Wert wächst zwei Jahre lang um je 10 %. Um wie viel Prozent ist er insgesamt gewachsen?`, a: [r`Um 21 %`, r`Um 20 %`, r`Um 100 %`, r`Um 11 %`], e: r`$1.1\cdot1.1=1.21$.` },
      { l: 3, q: r`Nimmt ein Wert erst um 50 % zu und dann um 50 % ab, so ist er wieder beim Ausgangswert.`, tf: false, e: r`$1.5\cdot0.5=0.75$: Es bleiben nur 75 %.` },
      { l: 3, q: r`Welche Exponentialfunktion geht durch $(1\,|\,6)$ und $(3\,|\,54)$?`, a: [r`$f(x)=2\cdot3^x$`, r`$f(x)=6\cdot3^x$`, r`$f(x)=2\cdot9^x$`, r`$f(x)=3\cdot2^x$`], e: r`Zwei Schritte ergeben den Faktor 9, also $b=3$; $a\cdot3=6$.` },
      { l: 3, q: r`Der Jahresfaktor ist 1.12. Wie gross ist der gleichwertige Monatsfaktor?`, a: [r`$1.12^{1/12}\approx1.0095$`, r`$1.01$`, r`$\frac{1.12}{12}$`, r`$1.0012$`], e: r`Zwölf gleiche Monatsfaktoren müssen zusammen 1.12 ergeben.` },
      { l: 3, q: r`Auf das erste Feld eines Schachbretts kommt 1 Reiskorn, auf jedes weitere doppelt so viele wie auf das vorige. Wie viele liegen auf dem 64. Feld?`, a: [r`$2^{63}$`, r`$2^{64}$`, r`$64^2$`, r`$2\cdot64$`], e: r`Feld 1 hat $2^0$, Feld 2 hat $2^1$, Feld $n$ hat $2^{n-1}$ Körner.` },
      { l: 3, q: r`Ab welcher natürlichen Zahl $x$ ist $2^x$ grösser als $1000\,x$?`, a: [r`Ab $x=14$`, r`Ab $x=10$`, r`Ab $x=20$`, r`Ab $x=100$`], e: r`$2^{13}=8192<13\,000$, aber $2^{14}=16\,384>14\,000$.` }
    ],

    // ───────────────────────── Die Zahl e und e^x ─────────────────────────
    e: [
      { l: 1, q: r`Welchen Wert hat die Zahl $e$ ungefähr?`, a: [r`$2.718$`, r`$3.142$`, r`$1.618$`, r`$2.5$`], e: r`$e=2.71828\ldots$` },
      { l: 1, q: r`Wie lautet die Ableitung von $f(x)=e^x$?`, a: [r`$e^x$`, r`$x\,e^{x-1}$`, r`$e^{x-1}$`, r`$\ln x$`], e: r`Das ist die besondere Eigenschaft der Basis $e$.` },
      { l: 1, q: r`Wie gross ist $e^0$?`, a: [r`$1$`, r`$0$`, r`$e$`, r`Nicht definiert`], e: r`Jede Zahl ungleich 0 hoch 0 ist 1.` },
      { l: 1, q: r`Welche Steigung hat die Tangente an $e^x$ bei $x=0$?`, a: [r`$1$`, r`$0$`, r`$e$`, r`$2$`], e: r`Steigung gleich Funktionswert: $e^0=1$.` },
      { l: 1, q: r`Was für eine Zahl ist $e$?`, a: [r`Eine irrationale Zahl.`, r`Eine natürliche Zahl.`, r`Ein Bruch.`, r`Eine negative Zahl.`], e: r`Ihre Dezimaldarstellung bricht nicht ab und wiederholt sich nicht.` },
      { l: 1, q: r`$e^x$ ist für jedes $x$ positiv.`, tf: true, e: r`Der Graph liegt ganz oberhalb der $x$-Achse.` },
      { l: 1, q: r`Wie gross ist $e^1$?`, a: [r`$e$`, r`$1$`, r`$0$`, r`$2$`], e: r`Jede Zahl hoch 1 ist sie selbst.` },
      { l: 1, q: r`Welche Asymptote hat der Graph von $e^x$?`, a: [r`Die $x$-Achse (für $x\to-\infty$).`, r`Die $y$-Achse.`, r`Die Gerade $y=1$.`, r`Die Gerade $y=x$.`], e: r`Für stark negative $x$ wird $e^x$ beliebig klein.` },
      { l: 1, q: r`Welche Steigung hat die Tangente an $e^x$ bei $x=1$?`, a: [r`$e$`, r`$1$`, r`$2$`, r`$0$`], e: r`Steigung gleich Funktionswert: $e^1$.` },
      { l: 1, q: r`Wie heisst $f(x)=e^x$?`, a: [r`Natürliche Exponentialfunktion`, r`Natürlicher Logarithmus`, r`Potenzfunktion`, r`Normalparabel`], e: r`Ihre Umkehrfunktion ist der natürliche Logarithmus.` },
      { l: 1, q: r`Zwischen welchen ganzen Zahlen liegt $e$?`, a: [r`Zwischen 2 und 3`, r`Zwischen 1 und 2`, r`Zwischen 3 und 4`, r`Zwischen 0 und 1`], e: r`$e\approx2.718$.` },
      { l: 1, q: r`Bei $f(x)=2^x$ ist die Steigung überall gleich dem Funktionswert.`, tf: false, e: r`Bei $2^x$ ist die Steigung etwa das 0.69-Fache des Funktionswerts. Gleichheit gilt nur für die Basis $e$.` },

      { l: 2, q: r`Welchem Wert nähert sich $\left(1+\frac1n\right)^n$ für immer grössere $n$?`, a: [r`$e$`, r`$1$`, r`$2$`, r`Unendlich`], e: r`Das ist eine der Definitionen von $e$.` },
      { l: 2, q: r`Wie lautet die Ableitung von $f(x)=e^{2x}$?`, a: [r`$2\,e^{2x}$`, r`$e^{2x}$`, r`$2x\,e^{2x-1}$`, r`$e^{2}$`], e: r`Kettenregel: innere Ableitung 2.` },
      { l: 2, q: r`Wie lautet die Tangente an $e^x$ im Punkt $(0\,|\,1)$?`, a: [r`$y=x+1$`, r`$y=x$`, r`$y=e\,x+1$`, r`$y=1$`], e: r`Steigung 1, $y$-Achsenabschnitt 1.` },
      { l: 2, q: r`Wie lautet die Ableitung von $f(x)=2^x$?`, a: [r`$2^x\cdot\ln2$`, r`$2^x$`, r`$x\cdot2^{x-1}$`, r`$2^x\cdot\ln x$`], e: r`$2^x=e^{x\ln2}$, und die innere Ableitung ist $\ln2$.` },
      { l: 2, q: r`Was ergibt $e^a\cdot e^b$?`, a: [r`$e^{a+b}$`, r`$e^{a\cdot b}$`, r`$2\,e^{a+b}$`, r`$e^{a}+e^{b}$`], e: r`Gleiche Basis: Exponenten addieren.` },
      { l: 2, q: r`$e^x$ wächst für $x\to\infty$ schneller als jede Potenz $x^n$.`, tf: true, e: r`Exponentielles Wachstum überholt auf Dauer jedes Potenzwachstum.` },
      { l: 2, q: r`Wie verläuft der Graph von $f(x)=e^{-x}$?`, a: [r`Er fällt; er ist das Spiegelbild von $e^x$ an der $y$-Achse.`, r`Er steigt; er ist das Spiegelbild an der $x$-Achse.`, r`Er liegt unterhalb der $x$-Achse.`, r`Er ist eine Gerade.`], e: r`$x$ wird durch $-x$ ersetzt.` },
      { l: 2, q: r`Ein Kapital wird zu 100 % pro Jahr verzinst, der Zins aber in immer kürzeren Abständen gutgeschrieben. Welchem Faktor nähert sich das Wachstum in einem Jahr?`, a: [r`$e\approx2.718$`, r`$2$`, r`$3$`, r`Unendlich`], e: r`$\left(1+\frac1n\right)^n\to e$: stetige Verzinsung.` },
      { l: 2, q: r`Wie gross ist $e^{\ln5}$?`, a: [r`$5$`, r`$\ln5$`, r`$e^5$`, r`$5e$`], e: r`$e^x$ und $\ln x$ heben sich gegenseitig auf.` },
      { l: 2, q: r`Bei $x=0$ hat $2^x$ etwa die Steigung 0.69 und $3^x$ etwa 1.10. Was folgt für die Basis, bei der die Steigung genau 1 ist?`, a: [r`Sie liegt zwischen 2 und 3.`, r`Sie ist kleiner als 2.`, r`Sie ist grösser als 3.`, r`Eine solche Basis gibt es nicht.`], e: r`Diese Basis ist $e\approx2.718$.` },

      { l: 3, q: r`Wie lautet die Ableitung von $f(x)=x\cdot e^x$?`, a: [r`$(1+x)\,e^x$`, r`$e^x$`, r`$x\,e^x$`, r`$x^2e^{x-1}$`], e: r`Produktregel: $1\cdot e^x+x\cdot e^x$.` },
      { l: 3, q: r`Wo schneidet die Tangente an $e^x$ im Punkt mit $x=a$ die $x$-Achse?`, a: [r`Bei $x=a-1$`, r`Bei $x=a$`, r`Bei $x=a+1$`, r`Bei $x=0$`], e: r`$y=e^a(x-a)+e^a=0$ ergibt $x=a-1$: immer genau 1 links vom Berührpunkt.` },
      { l: 3, q: r`Wie gross ist $\int_0^1e^x\,dx$?`, a: [r`$e-1$`, r`$e$`, r`$1$`, r`$e+1$`], e: r`$\big[e^x\big]_0^1=e-1$.` },
      { l: 3, q: r`Für alle $x$ gilt $e^x\ge x+1$.`, tf: true, e: r`$y=x+1$ ist die Tangente bei $x=0$, und der Graph von $e^x$ (Linkskurve) liegt über jeder seiner Tangenten.` },
      { l: 3, q: r`Wie lautet die Ableitung von $f(x)=e^{-x^2}$?`, a: [r`$-2x\,e^{-x^2}$`, r`$e^{-x^2}$`, r`$-2\,e^{-x^2}$`, r`$-x^2e^{-x^2-1}$`], e: r`Kettenregel: innere Ableitung $-2x$.` },
      { l: 3, q: r`Ein Kapital wächst stetig nach $K(t)=K_0\cdot e^{0.05\,t}$. Nach welcher Zeit hat es sich verdoppelt?`, a: [r`Nach etwa 13.9 Jahren`, r`Nach 20 Jahren`, r`Nach 10 Jahren`, r`Nach etwa 40 Jahren`], e: r`$e^{0.05\,t}=2$ ergibt $t=\frac{\ln2}{0.05}$.` },
      { l: 3, q: r`Welchen Wert hat $1+1+\frac12+\frac16+\frac{1}{24}$ (die ersten Glieder der Reihe für $e$)?`, a: [r`Etwa $2.708$`, r`$2.5$`, r`Etwa $2.718$`, r`$2.75$`], e: r`$2+0.5+0.1667+0.0417$. Schon fünf Glieder liegen nahe bei $e$.` },
      { l: 3, q: r`Für $f(x)=e^{kx}$ gilt $f'(0)=3$. Wie gross ist $k$?`, a: [r`$k=3$`, r`$k=\ln3$`, r`$k=e^3$`, r`$k=\frac13$`], e: r`$f'(x)=k\,e^{kx}$, also $f'(0)=k$.` }
    ],

    // ───────────────────────── Logarithmus als Umkehrung ─────────────────────────
    log: [
      { l: 1, q: r`Was ist $\log_b(y)$?`, a: [r`Der Exponent $x$, für den $b^x=y$ gilt.`, r`Die Basis, für die $x^b=y$ gilt.`, r`Der Quotient $\frac{y}{b}$.`, r`Die $b$-te Wurzel aus $y$.`], e: r`Der Logarithmus fragt: «$b$ hoch wie viel ergibt $y$?»` },
      { l: 1, q: r`Wie gross ist $\log_2 8$?`, a: [r`$3$`, r`$4$`, r`$16$`, r`$\frac14$`], e: r`$2^3=8$.` },
      { l: 1, q: r`Wie gross ist $\log_{10}100$?`, a: [r`$2$`, r`$10$`, r`$1000$`, r`$0.1$`], e: r`$10^2=100$.` },
      { l: 1, q: r`Wie gross ist $\log_b 1$?`, a: [r`$0$`, r`$1$`, r`$b$`, r`Nicht definiert`], e: r`$b^0=1$.` },
      { l: 1, q: r`Wie gross ist $\log_b b$?`, a: [r`$1$`, r`$0$`, r`$b$`, r`$b^2$`], e: r`$b^1=b$.` },
      { l: 1, q: r`Was ist $\ln x$?`, a: [r`Der Logarithmus zur Basis $e$.`, r`Der Logarithmus zur Basis 10.`, r`Der Logarithmus zur Basis 2.`, r`Der Kehrwert von $x$.`], e: r`$\ln$ steht für «logarithmus naturalis».` },
      { l: 1, q: r`Wie entsteht der Graph von $\log_b x$ aus dem Graphen von $b^x$?`, a: [r`Durch Spiegeln an der Geraden $y=x$.`, r`Durch Spiegeln an der $x$-Achse.`, r`Durch Spiegeln an der $y$-Achse.`, r`Durch Verschieben.`], e: r`Der Logarithmus ist die Umkehrfunktion: $x$ und $y$ tauschen die Rollen.` },
      { l: 1, q: r`Welchen Definitionsbereich hat $f(x)=\log_b x$?`, a: [r`Alle $x>0$`, r`Alle reellen Zahlen`, r`Alle $x\ge0$`, r`Alle $x\neq0$`], e: r`$b^x$ nimmt nur positive Werte an; nur zu ihnen gibt es einen Exponenten.` },
      { l: 1, q: r`Es gilt $\log_2 0=0$.`, tf: false, e: r`$2^x$ wird nie 0; $\log_2 0$ ist nicht definiert. Richtig ist $\log_2 1=0$.` },
      { l: 1, q: r`Wie gross ist $\log_3 9$?`, a: [r`$2$`, r`$3$`, r`$6$`, r`$27$`], e: r`$3^2=9$.` },
      { l: 1, q: r`Wie gross ist $\lg1000$ (Logarithmus zur Basis 10)?`, a: [r`$3$`, r`$100$`, r`$30$`, r`$4$`], e: r`$10^3=1000$: Der Zehnerlogarithmus zählt die Nullen.` },
      { l: 1, q: r`$\log_2 8=3$, weil $2^3=8$ ist.`, tf: true, e: r`Genau so ist der Logarithmus festgelegt.` },

      { l: 2, q: r`Was ergibt $\log_b(u\cdot v)$?`, a: [r`$\log_b u+\log_b v$`, r`$\log_b u\cdot\log_b v$`, r`$\log_b u-\log_b v$`, r`$\log_b(u+v)$`], e: r`Beim Multiplizieren von Potenzen werden die Exponenten addiert.` },
      { l: 2, q: r`Was ergibt $\log_b(u^k)$?`, a: [r`$k\cdot\log_b u$`, r`$(\log_b u)^k$`, r`$\log_b u+k$`, r`$\log_b(k\cdot u)$`], e: r`Der Exponent darf als Faktor vor den Logarithmus gezogen werden.` },
      { l: 2, q: r`Wie gross ist $\log_2\frac18$?`, a: [r`$-3$`, r`$3$`, r`$\frac13$`, r`$-\frac13$`], e: r`$2^{-3}=\frac18$.` },
      { l: 2, q: r`Wie gross ist $\log_4 2$?`, a: [r`$\frac12$`, r`$2$`, r`$-2$`, r`$8$`], e: r`$4^{1/2}=\sqrt4=2$.` },
      { l: 2, q: r`Welche Nullstelle hat $f(x)=\log_b x$?`, a: [r`$x=1$`, r`$x=0$`, r`$x=b$`, r`Keine`], e: r`$\log_b1=0$ für jede Basis.` },
      { l: 2, q: r`Welche Asymptote hat der Graph von $\log_b x$?`, a: [r`Die $y$-Achse.`, r`Die $x$-Achse.`, r`Die Gerade $y=x$.`, r`Keine.`], e: r`Die Asymptote von $b^x$ (die $x$-Achse) wird mit gespiegelt.` },
      { l: 2, q: r`Es gilt $\log_b(u+v)=\log_b u+\log_b v$.`, tf: false, e: r`Die Regel gilt für das Produkt, nicht für die Summe.` },
      { l: 2, q: r`Wie rechnet man $\log_b y$ mit dem Taschenrechner aus, wenn er nur $\ln$ kennt?`, a: [r`$\frac{\ln y}{\ln b}$`, r`$\frac{\ln b}{\ln y}$`, r`$\ln y-\ln b$`, r`$\ln(y\cdot b)$`], e: r`Basiswechsel: aus $b^x=y$ folgt $x\ln b=\ln y$.` },
      { l: 2, q: r`Was ergibt $\log_2 32-\log_2 4$?`, a: [r`$3$`, r`$28$`, r`$7$`, r`$8$`], e: r`$5-2=3$, oder $\log_2\frac{32}{4}=\log_28$.` },
      { l: 2, q: r`Wie gross ist $\ln\left(e^3\right)$?`, a: [r`$3$`, r`$e^3$`, r`$3e$`, r`$\ln3$`], e: r`$\ln$ und $e^x$ heben sich gegenseitig auf.` },

      { l: 3, q: r`Was ergibt $\log_2 3\cdot\log_3 2$?`, a: [r`$1$`, r`$6$`, r`$5$`, r`$\frac23$`], e: r`$\frac{\ln3}{\ln2}\cdot\frac{\ln2}{\ln3}=1$.` },
      { l: 3, q: r`Wie viele Stellen hat die Zahl $2^{100}$ (mit $\lg2\approx0.30103$)?`, a: [r`$31$`, r`$30$`, r`$100$`, r`$50$`], e: r`$\lg\left(2^{100}\right)=100\cdot0.30103=30.103$: Die Zahl liegt zwischen $10^{30}$ und $10^{31}$.` },
      { l: 3, q: r`Wie gross ist $\log_8 4$?`, a: [r`$\frac23$`, r`$\frac12$`, r`$2$`, r`$\frac32$`], e: r`$8^{2/3}=\left(\sqrt[3]8\right)^2=4$.` },
      { l: 3, q: r`Für $b>1$ und $0<x<1$ ist $\log_b x$ negativ.`, tf: true, e: r`Um mit $b>1$ eine Zahl unter 1 zu erreichen, braucht es einen negativen Exponenten.` },
      { l: 3, q: r`Es ist $\lg2\approx0.301$. Wie gross ist $\lg5$?`, a: [r`Etwa $0.699$`, r`Etwa $0.753$`, r`Etwa $0.602$`, r`Etwa $1.301$`], e: r`$\lg5=\lg\frac{10}{2}=1-\lg2$.` },
      { l: 3, q: r`Welche Lösung hat $\log_2 x+\log_2(x-2)=3$?`, a: [r`$x=4$`, r`$x=4$ und $x=-2$`, r`$x=5$`, r`$x=2.5$`], e: r`$x\,(x-2)=8$ ergibt 4 und $-2$; $-2$ liegt nicht im Definitionsbereich.` },
      { l: 3, q: r`Welche Steigung hat der Graph von $\ln x$ an der Stelle $x=1$?`, a: [r`$1$`, r`$0$`, r`$e$`, r`$\frac1e$`], e: r`$(\ln x)'=\frac1x$. Der Graph ist das Spiegelbild von $e^x$, das bei $(0\,|\,1)$ ebenfalls die Steigung 1 hat.` },
      { l: 3, q: r`Ein Blatt Papier ist 0.1 mm dick und wird immer wieder gefaltet. Nach wie vielen Faltungen wäre der Stapel höher als 1 km?`, a: [r`Nach 24 Faltungen`, r`Nach 100 Faltungen`, r`Nach 1000 Faltungen`, r`Nach 14 Faltungen`], e: r`$0.1\cdot2^n>10^6$ mm heisst $2^n>10^7$; $2^{23}\approx8.4\cdot10^6$ reicht nicht, $2^{24}\approx1.7\cdot10^7$ reicht.` }
    ],

    // ───────────────────────── Exponentialgleichungen und Anwendungen ─────────────────────────
    eq: [
      { l: 1, q: r`Welche Lösung hat $2^x=8$?`, a: [r`$x=3$`, r`$x=4$`, r`$x=6$`, r`$x=16$`], e: r`$2^3=8$.` },
      { l: 1, q: r`Welche Lösung hat $10^x=1000$?`, a: [r`$x=3$`, r`$x=100$`, r`$x=30$`, r`$x=4$`], e: r`$10^3=1000$.` },
      { l: 1, q: r`Welche Lösung hat $3^x=1$?`, a: [r`$x=0$`, r`$x=1$`, r`$x=\frac13$`, r`Keine`], e: r`$3^0=1$.` },
      { l: 1, q: r`Welche Lösung hat $2^x=5$?`, a: [r`$x=\log_2 5$`, r`$x=2.5$`, r`$x=\log_5 2$`, r`$x=\sqrt5$`], e: r`Der gesuchte Exponent ist nach Definition der Logarithmus.` },
      { l: 1, q: r`Wie löst man $a\cdot b^x=c$?`, a: [r`Zuerst durch $a$ teilen, dann logarithmieren.`, r`Zuerst logarithmieren, dann durch $a$ teilen.`, r`Die $x$-te Wurzel ziehen.`, r`Durch $b$ teilen.`], e: r`Die Potenz muss allein stehen, bevor man den Logarithmus nimmt.` },
      { l: 1, q: r`Welche Lösung hat $2^x=-4$?`, a: [r`Keine.`, r`$x=-2$`, r`$x=2$`, r`$x=\frac12$`], e: r`$2^x$ ist immer positiv.` },
      { l: 1, q: r`Welche Lösung hat $5^x=25$?`, a: [r`$x=2$`, r`$x=5$`, r`$x=\frac12$`, r`$x=20$`], e: r`$5^2=25$.` },
      { l: 1, q: r`Welche Lösung hat $2^x=\frac14$?`, a: [r`$x=-2$`, r`$x=2$`, r`$x=\frac12$`, r`Keine`], e: r`$2^{-2}=\frac14$.` },
      { l: 1, q: r`Welche Lösung hat $e^x=1$?`, a: [r`$x=0$`, r`$x=1$`, r`$x=e$`, r`Keine`], e: r`$e^0=1$.` },
      { l: 1, q: r`Für $b>0$, $b\neq1$ und $c>0$ hat $b^x=c$ genau eine Lösung.`, tf: true, e: r`Der Graph von $b^x$ steigt oder fällt überall und nimmt jeden positiven Wert genau einmal an.` },
      { l: 1, q: r`Welche Lösung hat $e^x=5$?`, a: [r`$x=\ln5$`, r`$x=\frac5e$`, r`$x=e^5$`, r`$x=\log_5 e$`], e: r`Der natürliche Logarithmus ist die Umkehrung von $e^x$.` },
      { l: 1, q: r`Welche Lösung hat $3\cdot2^x=24$?`, a: [r`$x=3$`, r`$x=4$`, r`$x=8$`, r`$x=2$`], e: r`Durch 3 teilen: $2^x=8$.` },

      { l: 2, q: r`Welche Lösung hat $2^{x+1}=16$?`, a: [r`$x=3$`, r`$x=4$`, r`$x=5$`, r`$x=7$`], e: r`$16=2^4$, also $x+1=4$.` },
      { l: 2, q: r`Welche Lösung hat $5\cdot1.2^x=10$?`, a: [r`$x=\frac{\ln2}{\ln1.2}\approx3.80$`, r`$x=\frac{2}{1.2}\approx1.67$`, r`$x=\ln2\cdot\ln1.2\approx0.13$`, r`$x=2$`], e: r`$1.2^x=2$, dann beide Seiten logarithmieren.` },
      { l: 2, q: r`Welche Lösung hat $2^x+3=11$?`, a: [r`$x=3$`, r`$x=4$`, r`$x=\log_2 11-3$`, r`$x=7$`], e: r`Zuerst 3 abziehen: $2^x=8$.` },
      { l: 2, q: r`Welche Lösung hat $4^x=8$?`, a: [r`$x=\frac32$`, r`$x=2$`, r`$x=\frac23$`, r`$x=4$`], e: r`$2^{2x}=2^3$, also $2x=3$.` },
      { l: 2, q: r`Welche Lösung hat $0.5^x=8$?`, a: [r`$x=-3$`, r`$x=3$`, r`$x=16$`, r`Keine`], e: r`$0.5^x=2^{-x}$, also $-x=3$.` },
      { l: 2, q: r`Ein Bestand zerfällt nach $N(t)=100\cdot0.9^t$. Nach welcher Zeit $t$ ist er auf 50 gesunken?`, a: [r`Nach etwa 6.6`, r`Nach 5`, r`Nach etwa 9.5`, r`Nach 50`], e: r`$0.9^t=0.5$ ergibt $t=\frac{\ln0.5}{\ln0.9}\approx6.58$.` },
      { l: 2, q: r`Welche Lösung hat $e^{2x}=7$?`, a: [r`$x=\frac{\ln7}{2}$`, r`$x=\ln\frac72$`, r`$x=2\ln7$`, r`$x=\ln7-2$`], e: r`$2x=\ln7$.` },
      { l: 2, q: r`Die Gleichung $2^x=3^x$ hat nur die Lösung $x=0$.`, tf: true, e: r`$\left(\frac23\right)^x=1$ gilt nur für $x=0$.` },
      { l: 2, q: r`Welche Lösung hat $3^{2x}=81$?`, a: [r`$x=2$`, r`$x=4$`, r`$x=13.5$`, r`$x=3$`], e: r`$81=3^4$, also $2x=4$.` },
      { l: 2, q: r`Welche Lösung hat $10\cdot2^x+5=3$?`, a: [r`Keine.`, r`$x=-1$`, r`$x=\log_2 0.2$`, r`$x=-0.2$`], e: r`Es müsste $2^x=-0.2$ sein, und $2^x$ ist immer positiv.` },

      { l: 3, q: r`Welche Lösungen hat $2^{2x}-5\cdot2^x+4=0$?`, a: [r`$x=0$ und $x=2$`, r`$x=1$ und $x=4$`, r`Nur $x=2$`, r`$x=1$ und $x=2$`], e: r`Mit $z=2^x$: $z^2-5z+4=0$ ergibt $z=1$ oder $z=4$.` },
      { l: 3, q: r`Welche Lösung hat $3^x=2^{x+1}$?`, a: [r`$x=\frac{\ln2}{\ln3-\ln2}\approx1.71$`, r`$x=1$`, r`$x=\frac{\ln3}{\ln2}\approx1.58$`, r`$x=2$`], e: r`$x\ln3=(x+1)\ln2$ nach $x$ auflösen.` },
      { l: 3, q: r`Ein Kaffee kühlt nach $T(t)=20+60\cdot0.9^t$ ab ($t$ in min). Wann hat er 40 °C?`, a: [r`Nach etwa 10.4 Minuten`, r`Nach etwa 6.6 Minuten`, r`Nach etwa 3.8 Minuten`, r`Nie`], e: r`$0.9^t=\frac13$ ergibt $t=\frac{\ln(1/3)}{\ln0.9}$.` },
      { l: 3, q: r`Welche Lösung hat $e^x+e^{-x}=2$?`, a: [r`$x=0$`, r`$x=\ln2$`, r`$x=1$ und $x=-1$`, r`Keine`], e: r`Mit $z=e^x$: $z+\frac1z=2$ ergibt $(z-1)^2=0$.` },
      { l: 3, q: r`Die Gleichung $2^x=x$ hat eine Lösung.`, tf: false, e: r`Der Graph von $2^x$ liegt überall über der Geraden $y=x$.` },
      { l: 3, q: r`Kohlenstoff-14 hat eine Halbwertszeit von 5730 Jahren. Wie alt ist eine Probe, in der noch 25 % vorhanden sind?`, a: [r`$11\,460$ Jahre`, r`$5730$ Jahre`, r`$2865$ Jahre`, r`$22\,920$ Jahre`], e: r`25 % sind zwei Halbierungen.` },
      { l: 3, q: r`Wie viele Lösungen hat $2^x=x^2$?`, a: [r`Drei.`, r`Zwei.`, r`Eine.`, r`Keine.`], e: r`$x=2$ und $x=4$, dazu eine negative Lösung bei etwa $-0.77$.` },
      { l: 3, q: r`Ein Kapital wächst um 5 % pro Jahr. Nach wie vielen ganzen Jahren hat es sich erstmals mehr als verdoppelt?`, a: [r`Nach 15 Jahren`, r`Nach 14 Jahren`, r`Nach 20 Jahren`, r`Nach 10 Jahren`], e: r`$1.05^{14}\approx1.98$ und $1.05^{15}\approx2.08$.` }
    ],

    // ───────────────────────── Prozentrechnung ─────────────────────────
    pct: [
      { l: 1, q: r`Welcher Faktor gehört zu einer Zunahme um 20 %?`, a: [r`$1.2$`, r`$0.2$`, r`$20$`, r`$1.02$`], e: r`$100\,\%+20\,\%=120\,\%$.` },
      { l: 1, q: r`Welcher Faktor gehört zu einer Abnahme um 15 %?`, a: [r`$0.85$`, r`$0.15$`, r`$1.15$`, r`$-0.15$`], e: r`Es bleiben 85 %.` },
      { l: 1, q: r`Welche Veränderung gehört zum Faktor $1.07$?`, a: [r`Zunahme um 7 %`, r`Zunahme um 107 %`, r`Zunahme um 0.7 %`, r`Abnahme um 7 %`], e: r`$1.07=1+\frac{7}{100}$.` },
      { l: 1, q: r`Welche Veränderung gehört zum Faktor $0.6$?`, a: [r`Abnahme um 40 %`, r`Abnahme um 60 %`, r`Zunahme um 60 %`, r`Abnahme um 6 %`], e: r`Es bleiben 60 %, also fehlen 40 %.` },
      { l: 1, q: r`200 CHF nehmen um 10 % zu. Wie viel ist es danach?`, a: [r`$220$ CHF`, r`$210$ CHF`, r`$2000$ CHF`, r`$202$ CHF`], e: r`$200\cdot1.1$.` },
      { l: 1, q: r`80 CHF nehmen um 25 % ab. Wie viel ist es danach?`, a: [r`$60$ CHF`, r`$55$ CHF`, r`$20$ CHF`, r`$64$ CHF`], e: r`$80\cdot0.75$.` },
      { l: 1, q: r`Wie lautet der Faktor für eine Zunahme um $p\,\%$?`, a: [r`$q=1+\frac{p}{100}$`, r`$q=\frac{p}{100}$`, r`$q=1+p$`, r`$q=100+p$`], e: r`Zum Ganzen (1) kommt der Anteil $\frac{p}{100}$ dazu.` },
      { l: 1, q: r`Zu einer Abnahme um $p\,\%$ gehört der Faktor $1-\frac{p}{100}$.`, tf: true, e: r`Vom Ganzen (1) wird der Anteil $\frac{p}{100}$ abgezogen.` },
      { l: 1, q: r`Welche prozentuale Zunahme bedeutet eine Verdopplung?`, a: [r`100 %`, r`200 %`, r`50 %`, r`2 %`], e: r`Faktor 2 heisst: Zum Ganzen kommt noch einmal das Ganze dazu.` },
      { l: 1, q: r`Welche prozentuale Abnahme bedeutet eine Halbierung?`, a: [r`50 %`, r`100 %`, r`200 %`, r`0.5 %`], e: r`Faktor 0.5: Die Hälfte fällt weg.` },
      { l: 1, q: r`Die Mehrwertsteuer beträgt 8.1 %. Mit welchem Faktor rechnet man vom Preis ohne Steuer zum Preis mit Steuer?`, a: [r`$1.081$`, r`$1.81$`, r`$0.081$`, r`$8.1$`], e: r`$1+\frac{8.1}{100}$.` },
      { l: 1, q: r`Nimmt ein Wert um 10 % zu und danach um 10 % ab, so ist er wieder beim Ausgangswert.`, tf: false, e: r`$1.1\cdot0.9=0.99$: Die 10 % Abnahme beziehen sich auf den grösseren Wert.` },

      { l: 2, q: r`Ein Wert steigt zuerst um 10 % und dann um 20 %. Um wie viel Prozent ist er insgesamt gestiegen?`, a: [r`Um 32 %`, r`Um 30 %`, r`Um 200 %`, r`Um 22 %`], e: r`$1.1\cdot1.2=1.32$.` },
      { l: 2, q: r`Nach einer Preiserhöhung um 25 % kostet ein Artikel 150 CHF. Wie viel kostete er vorher?`, a: [r`$120$ CHF`, r`$112.50$ CHF`, r`$125$ CHF`, r`$187.50$ CHF`], e: r`Rückwärts wird geteilt: $\frac{150}{1.25}$.` },
      { l: 2, q: r`Ein Wert sinkt um 20 % und steigt danach um 20 %. Wie hat er sich insgesamt verändert?`, a: [r`Er ist um 4 % gesunken.`, r`Er ist gleich geblieben.`, r`Er ist um 4 % gestiegen.`, r`Er ist um 40 % gesunken.`], e: r`$0.8\cdot1.2=0.96$.` },
      { l: 2, q: r`Ein Preis wurde um 20 % gesenkt. Um wie viel Prozent muss er steigen, damit er wieder so hoch ist wie vorher?`, a: [r`Um 25 %`, r`Um 20 %`, r`Um 80 %`, r`Um 120 %`], e: r`$\frac{1}{0.8}=1.25$.` },
      { l: 2, q: r`Ein Wert wächst drei Jahre lang um je 5 %. Um wie viel Prozent wächst er insgesamt?`, a: [r`Um etwa 15.8 %`, r`Um 15 %`, r`Um 125 %`, r`Um etwa 5.2 %`], e: r`$1.05^3\approx1.1576$.` },
      { l: 2, q: r`Nach 30 % Rabatt kostet eine Jacke 70 CHF. Wie hoch war der ursprüngliche Preis?`, a: [r`$100$ CHF`, r`$91$ CHF`, r`$49$ CHF`, r`$233$ CHF`], e: r`$\frac{70}{0.7}$.` },
      { l: 2, q: r`Bei mehreren prozentualen Veränderungen nacheinander spielt die Reihenfolge für das Endergebnis keine Rolle.`, tf: true, e: r`Die Faktoren werden multipliziert, und beim Multiplizieren darf man vertauschen.` },
      { l: 2, q: r`Ein Artikel kostet mit 8.1 % Mehrwertsteuer 108.10 CHF. Wie viel kostet er ohne Steuer?`, a: [r`$100$ CHF`, r`$99.34$ CHF`, r`$100.81$ CHF`, r`$8.10$ CHF`], e: r`$\frac{108.10}{1.081}$. Wer 8.1 % vom Endpreis abzieht, erhält fälschlich 99.34.` },
      { l: 2, q: r`Ein Wert steigt um 50 % und sinkt danach um 50 %. Wie hat er sich insgesamt verändert?`, a: [r`Er ist um 25 % gesunken.`, r`Er ist gleich geblieben.`, r`Er ist um 25 % gestiegen.`, r`Er ist um 50 % gesunken.`], e: r`$1.5\cdot0.5=0.75$.` },
      { l: 2, q: r`Ein Preis wird zweimal nacheinander um 10 % gesenkt. Um wie viel Prozent ist er insgesamt gesunken?`, a: [r`Um 19 %`, r`Um 20 %`, r`Um 21 %`, r`Um 100 %`], e: r`$0.9\cdot0.9=0.81$.` },

      { l: 3, q: r`Ein Wert ist in zwei Jahren um insgesamt 21 % gestiegen. Wie gross war die durchschnittliche Zunahme pro Jahr?`, a: [r`10 %`, r`10.5 %`, r`11 %`, r`21 %`], e: r`$q^2=1.21$ ergibt $q=1.1$.` },
      { l: 3, q: r`Ein Wert hat um 100 % zugenommen. Um wie viel Prozent muss er sinken, damit er wieder so gross ist wie am Anfang?`, a: [r`Um 50 %`, r`Um 100 %`, r`Um 200 %`, r`Um 25 %`], e: r`Faktor 2, zurück mit Faktor $\frac12$.` },
      { l: 3, q: r`Auf einen Preis gibt es 15 % Rabatt und danach 2 % Skonto. Wie viel Prozent spart man insgesamt?`, a: [r`Etwa 16.7 %`, r`17 %`, r`Etwa 17.3 %`, r`30 %`], e: r`$0.85\cdot0.98=0.833$.` },
      { l: 3, q: r`Eine Zunahme um $p\,\%$ und danach eine Abnahme um $p\,\%$ ergeben (für $p>0$) immer weniger als den Ausgangswert.`, tf: true, e: r`$\left(1+\frac{p}{100}\right)\left(1-\frac{p}{100}\right)=1-\frac{p^2}{10\,000}<1$.` },
      { l: 3, q: r`Ein Wert verdoppelt sich in 4 Jahren. Um wie viel Prozent wächst er pro Jahr (bei gleichem Faktor)?`, a: [r`Um etwa 18.9 %`, r`Um 25 %`, r`Um 50 %`, r`Um etwa 12.5 %`], e: r`$q^4=2$ ergibt $q=\sqrt[4]{2}\approx1.189$.` },
      { l: 3, q: r`Eine Aktie verliert 50 % ihres Werts. Um wie viel Prozent muss sie steigen, um den Verlust aufzuholen?`, a: [r`Um 100 %`, r`Um 50 %`, r`Um 150 %`, r`Um 200 %`], e: r`Faktor 0.5, zurück mit Faktor 2.` },
      { l: 3, q: r`Eine Bevölkerung wächst um 2 % pro Jahr. Nach etwa wie vielen Jahren hat sie sich verdoppelt?`, a: [r`Nach etwa 35 Jahren`, r`Nach 50 Jahren`, r`Nach etwa 20 Jahren`, r`Nach 100 Jahren`], e: r`$1.02^{35}\approx2.0$. Faustregel: 70 geteilt durch den Prozentsatz.` },
      { l: 3, q: r`Der Anteil einer Partei steigt von 20 % auf 25 %. Um wie viel Prozent ist er gestiegen?`, a: [r`Um 25 %`, r`Um 5 %`, r`Um 20 %`, r`Um 125 %`], e: r`$\frac{25}{20}=1.25$. Die 5 sind Prozentpunkte, nicht Prozent.` }
    ]
  };
})();
