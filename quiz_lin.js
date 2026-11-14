// quiz_lin.js — Quizfragen zu den linearen Funktionen (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).lin = {

    // ───────────────────────── Steigung und y-Achsenabschnitt ─────────────────────────
    par: [
      { l: 1, q: r`Was bedeutet $m$ in $f(x)=mx+q$?`, a: [r`Die Steigung der Geraden.`, r`Den $y$-Achsenabschnitt.`, r`Die Nullstelle.`, r`Den $x$-Wert.`], e: r`$m$ gibt an, um wie viel $y$ wächst, wenn $x$ um 1 wächst.` },
      { l: 1, q: r`Was bedeutet $q$ in $f(x)=mx+q$?`, a: [r`Den $y$-Achsenabschnitt.`, r`Die Steigung.`, r`Die Nullstelle.`, r`Den grössten Funktionswert.`], e: r`$f(0)=q$: Auf dieser Höhe schneidet die Gerade die $y$-Achse.` },
      { l: 1, q: r`Welche Steigung hat $f(x)=2x+3$?`, a: [r`$2$`, r`$3$`, r`$5$`, r`$\frac23$`], e: r`Die Steigung ist der Faktor vor $x$.` },
      { l: 1, q: r`Wo schneidet $f(x)=2x+3$ die $y$-Achse?`, a: [r`Im Punkt $(0\,|\,3)$`, r`Im Punkt $(3\,|\,0)$`, r`Im Punkt $(0\,|\,2)$`, r`Im Punkt $(2\,|\,3)$`], e: r`$f(0)=3$.` },
      { l: 1, q: r`Was bedeutet die Steigung 2 im Bild?`, a: [r`1 nach rechts, 2 nach oben.`, r`2 nach rechts, 1 nach oben.`, r`2 nach rechts, 2 nach oben.`, r`1 nach rechts, 2 nach unten.`], e: r`Das Steigungsdreieck hat die Breite 1 und die Höhe $m$.` },
      { l: 1, q: r`Wie verläuft eine Gerade mit $m<0$?`, a: [r`Sie fällt von links nach rechts.`, r`Sie steigt von links nach rechts.`, r`Sie ist waagrecht.`, r`Sie ist senkrecht.`], e: r`Bei negativer Steigung nimmt $y$ ab, wenn $x$ wächst.` },
      { l: 1, q: r`Wie verläuft eine Gerade mit $m=0$?`, a: [r`Waagrecht.`, r`Senkrecht.`, r`Durch den Ursprung.`, r`Das ist keine Gerade.`], e: r`$f(x)=q$ hat überall denselben Wert.` },
      { l: 1, q: r`Die Gerade $f(x)=3x$ geht durch den Ursprung.`, tf: true, e: r`$q=0$, also $f(0)=0$.` },
      { l: 1, q: r`Welche Steigung hat $f(x)=-x+4$?`, a: [r`$-1$`, r`$1$`, r`$4$`, r`$-4$`], e: r`$-x$ bedeutet $-1\cdot x$.` },
      { l: 1, q: r`Welche Gerade ist steiler: $y=3x+1$ oder $y=2x+5$?`, a: [r`$y=3x+1$`, r`$y=2x+5$`, r`Beide sind gleich steil.`, r`Das lässt sich nicht vergleichen.`], e: r`Es zählt nur die Steigung: $3>2$. Der $y$-Achsenabschnitt spielt keine Rolle.` },
      { l: 1, q: r`Was geschieht mit der Geraden, wenn man nur $q$ ändert?`, a: [r`Sie wird parallel nach oben oder unten verschoben.`, r`Sie wird gedreht.`, r`Sie wird gespiegelt.`, r`Sie wird steiler.`], e: r`Die Steigung bleibt, nur die Höhe ändert sich.` },
      { l: 1, q: r`Geraden mit gleicher Steigung sind parallel.`, tf: true, e: r`Sie steigen überall gleich stark und kommen sich nie näher.` },

      { l: 2, q: r`Welche Steigung hat die Gerade durch $(1\,|\,2)$ und $(3\,|\,8)$?`, a: [r`$3$`, r`$2$`, r`$6$`, r`$\frac13$`], e: r`$\frac{\Delta y}{\Delta x}=\frac{8-2}{3-1}=\frac62$.` },
      { l: 2, q: r`Ein Steigungsdreieck hat $\Delta x=4$ und $\Delta y=-2$. Wie gross ist $m$?`, a: [r`$-\frac12$`, r`$-2$`, r`$2$`, r`$\frac12$`], e: r`$m=\frac{\Delta y}{\Delta x}=\frac{-2}{4}$.` },
      { l: 2, q: r`Welche Gerade ist steiler: $y=-3x$ oder $y=2x$?`, a: [r`$y=-3x$`, r`$y=2x$`, r`Beide sind gleich steil.`, r`Fallende Geraden sind nie steiler.`], e: r`Für die Steilheit zählt der Betrag der Steigung: $|-3|>|2|$.` },
      { l: 2, q: r`Eine senkrechte Gerade lässt sich in der Form $y=mx+q$ schreiben.`, tf: false, e: r`Ihre Steigung ist nicht definiert ($\Delta x=0$). Sie hat die Gleichung $x=c$ und ist kein Funktionsgraph.` },
      { l: 2, q: r`Welche Gerade geht durch $(0\,|\,-2)$ und hat die Steigung 3?`, a: [r`$y=3x-2$`, r`$y=-2x+3$`, r`$y=3x+2$`, r`$y=x-2$`], e: r`Der Punkt auf der $y$-Achse liefert $q=-2$.` },
      { l: 2, q: r`$f(x)=\frac12x+1$. Um wie viel wächst $y$, wenn $x$ um 4 wächst?`, a: [r`Um 2`, r`Um 4`, r`Um $\frac12$`, r`Um 3`], e: r`$\Delta y=m\cdot\Delta x=\frac12\cdot4$.` },
      { l: 2, q: r`Eine Strasse hat 100 % Steigung. Welchem Steigungswinkel entspricht das?`, a: [r`$45^\circ$`, r`$90^\circ$`, r`$100^\circ$`, r`$60^\circ$`], e: r`100 % heisst $m=1$: gleich viel nach oben wie nach rechts.` },
      { l: 2, q: r`Welche Steigung und welchen $y$-Achsenabschnitt hat die Gerade $2x+y=6$?`, a: [r`$m=-2$, $q=6$`, r`$m=2$, $q=6$`, r`$m=-2$, $q=3$`, r`$m=6$, $q=2$`], e: r`Nach $y$ auflösen: $y=-2x+6$.` },
      { l: 2, q: r`Für eine lineare Funktion gilt $f(0)=1$ und $f(1)=4$. Wie lautet sie?`, a: [r`$f(x)=3x+1$`, r`$f(x)=4x+1$`, r`$f(x)=x+3$`, r`$f(x)=x+4$`], e: r`$q=f(0)=1$, und von 0 bis 1 wächst der Wert um 3.` },
      { l: 2, q: r`Verdoppelt man die Steigung $m$, so verdoppelt sich auch der Steigungswinkel.`, tf: false, e: r`$m=1$ gehört zu $45^\circ$, $m=2$ aber nur zu etwa $63^\circ$.` },

      { l: 3, q: r`Welchen Steigungswinkel hat eine Gerade mit $m=\sqrt3$?`, a: [r`$60^\circ$`, r`$30^\circ$`, r`$45^\circ$`, r`$75^\circ$`], e: r`$m=\tan\alpha$, und $\tan60^\circ=\sqrt3$.` },
      { l: 3, q: r`Für welches $m$ hat $f(x)=mx+2$ die Nullstelle $x=4$?`, a: [r`$m=-\frac12$`, r`$m=\frac12$`, r`$m=-2$`, r`$m=2$`], e: r`$4m+2=0$.` },
      { l: 3, q: r`Welche Gerade geht durch $(2\,|\,5)$ und hat die Steigung $-3$?`, a: [r`$y=-3x+11$`, r`$y=-3x+5$`, r`$y=-3x-1$`, r`$y=-3x+2$`], e: r`$5=-3\cdot2+q$ ergibt $q=11$.` },
      { l: 3, q: r`$f(x)=mx+q$. Was ergibt $f(x+1)-f(x)$?`, a: [r`$m$`, r`$q$`, r`$m+q$`, r`$1$`], e: r`$m(x+1)+q-(mx+q)=m$: Pro Schritt 1 nach rechts wächst der Wert um $m$.` },
      { l: 3, q: r`Für jede lineare Funktion $f(x)=mx+q$ gilt $f(a+b)=f(a)+f(b)$.`, tf: false, e: r`Rechts käme $q$ zweimal vor. Die Gleichung gilt nur für $q=0$.` },
      { l: 3, q: r`Eine Gerade schneidet die $x$-Achse bei 3 und die $y$-Achse bei 6. Wie lautet ihre Gleichung?`, a: [r`$y=-2x+6$`, r`$y=2x+6$`, r`$y=-\frac12x+6$`, r`$y=-2x+3$`], e: r`$q=6$, und von $(0\,|\,6)$ nach $(3\,|\,0)$ ist $m=\frac{-6}{3}$.` },
      { l: 3, q: r`Die Gerade $y=2x+1$ wird an der $y$-Achse gespiegelt. Welche Gleichung hat das Spiegelbild?`, a: [r`$y=-2x+1$`, r`$y=2x-1$`, r`$y=-2x-1$`, r`$y=\frac12x+1$`], e: r`$x$ wird durch $-x$ ersetzt. Der Punkt auf der $y$-Achse bleibt.` },
      { l: 3, q: r`Spiegelt man die Gerade $y=2x+1$ an der $x$-Achse, so erhält man $y=-2x-1$.`, tf: true, e: r`Alle $y$-Werte wechseln das Vorzeichen: $y=-(2x+1)$.` }
    ],

    // ───────────────────────── Gerade aufstellen ─────────────────────────
    two: [
      { l: 1, q: r`Wie berechnet man die Steigung der Geraden durch $P(x_1\,|\,y_1)$ und $Q(x_2\,|\,y_2)$?`, a: [r`$m=\frac{y_2-y_1}{x_2-x_1}$`, r`$m=\frac{x_2-x_1}{y_2-y_1}$`, r`$m=y_2-y_1$`, r`$m=\frac{y_1+y_2}{x_1+x_2}$`], e: r`Höhenunterschied $\Delta y$ durch waagrechten Abstand $\Delta x$.` },
      { l: 1, q: r`Welche Steigung hat die Gerade durch $P(0\,|\,1)$ und $Q(2\,|\,5)$?`, a: [r`$2$`, r`$4$`, r`$\frac12$`, r`$3$`], e: r`$\frac{5-1}{2-0}=\frac42$.` },
      { l: 1, q: r`Wie lautet die Gerade durch $P(0\,|\,1)$ und $Q(2\,|\,5)$?`, a: [r`$y=2x+1$`, r`$y=2x+5$`, r`$y=4x+1$`, r`$y=x+2$`], e: r`$m=2$, und $P$ liegt auf der $y$-Achse: $q=1$.` },
      { l: 1, q: r`Wie viele Punkte legen eine Gerade fest?`, a: [r`Zwei verschiedene Punkte.`, r`Ein Punkt.`, r`Drei Punkte.`, r`Vier Punkte.`], e: r`Durch einen Punkt gehen unendlich viele Geraden, durch zwei verschiedene genau eine.` },
      { l: 1, q: r`Welche Gerade geht durch $P(1\,|\,3)$ und hat die Steigung 2?`, a: [r`$y=2x+1$`, r`$y=2x+3$`, r`$y=2x-1$`, r`$y=x+2$`], e: r`$P$ einsetzen: $3=2\cdot1+q$, also $q=1$.` },
      { l: 1, q: r`Was haben parallele Geraden gemeinsam?`, a: [r`Die Steigung.`, r`Den $y$-Achsenabschnitt.`, r`Die Nullstelle.`, r`Einen Schnittpunkt.`], e: r`Parallel heisst: gleiche Richtung, also gleiches $m$.` },
      { l: 1, q: r`Eine Gerade hat die Steigung $m$. Welche Steigung hat eine Senkrechte dazu?`, a: [r`$-\frac1m$`, r`$-m$`, r`$\frac1m$`, r`$m$`], e: r`Das Produkt der beiden Steigungen ist $-1$.` },
      { l: 1, q: r`Durch zwei verschiedene Punkte geht genau eine Gerade.`, tf: true, e: r`Deshalb genügen zwei Punkte, um die Gleichung aufzustellen.` },
      { l: 1, q: r`Welche Steigung hat die Gerade durch $P(1\,|\,2)$ und $Q(3\,|\,2)$?`, a: [r`$0$`, r`$2$`, r`$1$`, r`Sie ist nicht definiert.`], e: r`$\Delta y=0$: Die Gerade ist waagrecht.` },
      { l: 1, q: r`Was gilt für die Gerade durch $P(2\,|\,1)$ und $Q(2\,|\,5)$?`, a: [r`Sie ist senkrecht; ihre Steigung ist nicht definiert.`, r`Sie hat die Steigung 0.`, r`Sie hat die Steigung 4.`, r`Sie hat die Steigung 2.`], e: r`$\Delta x=0$, und durch 0 kann man nicht teilen. Die Gleichung ist $x=2$.` },
      { l: 1, q: r`Wie findet man $q$, wenn $m$ schon bekannt ist?`, a: [r`Man setzt einen Punkt der Geraden in $y=mx+q$ ein.`, r`Man addiert die Koordinaten beider Punkte.`, r`Man teilt $\Delta x$ durch $\Delta y$.`, r`Man quadriert $m$.`], e: r`Jeder Punkt der Geraden erfüllt die Gleichung; daraus folgt $q$.` },
      { l: 1, q: r`Welche Steigung hat die Gerade durch $P(-1\,|\,0)$ und $Q(1\,|\,4)$?`, a: [r`$2$`, r`$4$`, r`$-2$`, r`$\frac12$`], e: r`$\frac{4-0}{1-(-1)}=\frac42$.` },

      { l: 2, q: r`Wie lautet die Gerade durch $P(1\,|\,2)$ und $Q(4\,|\,8)$?`, a: [r`$y=2x$`, r`$y=2x+1$`, r`$y=3x-1$`, r`$y=2x-2$`], e: r`$m=\frac{8-2}{4-1}=2$; $2=2\cdot1+q$ ergibt $q=0$.` },
      { l: 2, q: r`Wie lautet die Gerade durch $P(-2\,|\,5)$ und $Q(2\,|\,-3)$?`, a: [r`$y=-2x+1$`, r`$y=-2x+5$`, r`$y=2x+1$`, r`$y=-2x-1$`], e: r`$m=\frac{-3-5}{2-(-2)}=-2$; $5=-2\cdot(-2)+q$ ergibt $q=1$.` },
      { l: 2, q: r`Welche Gerade ist parallel zu $y=3x-1$ und geht durch $(0\,|\,4)$?`, a: [r`$y=3x+4$`, r`$y=3x-4$`, r`$y=-\frac13x+4$`, r`$y=4x-1$`], e: r`Gleiche Steigung 3, neuer $y$-Achsenabschnitt 4.` },
      { l: 2, q: r`Welche Gerade steht senkrecht auf $y=2x+1$ und geht durch $(0\,|\,3)$?`, a: [r`$y=-\frac12x+3$`, r`$y=\frac12x+3$`, r`$y=-2x+3$`, r`$y=2x+3$`], e: r`Steigung der Senkrechten: $-\frac12$.` },
      { l: 2, q: r`Vertauscht man beim Berechnen der Steigung die Punkte $P$ und $Q$, so ändert sich das Vorzeichen von $m$.`, tf: false, e: r`Zähler und Nenner wechseln beide das Vorzeichen, der Bruch bleibt gleich.` },
      { l: 2, q: r`Liegen die Punkte $(0\,|\,1)$, $(1\,|\,3)$ und $(2\,|\,5)$ auf einer Geraden?`, a: [r`Ja, die Steigung ist zwischen je zwei Punkten 2.`, r`Nein.`, r`Nur die ersten beiden.`, r`Das lässt sich nicht entscheiden.`], e: r`Von Punkt zu Punkt: 1 nach rechts, 2 nach oben.` },
      { l: 2, q: r`Welche Gerade geht durch $(2\,|\,3)$ und hat die Steigung 4?`, a: [r`$y=4x-5$`, r`$y=4x+3$`, r`$y=4x-2$`, r`$y=4x+5$`], e: r`Punkt-Steigungs-Form: $y=4\,(x-2)+3$.` },
      { l: 2, q: r`Wie lautet die Gerade durch $(4\,|\,0)$ und $(0\,|\,2)$?`, a: [r`$y=-\frac12x+2$`, r`$y=\frac12x+2$`, r`$y=-2x+2$`, r`$y=-\frac12x+4$`], e: r`$q=2$, und $m=\frac{2-0}{0-4}=-\frac12$.` },
      { l: 2, q: r`Welche Steigung hat eine Senkrechte zu $y=-\frac13x+2$?`, a: [r`$3$`, r`$-3$`, r`$\frac13$`, r`$-\frac13$`], e: r`$-\frac{1}{-1/3}=3$.` },
      { l: 2, q: r`Zwei Geraden mit den Steigungen $2$ und $-\frac12$ stehen senkrecht aufeinander.`, tf: true, e: r`$2\cdot\left(-\frac12\right)=-1$.` },

      { l: 3, q: r`Für welches $k$ liegen $(1\,|\,2)$, $(3\,|\,6)$ und $(5\,|\,k)$ auf einer Geraden?`, a: [r`$k=10$`, r`$k=8$`, r`$k=12$`, r`$k=9$`], e: r`Die Steigung ist 2; von $x=3$ bis $x=5$ kommen also 4 dazu.` },
      { l: 3, q: r`Eine Gerade schneidet die $x$-Achse bei $a$ und die $y$-Achse bei $b$ (beide nicht 0). Welche Gleichung hat sie?`, a: [r`$\frac{x}{a}+\frac{y}{b}=1$`, r`$\frac{x}{b}+\frac{y}{a}=1$`, r`$ax+by=1$`, r`$y=\frac{b}{a}\,x+b$`], e: r`Probe: Für $(a\,|\,0)$ und $(0\,|\,b)$ ergibt die linke Seite jeweils 1.` },
      { l: 3, q: r`Welche Gerade steht senkrecht auf $y=2x+1$ und geht durch $P(4\,|\,3)$?`, a: [r`$y=-\frac12x+5$`, r`$y=-\frac12x+3$`, r`$y=-2x+11$`, r`$y=\frac12x+1$`], e: r`$m=-\frac12$; $3=-\frac12\cdot4+q$ ergibt $q=5$.` },
      { l: 3, q: r`Wie weit sind $P(1\,|\,2)$ und $Q(4\,|\,6)$ voneinander entfernt?`, a: [r`$5$`, r`$7$`, r`$25$`, r`$3.5$`], e: r`Pythagoras im Steigungsdreieck: $\sqrt{3^2+4^2}$.` },
      { l: 3, q: r`Die Regel $m_1\cdot m_2=-1$ für senkrechte Geraden gilt auch, wenn eine der beiden Geraden waagrecht ist.`, tf: false, e: r`Dann ist die andere Gerade senkrecht und hat keine Steigung.` },
      { l: 3, q: r`Welcher Punkt liegt genau in der Mitte zwischen $P(1\,|\,2)$ und $Q(5\,|\,8)$?`, a: [r`$(3\,|\,5)$`, r`$(4\,|\,6)$`, r`$(2\,|\,3)$`, r`$(6\,|\,10)$`], e: r`Mittelwerte der Koordinaten: $\frac{1+5}{2}$ und $\frac{2+8}{2}$.` },
      { l: 3, q: r`Welche Gerade geht durch $P(2\,|\,3)$ und ist parallel zur Geraden durch $(0\,|\,0)$ und $(4\,|\,2)$?`, a: [r`$y=\frac12x+2$`, r`$y=\frac12x+3$`, r`$y=2x-1$`, r`$y=\frac12x$`], e: r`$m=\frac24=\frac12$; $3=\frac12\cdot2+q$ ergibt $q=2$.` },
      { l: 3, q: r`Dreieck $A(0\,|\,0)$, $B(4\,|\,0)$, $C(0\,|\,3)$. Welche Steigung hat die Höhe von $A$ auf die Seite $BC$?`, a: [r`$\frac43$`, r`$-\frac34$`, r`$\frac34$`, r`$-\frac43$`], e: r`$BC$ hat die Steigung $\frac{3-0}{0-4}=-\frac34$, die Höhe steht senkrecht darauf.` }
    ],

    // ───────────────────────── Schnitt zweier Geraden ─────────────────────────
    sys: [
      { l: 1, q: r`Was zeichnet den Schnittpunkt zweier Geraden aus?`, a: [r`Er erfüllt beide Gleichungen.`, r`Er erfüllt nur die erste Gleichung.`, r`Er liegt auf der $x$-Achse.`, r`Er liegt auf der $y$-Achse.`], e: r`Der Punkt liegt auf beiden Geraden zugleich.` },
      { l: 1, q: r`Wie berechnet man die Schnittstelle von $f$ und $g$?`, a: [r`Man setzt gleich: $f(x)=g(x)$.`, r`Man addiert: $f(x)+g(x)$.`, r`Man setzt $f(x)=0$.`, r`Man vergleicht die Steigungen.`], e: r`An der Schnittstelle haben beide Funktionen denselben Wert.` },
      { l: 1, q: r`Wo schneiden sich $y=x+1$ und $y=-x+3$?`, a: [r`Im Punkt $(1\,|\,2)$`, r`Im Punkt $(2\,|\,1)$`, r`Im Punkt $(1\,|\,1)$`, r`Im Punkt $(2\,|\,3)$`], e: r`$x+1=-x+3$ ergibt $x=1$, dann $y=2$.` },
      { l: 1, q: r`Wie viele Schnittpunkte haben zwei verschiedene parallele Geraden?`, a: [r`Keinen.`, r`Einen.`, r`Zwei.`, r`Unendlich viele.`], e: r`Sie haben überall denselben Abstand.` },
      { l: 1, q: r`Wie viele gemeinsame Punkte haben zwei Geraden mit derselben Gleichung?`, a: [r`Unendlich viele.`, r`Keinen.`, r`Einen.`, r`Zwei.`], e: r`Die Geraden liegen aufeinander.` },
      { l: 1, q: r`Zwei Geraden mit verschiedenen Steigungen schneiden sich in genau einem Punkt.`, tf: true, e: r`Nur Geraden mit gleicher Steigung sind parallel oder gleich.` },
      { l: 1, q: r`Wo schneiden sich $y=2x$ und $y=x+3$?`, a: [r`Im Punkt $(3\,|\,6)$`, r`Im Punkt $(3\,|\,3)$`, r`Im Punkt $(6\,|\,3)$`, r`Im Punkt $(1\,|\,2)$`], e: r`$2x=x+3$ ergibt $x=3$, dann $y=6$.` },
      { l: 1, q: r`Die Schnittstelle $x$ ist berechnet. Wie findet man die $y$-Koordinate?`, a: [r`Man setzt $x$ in eine der beiden Gleichungen ein.`, r`Man setzt $x=0$.`, r`Man addiert die beiden $y$-Achsenabschnitte.`, r`Man multipliziert die Steigungen.`], e: r`Beide Gleichungen liefern denselben Wert; das ist zugleich eine Probe.` },
      { l: 1, q: r`Wo schneiden sich $y=3$ und $y=x$?`, a: [r`Im Punkt $(3\,|\,3)$`, r`Im Punkt $(0\,|\,3)$`, r`Im Punkt $(3\,|\,0)$`, r`Gar nicht.`], e: r`$x=3$ und $y=3$.` },
      { l: 1, q: r`Wo schneiden sich $y=2x+1$ und $y=2x-3$?`, a: [r`Gar nicht, die Geraden sind parallel.`, r`Im Punkt $(0\,|\,1)$`, r`Im Punkt $(1\,|\,3)$`, r`In unendlich vielen Punkten.`], e: r`Gleiche Steigung, verschiedene $y$-Achsenabschnitte.` },
      { l: 1, q: r`Wie macht man die Probe für einen berechneten Schnittpunkt?`, a: [r`Man setzt ihn in beide Gleichungen ein.`, r`Man setzt ihn in eine Gleichung ein.`, r`Man berechnet die Steigungen neu.`, r`Man zeichnet eine dritte Gerade.`], e: r`Der Punkt muss beide Gleichungen erfüllen.` },
      { l: 1, q: r`Am Schnittpunkt haben beide Funktionen denselben Funktionswert.`, tf: true, e: r`Genau das drückt $f(x)=g(x)$ aus.` },

      { l: 2, q: r`Wo schneiden sich $y=3x-2$ und $y=-x+6$?`, a: [r`Im Punkt $(2\,|\,4)$`, r`Im Punkt $(4\,|\,2)$`, r`Im Punkt $(2\,|\,8)$`, r`Im Punkt $(1\,|\,1)$`], e: r`$3x-2=-x+6$ ergibt $4x=8$.` },
      { l: 2, q: r`Wo schneiden sich $y=\frac12x+1$ und $y=-\frac12x+5$?`, a: [r`Im Punkt $(4\,|\,3)$`, r`Im Punkt $(3\,|\,4)$`, r`Im Punkt $(8\,|\,5)$`, r`Im Punkt $(2\,|\,2)$`], e: r`$\frac12x+1=-\frac12x+5$ ergibt $x=4$.` },
      { l: 2, q: r`Welche Lösung hat das System $2x+y=7$ und $x-y=2$?`, a: [r`$x=3$, $y=1$`, r`$x=1$, $y=3$`, r`$x=2$, $y=3$`, r`$x=5$, $y=-3$`], e: r`Addieren der Gleichungen ergibt $3x=9$.` },
      { l: 2, q: r`Beim Gleichsetzen zweier Geraden entsteht $0=4$. Was bedeutet das?`, a: [r`Die Geraden sind parallel: kein Schnittpunkt.`, r`Die Schnittstelle ist $x=4$.`, r`Es gibt unendlich viele Schnittpunkte.`, r`Die Schnittstelle ist $x=0$.`], e: r`Eine falsche Aussage heisst: Kein $x$ erfüllt die Gleichung.` },
      { l: 2, q: r`Beim Gleichsetzen zweier Geraden entsteht $0=0$. Was bedeutet das?`, a: [r`Die Geraden sind gleich: unendlich viele gemeinsame Punkte.`, r`Es gibt keinen Schnittpunkt.`, r`Die Schnittstelle ist $x=0$.`, r`Es gibt genau einen Schnittpunkt.`], e: r`Eine immer wahre Aussage heisst: Jedes $x$ erfüllt die Gleichung.` },
      { l: 2, q: r`Schneiden sich zwei Geraden auf der $y$-Achse, so haben sie denselben $y$-Achsenabschnitt.`, tf: true, e: r`Beide gehen dann durch denselben Punkt $(0\,|\,q)$.` },
      { l: 2, q: r`Für welches $m$ schneiden sich $y=mx+1$ und $y=2x+3$ nicht?`, a: [r`$m=2$`, r`$m=-2$`, r`$m=\frac12$`, r`$m=0$`], e: r`Bei gleicher Steigung sind die Geraden parallel.` },
      { l: 2, q: r`Bei welchem $x$ schneiden sich $y=m_1x+q_1$ und $y=m_2x+q_2$ (mit $m_1\neq m_2$)?`, a: [r`$x=\frac{q_2-q_1}{m_1-m_2}$`, r`$x=\frac{q_1-q_2}{m_1-m_2}$`, r`$x=\frac{m_1-m_2}{q_2-q_1}$`, r`$x=q_1\cdot q_2$`], e: r`$m_1x+q_1=m_2x+q_2$ ergibt $(m_1-m_2)\,x=q_2-q_1$.` },
      { l: 2, q: r`Wo schneiden sich $y=2x-1$ und $y=-3x+9$?`, a: [r`Im Punkt $(2\,|\,3)$`, r`Im Punkt $(3\,|\,2)$`, r`Im Punkt $(2\,|\,5)$`, r`Im Punkt $(-2\,|\,-5)$`], e: r`$2x-1=-3x+9$ ergibt $5x=10$.` },
      { l: 2, q: r`In einer gemeinsamen Wertetabelle erkennt man die Schnittstelle daran, dass beide Funktionswerte gleich sind.`, tf: true, e: r`Davor ist die eine Funktion grösser, danach die andere.` },

      { l: 3, q: r`Gehen die drei Geraden $y=x$, $y=-x+4$ und $y=2x-2$ durch einen gemeinsamen Punkt?`, a: [r`Ja, durch $(2\,|\,2)$.`, r`Nein.`, r`Ja, durch $(1\,|\,1)$.`, r`Ja, durch $(4\,|\,0)$.`], e: r`Die ersten beiden schneiden sich in $(2\,|\,2)$, und $2\cdot2-2=2$ stimmt auch.` },
      { l: 3, q: r`Für welches $q$ geht $y=3x+q$ durch den Schnittpunkt von $y=x+1$ und $y=-x+5$?`, a: [r`$q=-3$`, r`$q=3$`, r`$q=-1$`, r`$q=9$`], e: r`Schnittpunkt $(2\,|\,3)$; $3=3\cdot2+q$.` },
      { l: 3, q: r`Wie gross ist die Fläche des Dreiecks zwischen $y=x$, $y=-x+4$ und der $x$-Achse?`, a: [r`$4$`, r`$8$`, r`$2$`, r`$6$`], e: r`Ecken $(0\,|\,0)$, $(4\,|\,0)$ und $(2\,|\,2)$: $\frac12\cdot4\cdot2$.` },
      { l: 3, q: r`Unter welchem Winkel schneiden sich $y=x$ und $y=-x$?`, a: [r`$90^\circ$`, r`$45^\circ$`, r`$60^\circ$`, r`$0^\circ$`], e: r`$1\cdot(-1)=-1$: Die Geraden stehen senkrecht aufeinander.` },
      { l: 3, q: r`Ein lineares Gleichungssystem mit zwei Gleichungen und zwei Unbekannten hat immer genau eine Lösung.`, tf: false, e: r`Bei parallelen Geraden gibt es keine Lösung, bei gleichen Geraden unendlich viele.` },
      { l: 3, q: r`Für welches $k$ haben $2x+ky=4$ und $x+2y=2$ unendlich viele gemeinsame Lösungen?`, a: [r`$k=4$`, r`$k=2$`, r`$k=1$`, r`$k=-4$`], e: r`Das Doppelte der zweiten Gleichung ist $2x+4y=4$.` },
      { l: 3, q: r`Für welches $m$ schneiden sich $y=mx+2$ und $y=x$ bei $x=4$?`, a: [r`$m=\frac12$`, r`$m=2$`, r`$m=-\frac12$`, r`$m=\frac32$`], e: r`$4m+2=4$.` },
      { l: 3, q: r`Für welches $q$ schneiden sich $y=2x+q$ und $y=-x+6$ auf der $x$-Achse?`, a: [r`$q=-12$`, r`$q=12$`, r`$q=-6$`, r`$q=6$`], e: r`$y=-x+6$ trifft die $x$-Achse bei $x=6$; dort muss auch $2\cdot6+q=0$ sein.` }
    ],

    // ───────────────────────── Anwendungen (Tarife, Bewegung) ─────────────────────────
    app: [
      { l: 1, q: r`Tarif A kostet 20 CHF Grundgebühr und 0.10 CHF pro Minute. Welche Funktion gibt die Kosten für $x$ Minuten an?`, a: [r`$K(x)=20+0.1x$`, r`$K(x)=0.1+20x$`, r`$K(x)=20.1x$`, r`$K(x)=20x$`], e: r`Die Grundgebühr fällt einmal an, der Minutenpreis für jede Minute.` },
      { l: 1, q: r`Was ist der Break-even zweier Tarife?`, a: [r`Die Stelle, an der beide gleich viel kosten.`, r`Der günstigste Tarif.`, r`Die Kosten bei 0 Minuten.`, r`Die höhere Grundgebühr.`], e: r`Im Bild ist das der Schnittpunkt der beiden Geraden.` },
      { l: 1, q: r`Tarif A: $20+0.1x$, Tarif B: $10+0.3x$ (CHF für $x$ Minuten). Wo liegt der Break-even?`, a: [r`Bei 50 Minuten`, r`Bei 100 Minuten`, r`Bei 25 Minuten`, r`Bei 30 Minuten`], e: r`$20+0.1x=10+0.3x$ ergibt $10=0.2x$.` },
      { l: 1, q: r`Wie viel kosten die Tarife A ($20+0.1x$) und B ($10+0.3x$) am Break-even bei 50 Minuten?`, a: [r`$25$ CHF`, r`$30$ CHF`, r`$20$ CHF`, r`$50$ CHF`], e: r`$20+0.1\cdot50=25$ und $10+0.3\cdot50=25$.` },
      { l: 1, q: r`Welcher der Tarife A ($20+0.1x$) und B ($10+0.3x$) ist für weniger als 50 Minuten günstiger?`, a: [r`Tarif B`, r`Tarif A`, r`Beide gleich`, r`Das hängt vom Tag ab.`], e: r`B hat die kleinere Grundgebühr und ist bis zum Break-even billiger.` },
      { l: 1, q: r`Eine Bewegung wird durch $s(t)=s_0+v\cdot t$ beschrieben. Was ist $s_0$?`, a: [r`Der Ort beim Start ($t=0$).`, r`Die Geschwindigkeit.`, r`Die Fahrzeit.`, r`Das Ziel.`], e: r`$s(0)=s_0$ ist der $y$-Achsenabschnitt im Weg-Zeit-Diagramm.` },
      { l: 1, q: r`Was ist $v$ in $s(t)=s_0+v\cdot t$?`, a: [r`Die Geschwindigkeit, also die Steigung der Geraden.`, r`Der Startort.`, r`Die Zeit.`, r`Der zurückgelegte Weg.`], e: r`Pro Zeiteinheit kommt der Weg $v$ dazu.` },
      { l: 1, q: r`Im Weg-Zeit-Diagramm gehört zur schnelleren Bewegung die steilere Gerade.`, tf: true, e: r`Die Steigung ist die Geschwindigkeit.` },
      { l: 1, q: r`Ein Auto startet bei Kilometer 0 und fährt mit 60 km/h. Wo ist es nach 2 Stunden?`, a: [r`Bei Kilometer 120`, r`Bei Kilometer 30`, r`Bei Kilometer 62`, r`Bei Kilometer 60`], e: r`$s(2)=60\cdot2$.` },
      { l: 1, q: r`Was bedeutet der Schnittpunkt zweier Weg-Zeit-Geraden?`, a: [r`Zeitpunkt und Ort, an dem sich die beiden treffen.`, r`Den Zeitpunkt, an dem beide starten.`, r`Den Ort, an dem beide anhalten.`, r`Die gemeinsame Geschwindigkeit.`], e: r`Zur selben Zeit am selben Ort: Das ist der Treffpunkt.` },
      { l: 1, q: r`Was bedeutet die Steigung der Geraden bei einem Tarif?`, a: [r`Den Preis pro Einheit, zum Beispiel pro Minute.`, r`Die Grundgebühr.`, r`Die Gesamtkosten.`, r`Die Anzahl Minuten.`], e: r`Mit jeder weiteren Einheit steigen die Kosten um diesen Betrag.` },
      { l: 1, q: r`Die Grundgebühr ist der $y$-Achsenabschnitt des Kostengraphen.`, tf: true, e: r`Sie ist der Wert bei $x=0$.` },

      { l: 2, q: r`Ein Velo startet bei Kilometer 0 mit 20 km/h, eine Fussgängerin gleichzeitig bei Kilometer 10 mit 5 km/h in dieselbe Richtung. Nach welcher Zeit holt das Velo sie ein?`, a: [r`Nach 40 Minuten`, r`Nach 30 Minuten`, r`Nach 1 Stunde`, r`Nach 2 Stunden`], e: r`$20t=10+5t$ ergibt $t=\frac23$ h.` },
      { l: 2, q: r`Velo ($20t$) und Fussgängerin ($10+5t$): Bei welchem Kilometer treffen sie sich?`, a: [r`Bei etwa Kilometer 13.3`, r`Bei Kilometer 10`, r`Bei Kilometer 20`, r`Bei Kilometer 15`], e: r`$20\cdot\frac23=\frac{40}{3}$.` },
      { l: 2, q: r`Zwei Züge fahren aus 300 km Entfernung aufeinander zu, der eine mit 100 km/h, der andere mit 50 km/h. Nach welcher Zeit treffen sie sich?`, a: [r`Nach 2 Stunden`, r`Nach 3 Stunden`, r`Nach 6 Stunden`, r`Nach 1.5 Stunden`], e: r`$100t=300-50t$ ergibt $150t=300$.` },
      { l: 2, q: r`Die beiden Züge (100 km/h und 50 km/h, 300 km Abstand) treffen sich. Wie weit ist das vom Startort des schnelleren Zuges?`, a: [r`$200$ km`, r`$100$ km`, r`$150$ km`, r`$250$ km`], e: r`In 2 Stunden fährt der schnellere Zug $100\cdot2$ km.` },
      { l: 2, q: r`Haben zwei Tarife den gleichen Preis pro Minute, aber verschiedene Grundgebühren, so gibt es keinen Break-even.`, tf: true, e: r`Die Geraden sind parallel; der Tarif mit der kleineren Grundgebühr ist immer günstiger.` },
      { l: 2, q: r`Automiete A kostet $50+0.5x$ CHF, Automiete B kostet $80+0.2x$ CHF für $x$ km. Ab welcher Strecke ist B günstiger?`, a: [r`Ab mehr als 100 km`, r`Ab mehr als 60 km`, r`Ab mehr als 150 km`, r`Ab mehr als 43 km`], e: r`$50+0.5x=80+0.2x$ ergibt $0.3x=30$.` },
      { l: 2, q: r`Was bedeutet eine fallende Gerade im Weg-Zeit-Diagramm?`, a: [r`Die Bewegung führt zurück in Richtung Ausgangspunkt.`, r`Es wird gebremst.`, r`Die Bewegung steht still.`, r`Die Bewegung wird schneller.`], e: r`Der Ort $s$ nimmt ab; die Geschwindigkeit ist negativ.` },
      { l: 2, q: r`Was bedeutet ein waagrechtes Stück im Weg-Zeit-Diagramm?`, a: [r`Stillstand.`, r`Konstante Geschwindigkeit.`, r`Beschleunigung.`, r`Das Ende der Messung.`], e: r`Die Zeit läuft weiter, der Ort ändert sich nicht.` },
      { l: 2, q: r`Eine Kerze ist 20 cm lang und brennt pro Stunde 2 cm ab. Nach welcher Zeit ist sie abgebrannt?`, a: [r`Nach 10 Stunden`, r`Nach 20 Stunden`, r`Nach 5 Stunden`, r`Nach 40 Stunden`], e: r`$h(t)=20-2t=0$ ergibt $t=10$: die Nullstelle.` },
      { l: 2, q: r`Ein Auto hat 60 l im Tank und verbraucht 8 l auf 100 km. Wie weit kommt es?`, a: [r`$750$ km`, r`$480$ km`, r`$600$ km`, r`$800$ km`], e: r`$60-0.08x=0$ ergibt $x=750$.` },

      { l: 3, q: r`Tarif A: $20+0.1x$, Tarif B: $10+0.3x$, Tarif C: pauschal 35 CHF. Ab wie vielen Minuten ist C der günstigste?`, a: [r`Ab mehr als 150 Minuten`, r`Ab mehr als 83 Minuten`, r`Ab mehr als 250 Minuten`, r`Ab mehr als 50 Minuten`], e: r`C muss billiger sein als A ($x>150$) und als B ($x>83.3$); entscheidend ist die grössere Grenze.` },
      { l: 3, q: r`Auto A fährt um 0 Uhr mit 60 km/h los, Auto B eine Stunde später vom selben Ort mit 90 km/h hinterher. Wie lange nach dem Start von A holt B es ein?`, a: [r`Nach 3 Stunden`, r`Nach 2 Stunden`, r`Nach 1.5 Stunden`, r`Nach 4 Stunden`], e: r`$60t=90\,(t-1)$ ergibt $30t=90$.` },
      { l: 3, q: r`Jemand fährt eine Strecke mit 60 km/h hin und mit 40 km/h zurück. Wie gross ist die Durchschnittsgeschwindigkeit?`, a: [r`$48$ km/h`, r`$50$ km/h`, r`$45$ km/h`, r`$52$ km/h`], e: r`Für je 120 km: 2 h hin, 3 h zurück, also 240 km in 5 h. Die langsame Fahrt dauert länger.` },
      { l: 3, q: r`Fährt man die erste Hälfte der Zeit mit 60 km/h und die zweite Hälfte der Zeit mit 40 km/h, so ist die Durchschnittsgeschwindigkeit 50 km/h.`, tf: true, e: r`Bei gleichen Zeiten darf man die Geschwindigkeiten mitteln, bei gleichen Strecken nicht.` },
      { l: 3, q: r`Eine Kerze ist 30 cm lang und brennt 3 cm pro Stunde ab, eine zweite ist 20 cm lang und brennt 1 cm pro Stunde ab. Wann sind beide gleich lang?`, a: [r`Nach 5 Stunden`, r`Nach 10 Stunden`, r`Nach 2.5 Stunden`, r`Nie`], e: r`$30-3t=20-t$ ergibt $t=5$; beide sind dann 15 cm lang.` },
      { l: 3, q: r`Die Kosten sind $K(x)=200+5x$, der Erlös ist $E(x)=13x$ (CHF für $x$ Stück). Ab welcher Stückzahl entsteht Gewinn?`, a: [r`Ab mehr als 25 Stück`, r`Ab mehr als 15 Stück`, r`Ab mehr als 40 Stück`, r`Ab mehr als 11 Stück`], e: r`$13x>200+5x$ ergibt $8x>200$.` },
      { l: 3, q: r`Zwischen Grad Celsius und Grad Fahrenheit gilt $F=1.8\,C+32$. Bei welcher Temperatur zeigen beide Skalen dieselbe Zahl?`, a: [r`Bei $-40$`, r`Bei $0$`, r`Bei $32$`, r`Bei $-32$`], e: r`$C=1.8\,C+32$ ergibt $-0.8\,C=32$.` },
      { l: 3, q: r`Beim Tarif $K(x)=20+0.1x$ kostet die doppelte Gesprächszeit doppelt so viel.`, tf: false, e: r`Die Grundgebühr verdoppelt sich nicht: $K(100)=30$, aber $K(200)=40$.` }
    ],

    // ───────────────────────── Nullstelle, Senkrechte, Mittelsenkrechte ─────────────────────────
    perp: [
      { l: 1, q: r`Welche Nullstelle hat $f(x)=2x-6$?`, a: [r`$x=3$`, r`$x=-3$`, r`$x=6$`, r`$x=-6$`], e: r`$2x-6=0$ ergibt $x=3$.` },
      { l: 1, q: r`Was ist die Nullstelle einer Geraden im Bild?`, a: [r`Die Stelle, an der sie die $x$-Achse schneidet.`, r`Die Stelle, an der sie die $y$-Achse schneidet.`, r`Der Ursprung.`, r`Der höchste Punkt.`], e: r`Dort ist $f(x)=0$.` },
      { l: 1, q: r`Welche Nullstelle hat $f(x)=mx+q$ (mit $m\neq0$)?`, a: [r`$x=-\frac{q}{m}$`, r`$x=\frac{q}{m}$`, r`$x=-\frac{m}{q}$`, r`$x=m\cdot q$`], e: r`$mx+q=0$ ergibt $mx=-q$.` },
      { l: 1, q: r`Eine Gerade hat die Steigung 2. Welche Steigung hat eine Senkrechte dazu?`, a: [r`$-\frac12$`, r`$\frac12$`, r`$-2$`, r`$2$`], e: r`Kehrwert mit umgekehrtem Vorzeichen: $-\frac1m$.` },
      { l: 1, q: r`Was ist das Lot von einem Punkt $P$ auf eine Gerade $g$?`, a: [r`Die Strecke von $P$ zur Geraden, die senkrecht auf $g$ steht.`, r`Die Parallele zu $g$ durch $P$.`, r`Die Strecke von $P$ zur $x$-Achse.`, r`Die Verbindung von $P$ mit dem Ursprung.`], e: r`Das Lot ist der kürzeste Weg von $P$ zur Geraden.` },
      { l: 1, q: r`Was ist der Lotfusspunkt $F$?`, a: [r`Der Punkt, in dem das Lot die Gerade trifft.`, r`Der Mittelpunkt der Geraden.`, r`Die Nullstelle der Geraden.`, r`Der Punkt $P$ selbst.`], e: r`$F$ ist der Punkt der Geraden, der $P$ am nächsten liegt.` },
      { l: 1, q: r`Was ist die Mittelsenkrechte der Strecke $AB$?`, a: [r`Die Gerade durch den Mittelpunkt von $AB$, senkrecht zu $AB$.`, r`Die Parallele zu $AB$ durch den Mittelpunkt.`, r`Die Senkrechte zu $AB$ durch $A$.`, r`Die Gerade durch $A$ und $B$.`], e: r`«Mittel-» für den Mittelpunkt, «-senkrechte» für den rechten Winkel.` },
      { l: 1, q: r`Jeder Punkt der Mittelsenkrechten ist von $A$ und $B$ gleich weit entfernt.`, tf: true, e: r`Die Mittelsenkrechte ist die Symmetrieachse der Strecke $AB$.` },
      { l: 1, q: r`Welchen Mittelpunkt hat die Strecke von $A(0\,|\,0)$ nach $B(4\,|\,2)$?`, a: [r`$(2\,|\,1)$`, r`$(4\,|\,2)$`, r`$(2\,|\,2)$`, r`$(1\,|\,2)$`], e: r`Mittelwerte der Koordinaten.` },
      { l: 1, q: r`Welche Nullstelle hat $f(x)=-x+5$?`, a: [r`$x=5$`, r`$x=-5$`, r`$x=1$`, r`$x=0$`], e: r`$-x+5=0$ ergibt $x=5$.` },
      { l: 1, q: r`Die waagrechte Gerade $y=3$ hat eine Nullstelle.`, tf: false, e: r`Sie verläuft überall auf der Höhe 3 und trifft die $x$-Achse nie.` },
      { l: 1, q: r`Eine Gerade hat die Steigung $-3$. Welche Steigung hat eine Senkrechte dazu?`, a: [r`$\frac13$`, r`$-\frac13$`, r`$3$`, r`$-3$`], e: r`$-\frac{1}{-3}=\frac13$.` },

      { l: 2, q: r`Welche Nullstelle hat $f(x)=\frac12x+3$?`, a: [r`$x=-6$`, r`$x=6$`, r`$x=-\frac32$`, r`$x=-3$`], e: r`$\frac12x=-3$ ergibt $x=-6$.` },
      { l: 2, q: r`Vom Punkt $P(0\,|\,5)$ wird das Lot auf die Gerade $y=2x$ gefällt. Welcher Lotfusspunkt ergibt sich?`, a: [r`$F(2\,|\,4)$`, r`$F(1\,|\,2)$`, r`$F(2\,|\,1)$`, r`$F(0\,|\,0)$`], e: r`Lot: $y=-\frac12x+5$. Schnitt mit $y=2x$: $2x=-\frac12x+5$ ergibt $x=2$.` },
      { l: 2, q: r`Wie weit ist $P(0\,|\,5)$ von der Geraden $y=2x$ entfernt (Lotfusspunkt $F(2\,|\,4)$)?`, a: [r`$\sqrt5$`, r`$5$`, r`$2$`, r`$\sqrt{20}$`], e: r`$|PF|=\sqrt{2^2+1^2}$.` },
      { l: 2, q: r`Welche Mittelsenkrechte hat die Strecke von $A(0\,|\,0)$ nach $B(4\,|\,0)$?`, a: [r`Die senkrechte Gerade $x=2$`, r`Die waagrechte Gerade $y=2$`, r`Die Gerade $y=x$`, r`Die senkrechte Gerade $x=4$`], e: r`$AB$ ist waagrecht, der Mittelpunkt ist $(2\,|\,0)$.` },
      { l: 2, q: r`Welche Mittelsenkrechte hat die Strecke von $A(0\,|\,0)$ nach $B(2\,|\,4)$?`, a: [r`$y=-\frac12x+2.5$`, r`$y=-\frac12x+2$`, r`$y=2x$`, r`$y=\frac12x+1.5$`], e: r`Mittelpunkt $(1\,|\,2)$, Steigung von $AB$ ist 2, also $m=-\frac12$; $2=-\frac12+q$.` },
      { l: 2, q: r`Der Lotfusspunkt ist der Punkt der Geraden, der $P$ am nächsten liegt.`, tf: true, e: r`Jeder andere Punkt der Geraden bildet mit $P$ und $F$ ein rechtwinkliges Dreieck, in dem er an der längeren Seite (Hypotenuse) liegt.` },
      { l: 2, q: r`Welche Gerade steht senkrecht auf $y=3$ und geht durch $(2\,|\,1)$?`, a: [r`$x=2$`, r`$y=1$`, r`$y=-\frac13x$`, r`$y=2$`], e: r`Die Senkrechte zu einer waagrechten Geraden ist senkrecht; sie hat keine Steigung.` },
      { l: 2, q: r`Wann hat $f(x)=mx+q$ keine Nullstelle?`, a: [r`Wenn $m=0$ und $q\neq0$ ist.`, r`Immer, wenn $m=0$ ist.`, r`Wenn $q=0$ ist.`, r`Wenn $m<0$ ist.`], e: r`Eine waagrechte Gerade, die nicht auf der $x$-Achse liegt, trifft diese nie.` },
      { l: 2, q: r`$f(x)=3x+q$ hat die Nullstelle $x=2$. Wie gross ist $q$?`, a: [r`$q=-6$`, r`$q=6$`, r`$q=-\frac23$`, r`$q=\frac23$`], e: r`$3\cdot2+q=0$.` },
      { l: 2, q: r`Wo schneiden sich die drei Mittelsenkrechten eines Dreiecks?`, a: [r`Im Umkreismittelpunkt.`, r`Im Schwerpunkt.`, r`Im Inkreismittelpunkt.`, r`Im Höhenschnittpunkt.`], e: r`Dieser Punkt ist von allen drei Ecken gleich weit entfernt.` },

      { l: 3, q: r`Wie weit ist $P(3\,|\,4)$ von der Geraden $y=x$ entfernt?`, a: [r`$\frac{\sqrt2}{2}$`, r`$1$`, r`$\frac12$`, r`$\sqrt2$`], e: r`Lot: $y=-x+7$, Fusspunkt $F(3.5\,|\,3.5)$; $|PF|=\sqrt{0.5^2+0.5^2}$.` },
      { l: 3, q: r`$P(0\,|\,5)$ wird an der Geraden $y=2x$ gespiegelt (Lotfusspunkt $F(2\,|\,4)$). Wo liegt der Spiegelpunkt?`, a: [r`$P'(4\,|\,3)$`, r`$P'(2\,|\,4)$`, r`$P'(5\,|\,0)$`, r`$P'(4\,|\,8)$`], e: r`Von $P$ nach $F$ geht es 2 nach rechts und 1 nach unten; dasselbe noch einmal ab $F$.` },
      { l: 3, q: r`Welche Mittelsenkrechte hat die Strecke von $A(1\,|\,1)$ nach $B(5\,|\,3)$?`, a: [r`$y=-2x+8$`, r`$y=-2x+2$`, r`$y=2x-4$`, r`$y=-\frac12x+3.5$`], e: r`Mittelpunkt $(3\,|\,2)$, Steigung von $AB$ ist $\frac12$, also $m=-2$; $2=-6+q$.` },
      { l: 3, q: r`Welcher Punkt der $x$-Achse ist von $A(0\,|\,2)$ und $B(4\,|\,0)$ gleich weit entfernt?`, a: [r`$(1.5\,|\,0)$`, r`$(2\,|\,0)$`, r`$(1\,|\,0)$`, r`$(3\,|\,0)$`], e: r`Mittelsenkrechte von $AB$: $y=2x-3$; sie trifft die $x$-Achse bei $x=1.5$. Beide Abstände sind 2.5.` },
      { l: 3, q: r`Die Mittelsenkrechten eines rechtwinkligen Dreiecks schneiden sich im Mittelpunkt der Hypotenuse.`, tf: true, e: r`Das ist der Satz des Thales: Der Umkreis hat die Hypotenuse als Durchmesser.` },
      { l: 3, q: r`Welchen Abstand haben die parallelen Geraden $y=x$ und $y=x+2$?`, a: [r`$\sqrt2$`, r`$2$`, r`$1$`, r`$2\sqrt2$`], e: r`Der senkrechte Abstand ist kleiner als der Abstand 2 in $y$-Richtung: $2\cdot\cos45^\circ$.` },
      { l: 3, q: r`Für welches $m$ steht $y=mx+1$ senkrecht auf der Geraden $2x+3y=6$?`, a: [r`$m=\frac32$`, r`$m=-\frac32$`, r`$m=\frac23$`, r`$m=-\frac23$`], e: r`$2x+3y=6$ hat die Steigung $-\frac23$; die Senkrechte dazu $\frac32$.` },
      { l: 3, q: r`Welcher Punkt der Geraden $x+y=4$ liegt dem Ursprung am nächsten?`, a: [r`$(2\,|\,2)$`, r`$(4\,|\,0)$`, r`$(0\,|\,4)$`, r`$(1\,|\,3)$`], e: r`Das Lot vom Ursprung hat die Steigung 1, also $y=x$; eingesetzt: $2x=4$.` }
    ]
  };
})();
