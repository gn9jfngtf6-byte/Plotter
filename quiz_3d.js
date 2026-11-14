// quiz_3d.js — Quizfragen zur Vektorgeometrie (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  const V = (a, b, c) => r`\begin{pmatrix}${a}\\${b}\\${c}\end{pmatrix}`;   // Spaltenvektor
  const P = (a, b, c) => r`(${a}\,|\,${b}\,|\,${c})`;                       // Punkt
  (window.QUIZ_DATA = window.QUIZ_DATA || {})['3d'] = {

    // ───────────────────────── Ebenen entdecken ─────────────────────────
    pl: [
      { l: 1, q: r`Wie lautet die Koordinatenform einer Ebene?`, a: [r`$a\,x+b\,y+c\,z=d$`, r`$y=m\,x+q$`, r`$x^2+y^2+z^2=r^2$`, r`$a\,x+b\,y=c\,z^2$`], e: r`Eine lineare Gleichung in $x$, $y$ und $z$.` },
      { l: 1, q: r`Welchen Normalenvektor hat die Ebene $2x+3y-z=6$?`, a: [r`$${V(2, 3, -1)}$`, r`$${V(2, 3, 6)}$`, r`$${V(3, 2, -6)}$`, r`$${V(2, 3, 1)}$`], e: r`Die Koeffizienten von $x$, $y$ und $z$.` },
      { l: 1, q: r`Was ist der Normalenvektor einer Ebene?`, a: [r`Ein Vektor, der senkrecht auf der Ebene steht.`, r`Ein Vektor, der in der Ebene liegt.`, r`Der Ortsvektor eines Punktes der Ebene.`, r`Der kürzeste Vektor der Ebene.`], e: r`Er legt fest, wie die Ebene im Raum geneigt ist.` },
      { l: 1, q: r`Wo schneidet die Ebene $2x+3y-z=6$ die $x$-Achse?`, a: [r`Bei $x=3$`, r`Bei $x=2$`, r`Bei $x=6$`, r`Bei $x=-6$`], e: r`$y=0$ und $z=0$ setzen: $2x=6$.` },
      { l: 1, q: r`Liegt der Punkt $${P(1, 1, 1)}$ in der Ebene $x+y+z=3$?`, a: [r`Ja, denn $1+1+1=3$.`, r`Nein, denn $1+1+1\ne1$.`, r`Nein, kein Punkt mit gleichen Koordinaten liegt in einer Ebene.`, r`Das lässt sich nicht sagen.`], e: r`Koordinaten einsetzen und prüfen.` },
      { l: 1, q: r`Wie findet man den Achsenabschnitt einer Ebene auf der $z$-Achse?`, a: [r`Man setzt $x=0$ und $y=0$.`, r`Man setzt $z=0$.`, r`Man setzt $x=y=z$.`, r`Man setzt $d=0$.`], e: r`Auf der $z$-Achse sind die beiden anderen Koordinaten 0.` },
      { l: 1, q: r`Welche Ebene beschreibt $z=0$?`, a: [r`Die $xy$-Ebene`, r`Die $xz$-Ebene`, r`Die $yz$-Ebene`, r`Die $z$-Achse`], e: r`Alle Punkte mit der Höhe 0.` },
      { l: 1, q: r`Eine Ebene $a\,x+b\,y+c\,z=d$ geht genau dann durch den Ursprung, wenn $d=0$ ist.`, tf: true, e: r`Einsetzen von $${P(0, 0, 0)}$ ergibt links 0.` },
      { l: 1, q: r`Liegt der Ursprung in der Ebene $2x+3y-z=6$?`, a: [r`Nein, denn $0\ne6$.`, r`Ja.`, r`Nur wenn man $z=-6$ setzt.`, r`Das hängt vom Normalenvektor ab.`], e: r`Einsetzen ergibt $0=6$, und das ist falsch.` },
      { l: 1, q: r`Was ist eine Spurgerade?`, a: [r`Die Schnittgerade der Ebene mit einer Koordinatenebene.`, r`Eine Gerade senkrecht zur Ebene.`, r`Die Gerade durch den Ursprung und den Normalenvektor.`, r`Eine Koordinatenachse.`], e: r`Sie verbindet zwei Achsenabschnitte.` },
      { l: 1, q: r`Was haben zwei nicht parallele Ebenen gemeinsam?`, a: [r`Eine Gerade`, r`Einen Punkt`, r`Nichts`, r`Einen Kreis`], e: r`Die Schnittgerade.` },
      { l: 1, q: r`$x+y+z=1$ und $2x+2y+2z=2$ beschreiben dieselbe Ebene.`, tf: true, e: r`Die zweite Gleichung ist das Doppelte der ersten.` },

      { l: 2, q: r`Welche Achsenabschnitte hat die Ebene $2x+3y-z=6$ auf der $x$-, $y$- und $z$-Achse?`, a: [r`$3$, $2$ und $-6$`, r`$2$, $3$ und $-1$`, r`$3$, $2$ und $6$`, r`$12$, $18$ und $-6$`], e: r`Jeweils 6 durch den Koeffizienten.` },
      { l: 2, q: r`Wie liegen die Ebenen $x+2y-z=1$ und $2x+4y-2z=5$ zueinander?`, a: [r`Parallel und verschieden`, r`Identisch`, r`Sie schneiden sich in einer Geraden.`, r`Senkrecht`], e: r`Die Normalenvektoren sind Vielfache, die rechten Seiten passen aber nicht: $2\cdot1\ne5$.` },
      { l: 2, q: r`Wie liegt die Ebene $x=2$?`, a: [r`Parallel zur $yz$-Ebene`, r`Parallel zur $xy$-Ebene`, r`Sie enthält die $x$-Achse.`, r`Sie geht durch den Ursprung.`], e: r`$y$ und $z$ sind frei, $x$ ist fest.` },
      { l: 2, q: r`Welche Ebene hat die Achsenabschnitte 1, 2 und 3 (auf der $x$-, $y$- und $z$-Achse)?`, a: [r`$6x+3y+2z=6$`, r`$x+2y+3z=6$`, r`$x+2y+3z=1$`, r`$3x+2y+z=6$`], e: r`$\frac x1+\frac y2+\frac z3=1$, mit 6 multipliziert.` },
      { l: 2, q: r`Welche Ebene hat den Normalenvektor $${V(1, 2, 3)}$ und geht durch $${P(1, 1, 1)}$?`, a: [r`$x+2y+3z=6$`, r`$x+2y+3z=1$`, r`$x+y+z=6$`, r`$x+2y+3z=0$`], e: r`Punkt einsetzen: $1+2+3=6$.` },
      { l: 2, q: r`Wie liegt die Ebene $2x+3y=6$ im Raum?`, a: [r`Parallel zur $z$-Achse`, r`Parallel zur $xy$-Ebene`, r`Senkrecht zur $z$-Achse`, r`Das ist keine Ebene, sondern eine Gerade.`], e: r`$z$ kommt nicht vor und ist deshalb frei. Im Raum ist das eine Ebene.` },
      { l: 2, q: r`Welche Gleichung hat die Spurgerade der Ebene $2x+3y-z=6$ in der $xy$-Ebene?`, a: [r`$2x+3y=6$ (mit $z=0$)`, r`$2x-z=6$ (mit $y=0$)`, r`$3y-z=6$ (mit $x=0$)`, r`$2x+3y=0$`], e: r`In der $xy$-Ebene ist $z=0$.` },
      { l: 2, q: r`Die Normalenvektoren paralleler Ebenen sind Vielfache voneinander.`, tf: true, e: r`Beide stehen auf derselben Richtung senkrecht.` },
      { l: 2, q: r`Was haben drei Ebenen in allgemeiner Lage gemeinsam?`, a: [r`Genau einen Punkt`, r`Eine Gerade`, r`Nichts`, r`Eine Ebene`], e: r`Wie drei Gleichungen mit drei Unbekannten: eine Lösung.` },
      { l: 2, q: r`Welche Ebene steht senkrecht auf der Ebene $x+y+z=1$?`, a: [r`$x-y=3$`, r`$2x+2y+2z=5$`, r`$x+y=0$`, r`$x+y-z=0$`], e: r`Die Normalenvektoren müssen senkrecht stehen: $1\cdot1+1\cdot(-1)+1\cdot0=0$.` },

      { l: 3, q: r`Welche Richtung hat die Schnittgerade der Ebenen $x+y+z=3$ und $x-y=0$?`, a: [r`$${V(1, 1, -2)}$`, r`$${V(1, -1, 0)}$`, r`$${V(1, 1, 1)}$`, r`$${V(2, 0, 1)}$`], e: r`Sie steht senkrecht auf beiden Normalenvektoren: $1+1-2=0$ und $1-1=0$.` },
      { l: 3, q: r`In welchem Punkt schneiden sich die Ebenen $x+y+z=6$, $y+z=5$ und $z=3$?`, a: [r`$${P(1, 2, 3)}$`, r`$${P(3, 2, 1)}$`, r`$${P(2, 1, 3)}$`, r`$${P(1, 3, 2)}$`], e: r`Von unten nach oben einsetzen.` },
      { l: 3, q: r`Welche Ebene geht durch $${P(1, 0, 0)}$, $${P(0, 1, 0)}$ und $${P(0, 0, 1)}$?`, a: [r`$x+y+z=1$`, r`$x+y+z=3$`, r`$x+y+z=0$`, r`$x\cdot y\cdot z=0$`], e: r`Alle drei Achsenabschnitte sind 1.` },
      { l: 3, q: r`Drei Ebenen haben immer mindestens einen gemeinsamen Punkt.`, tf: false, e: r`Zwei davon können parallel sein, oder die drei Schnittgeraden sind zueinander parallel (wie die Seiten eines Prismas).` },
      { l: 3, q: r`Welchen Winkel schliessen die Ebenen $z=0$ und $y+z=0$ ein?`, a: [r`$45^\circ$`, r`$90^\circ$`, r`$60^\circ$`, r`$30^\circ$`], e: r`Winkel zwischen den Normalenvektoren $${V(0, 0, 1)}$ und $${V(0, 1, 1)}$: $\cos\varphi=\frac{1}{\sqrt2}$.` },
      { l: 3, q: r`Welche Ebene ist parallel zu $x+2y-2z=3$ und geht durch den Ursprung?`, a: [r`$x+2y-2z=0$`, r`$x+2y-2z=-3$`, r`$2x-y=0$`, r`$x+2y+2z=0$`], e: r`Gleicher Normalenvektor, und $d=0$.` },
      { l: 3, q: r`In welchem Punkt durchstösst die $z$-Achse die Ebene $2x+3y+4z=12$?`, a: [r`$${P(0, 0, 3)}$`, r`$${P(0, 0, 4)}$`, r`$${P(6, 4, 3)}$`, r`$${P(0, 0, 12)}$`], e: r`$x=y=0$: $4z=12$.` },
      { l: 3, q: r`Die Ebene $2x+3y+z=6$ schneidet mit den drei Koordinatenebenen eine Pyramide ab. Welches Volumen hat sie?`, a: [r`$6$`, r`$36$`, r`$18$`, r`$12$`], e: r`Achsenabschnitte 3, 2 und 6: $V=\frac16\cdot3\cdot2\cdot6$.` }
    ],

    // ───────────────────────── Punkte und Vektoren ─────────────────────────
    vec: [
      { l: 1, q: r`Wie berechnet man den Vektor $\overrightarrow{AB}$ aus den Punkten $A$ und $B$?`, a: [r`$B-A$ (Spitze minus Fuss)`, r`$A-B$`, r`$A+B$`, r`$\frac12\,(A+B)$`], e: r`Man zieht die Koordinaten des Anfangspunkts von denen des Endpunkts ab.` },
      { l: 1, q: r`Es ist $A${P(1, 2, 3)}$ und $B${P(4, 6, 3)}$. Wie lautet $\overrightarrow{AB}$?`, a: [r`$${V(3, 4, 0)}$`, r`$${V(-3, -4, 0)}$`, r`$${V(5, 8, 6)}$`, r`$${V(4, 12, 9)}$`], e: r`$4-1$, $6-2$, $3-3$.` },
      { l: 1, q: r`Wie lang ist der Vektor $${V(3, 4, 0)}$?`, a: [r`$5$`, r`$7$`, r`$25$`, r`$12$`], e: r`$\sqrt{9+16+0}$.` },
      { l: 1, q: r`Was ist der Ortsvektor eines Punktes $A$?`, a: [r`Der Vektor vom Ursprung zum Punkt $A$.`, r`Der Vektor von $A$ zum Ursprung.`, r`Ein Vektor der Länge 1.`, r`Der Vektor von $A$ zu einem beliebigen Punkt.`], e: r`Er hat dieselben Koordinaten wie der Punkt.` },
      { l: 1, q: r`Wie berechnet man den Mittelpunkt $M$ der Strecke $AB$?`, a: [r`$M=\frac12\,(A+B)$`, r`$M=B-A$`, r`$M=\frac12\,(B-A)$`, r`$M=A+B$`], e: r`Der Durchschnitt der Koordinaten.` },
      { l: 1, q: r`Welchen Mittelpunkt hat die Strecke von $${P(0, 0, 0)}$ nach $${P(2, 4, 6)}$?`, a: [r`$${P(1, 2, 3)}$`, r`$${P(2, 4, 6)}$`, r`$${P(4, 8, 12)}$`, r`$${P(1, 1, 1)}$`], e: r`Jede Koordinate halbieren.` },
      { l: 1, q: r`Wie berechnet man die Länge eines Vektors mit den Komponenten $v_1$, $v_2$, $v_3$?`, a: [r`$\sqrt{v_1^2+v_2^2+v_3^2}$`, r`$v_1+v_2+v_3$`, r`$v_1^2+v_2^2+v_3^2$`, r`$\sqrt{v_1+v_2+v_3}$`], e: r`Pythagoras im Raum.` },
      { l: 1, q: r`Die Vektoren $\overrightarrow{AB}$ und $\overrightarrow{BA}$ sind gleich lang.`, tf: true, e: r`Sie zeigen in entgegengesetzte Richtungen, verbinden aber dieselben Punkte.` },
      { l: 1, q: r`Was ergibt $${V(1, 2, 3)}+${V(4, 0, -1)}$?`, a: [r`$${V(5, 2, 2)}$`, r`$${V(4, 0, -3)}$`, r`$${V(5, 2, 4)}$`, r`$${V(-3, 2, 4)}$`], e: r`Komponente für Komponente addieren.` },
      { l: 1, q: r`Was ergibt $2\cdot${V(1, -2, 3)}$?`, a: [r`$${V(2, -4, 6)}$`, r`$${V(3, 0, 5)}$`, r`$${V(2, -2, 3)}$`, r`$${V(2, 4, 6)}$`], e: r`Jede Komponente wird verdoppelt.` },
      { l: 1, q: r`Welches ist der Gegenvektor von $${V(1, -2, 3)}$?`, a: [r`$${V(-1, 2, -3)}$`, r`$${V(1, 2, 3)}$`, r`$${V(3, -2, 1)}$`, r`$${V(-1, -2, -3)}$`], e: r`Alle Vorzeichen wechseln.` },
      { l: 1, q: r`Es gilt $\overrightarrow{AB}=A-B$.`, tf: false, e: r`Richtig ist $B-A$: Spitze minus Fuss.` },

      { l: 2, q: r`Wie lang ist der Vektor $${V(1, 2, 2)}$?`, a: [r`$3$`, r`$5$`, r`$9$`, r`$\sqrt5$`], e: r`$\sqrt{1+4+4}$.` },
      { l: 2, q: r`$M${P(2, 2, 5)}$ ist der Mittelpunkt von $AB$ mit $A${P(1, 2, 3)}$. Wo liegt $B$?`, a: [r`$${P(3, 2, 7)}$`, r`$${P(1.5, 2, 4)}$`, r`$${P(1, 0, 2)}$`, r`$${P(0, 2, 1)}$`], e: r`$B=2M-A$.` },
      { l: 2, q: r`Wie weit sind $A${P(1, 1, 1)}$ und $B${P(3, 4, 7)}$ voneinander entfernt?`, a: [r`$7$`, r`$11$`, r`$49$`, r`$\sqrt{11}$`], e: r`$\overrightarrow{AB}=${V(2, 3, 6)}$, Länge $\sqrt{4+9+36}$.` },
      { l: 2, q: r`Was ergibt $\overrightarrow{AB}+\overrightarrow{BC}$?`, a: [r`$\overrightarrow{AC}$`, r`$\overrightarrow{CA}$`, r`$\overrightarrow{BB}$`, r`Den Nullvektor`], e: r`Von $A$ über $B$ nach $C$ ist dasselbe wie direkt von $A$ nach $C$.` },
      { l: 2, q: r`Welcher Vektor hat die Länge 1 und die Richtung von $${V(0, 3, 4)}$?`, a: [r`$${V(0, 0.6, 0.8)}$`, r`$${V(0, 1, 1)}$`, r`$${V(1, 3, 4)}$`, r`$${V(0, 0.3, 0.4)}$`], e: r`Durch die Länge 5 teilen.` },
      { l: 2, q: r`Welcher Vektor ist parallel zu $${V(1, 2, 3)}$?`, a: [r`$${V(-2, -4, -6)}$`, r`$${V(2, 3, 4)}$`, r`$${V(3, 2, 1)}$`, r`$${V(1, 4, 9)}$`], e: r`Er ist das $(-2)$-Fache.` },
      { l: 2, q: r`$ABCD$ ist ein Parallelogramm mit $A${P(0, 0, 0)}$, $B${P(2, 0, 0)}$ und $C${P(3, 2, 0)}$. Wo liegt $D$?`, a: [r`$${P(1, 2, 0)}$`, r`$${P(5, 2, 0)}$`, r`$${P(-1, 2, 0)}$`, r`$${P(1, -2, 0)}$`], e: r`$\overrightarrow{AD}=\overrightarrow{BC}=${V(1, 2, 0)}$.` },
      { l: 2, q: r`Für alle Vektoren gilt $|\vec a+\vec b|=|\vec a|+|\vec b|$.`, tf: false, e: r`Das gilt nur für Vektoren gleicher Richtung. Sonst ist der direkte Weg kürzer (Dreiecksungleichung).` },
      { l: 2, q: r`Welchen Schwerpunkt hat das Dreieck mit den Ecken $${P(0, 0, 0)}$, $${P(3, 0, 0)}$ und $${P(0, 6, 3)}$?`, a: [r`$${P(1, 2, 1)}$`, r`$${P(1.5, 3, 1.5)}$`, r`$${P(3, 6, 3)}$`, r`$${P(1, 3, 1)}$`], e: r`Der Durchschnitt der drei Ecken.` },
      { l: 2, q: r`Welcher Vektor führt von $A${P(2, -1, 4)}$ zum Ursprung?`, a: [r`$${V(-2, 1, -4)}$`, r`$${V(2, -1, 4)}$`, r`$${V(2, 1, 4)}$`, r`$${V(0, 0, 0)}$`], e: r`$O-A$.` },

      { l: 3, q: r`Der Punkt $T$ teilt die Strecke von $A${P(0, 0, 0)}$ nach $B${P(3, 6, 9)}$ im Verhältnis $1:2$ (von $A$ aus). Wo liegt $T$?`, a: [r`$${P(1, 2, 3)}$`, r`$${P(2, 4, 6)}$`, r`$${P(1.5, 3, 4.5)}$`, r`$${P(1, 3, 3)}$`], e: r`$T=A+\frac13\,\overrightarrow{AB}$: ein Drittel des Wegs.` },
      { l: 3, q: r`Liegen $A${P(1, 1, 1)}$, $B${P(2, 3, 4)}$ und $C${P(4, 7, 10)}$ auf einer Geraden?`, a: [r`Ja, $\overrightarrow{AC}=3\cdot\overrightarrow{AB}$.`, r`Nein, die Abstände sind verschieden.`, r`Nein, $\overrightarrow{AB}$ und $\overrightarrow{AC}$ sind nicht parallel.`, r`Das lässt sich nicht entscheiden.`], e: r`$\overrightarrow{AB}=${V(1, 2, 3)}$ und $\overrightarrow{AC}=${V(3, 6, 9)}$.` },
      { l: 3, q: r`Für welche $k$ hat der Vektor $${V('k', 2, 1)}$ die Länge 3?`, a: [r`Für $k=2$ und $k=-2$`, r`Nur für $k=2$`, r`Für $k=0$`, r`Für $k=6$`], e: r`$k^2+4+1=9$.` },
      { l: 3, q: r`Es gilt $|-3\cdot\vec v|=-3\cdot|\vec v|$.`, tf: false, e: r`Eine Länge ist nie negativ: $|-3\cdot\vec v|=3\cdot|\vec v|$.` },
      { l: 3, q: r`Wie lang ist die Raumdiagonale eines Würfels mit der Kantenlänge 2?`, a: [r`$2\sqrt3$`, r`$2\sqrt2$`, r`$6$`, r`$4$`], e: r`Länge von $${V(2, 2, 2)}$: $\sqrt{12}$.` },
      { l: 3, q: r`Der Punkt $P${P(1, 2, 3)}$ wird am Punkt $M${P(2, 2, 2)}$ gespiegelt. Wo liegt der Bildpunkt?`, a: [r`$${P(3, 2, 1)}$`, r`$${P(1.5, 2, 2.5)}$`, r`$${P(-1, -2, -3)}$`, r`$${P(4, 4, 4)}$`], e: r`$M$ ist der Mittelpunkt: $P'=2M-P$.` },
      { l: 3, q: r`Was für ein Dreieck bilden $${P(1, 0, 0)}$, $${P(0, 1, 0)}$ und $${P(0, 0, 1)}$?`, a: [r`Ein gleichseitiges mit der Seitenlänge $\sqrt2$`, r`Ein rechtwinkliges mit den Katheten 1`, r`Ein gleichseitiges mit der Seitenlänge 1`, r`Ein gleichschenkliges, das nicht gleichseitig ist`], e: r`Jede Seite ist die Diagonale eines Einheitsquadrats.` },
      { l: 3, q: r`Für welche Zahlen $r$ und $s$ gilt $r\cdot${V(1, 0, 1)}+s\cdot${V(0, 1, 1)}=${V(2, 3, 5)}$?`, a: [r`$r=2$ und $s=3$`, r`$r=3$ und $s=2$`, r`$r=2$ und $s=5$`, r`Für keine`], e: r`Die ersten beiden Zeilen geben $r=2$ und $s=3$; die dritte stimmt: $2+3=5$.` }
    ],

    // ───────────────────────── Geraden: Lage und Schnittpunkt ─────────────────────────
    line: [
      { l: 1, q: r`Wie lautet die Parameterform einer Geraden?`, a: [r`$X=P+t\cdot\vec u$`, r`$a\,x+b\,y+c\,z=d$`, r`$X=t\cdot P+\vec u$`, r`$X=P\cdot\vec u$`], e: r`Vom Punkt $P$ aus geht man das $t$-Fache des Vektors $\vec u$.` },
      { l: 1, q: r`Wie heisst $P$ in $X=P+t\cdot\vec u$?`, a: [r`Stützpunkt`, r`Richtungsvektor`, r`Normalenvektor`, r`Parameter`], e: r`Von ihm aus wird die Gerade aufgebaut.` },
      { l: 1, q: r`Wie heisst $\vec u$ in $X=P+t\cdot\vec u$?`, a: [r`Richtungsvektor`, r`Ortsvektor`, r`Normalenvektor`, r`Stützpunkt`], e: r`Er gibt die Richtung der Geraden an.` },
      { l: 1, q: r`Welcher Punkt der Geraden $X=${V(1, 2, 3)}+t\cdot${V(1, 0, 2)}$ gehört zu $t=2$?`, a: [r`$${P(3, 2, 7)}$`, r`$${P(2, 2, 5)}$`, r`$${P(3, 4, 7)}$`, r`$${P(2, 0, 4)}$`], e: r`$1+2$, $2+0$, $3+4$.` },
      { l: 1, q: r`Welchen Punkt erhält man für $t=0$?`, a: [r`Den Stützpunkt`, r`Den Ursprung`, r`Die Spitze des Richtungsvektors`, r`Keinen Punkt`], e: r`$P+0\cdot\vec u=P$.` },
      { l: 1, q: r`Welche Lagen können zwei Geraden im Raum zueinander haben?`, a: [r`Identisch, echt parallel, schneidend oder windschief`, r`Nur parallel oder schneidend`, r`Nur schneidend oder windschief`, r`Nur identisch oder parallel`], e: r`Windschief gibt es erst im Raum.` },
      { l: 1, q: r`Was heisst «windschief»?`, a: [r`Die Geraden sind nicht parallel und schneiden sich trotzdem nicht.`, r`Die Geraden schneiden sich unter einem schiefen Winkel.`, r`Die Geraden sind parallel.`, r`Die Geraden liegen in derselben Ebene.`], e: r`Sie laufen aneinander vorbei, wie eine Brücke über einer Strasse.` },
      { l: 1, q: r`Im Raum schneiden sich zwei nicht parallele Geraden immer.`, tf: false, e: r`Sie können auch windschief sein.` },
      { l: 1, q: r`Woran erkennt man, dass zwei Geraden parallel (oder identisch) sind?`, a: [r`Die Richtungsvektoren sind Vielfache voneinander.`, r`Die Stützpunkte sind gleich.`, r`Die Richtungsvektoren sind gleich lang.`, r`Die Stützpunkte liegen auf einer Achse.`], e: r`Gleiche oder entgegengesetzte Richtung.` },
      { l: 1, q: r`Wie stellt man die Gerade durch zwei Punkte $A$ und $B$ auf?`, a: [r`$X=A+t\cdot\overrightarrow{AB}$`, r`$X=A+t\cdot B$`, r`$X=\overrightarrow{AB}+t\cdot A$`, r`$X=A\cdot B+t$`], e: r`$A$ als Stützpunkt, der Verbindungsvektor als Richtung.` },
      { l: 1, q: r`Wie viele Punkte legen eine Gerade fest?`, a: [r`Zwei`, r`Einer`, r`Drei`, r`Vier`], e: r`Durch zwei verschiedene Punkte geht genau eine Gerade.` },
      { l: 1, q: r`Zu jedem Wert des Parameters $t$ gehört genau ein Punkt der Geraden.`, tf: true, e: r`Und zu jedem Punkt der Geraden genau ein $t$.` },

      { l: 2, q: r`Liegt $Q${P(4, 2, 8)}$ auf der Geraden $X=${V(1, 2, 3)}+t\cdot${V(1, 0, 2)}$?`, a: [r`Nein: $t=3$ passt für $x$, gibt aber $z=9$.`, r`Ja, für $t=3$.`, r`Ja, für $t=2.5$.`, r`Nein, weil $y=2$ ist.`], e: r`Alle drei Koordinaten müssen mit demselben $t$ stimmen.` },
      { l: 2, q: r`Welchen Richtungsvektor hat die Gerade durch $A${P(1, 1, 1)}$ und $B${P(3, 2, 0)}$?`, a: [r`$${V(2, 1, -1)}$`, r`$${V(4, 3, 1)}$`, r`$${V(3, 2, 0)}$`, r`$${V(2, 1, 1)}$`], e: r`$B-A$.` },
      { l: 2, q: r`Wo schneiden sich $g$: $X=t\cdot${V(1, 1, 0)}$ und $h$: $X=${V(2, 0, 0)}+s\cdot${V(0, 1, 0)}$?`, a: [r`In $${P(2, 2, 0)}$`, r`In $${P(2, 0, 0)}$`, r`In $${P(1, 1, 0)}$`, r`Gar nicht`], e: r`$x$: $t=2$; $y$: $t=s$, also $s=2$; $z$: $0=0$ stimmt.` },
      { l: 2, q: r`Wie prüft man, ob sich zwei nicht parallele Geraden schneiden?`, a: [r`Gleichsetzen, aus zwei Gleichungen $t$ und $s$ bestimmen, mit der dritten prüfen.`, r`Die Richtungsvektoren addieren.`, r`Die Stützpunkte vergleichen.`, r`Die Längen der Richtungsvektoren vergleichen.`], e: r`Stimmt die dritte Gleichung nicht, sind die Geraden windschief.` },
      { l: 2, q: r`Wie liegen $g$: $X=${V(1, 0, 0)}+t\cdot${V(1, 2, 3)}$ und $h$: $X=${V(0, 1, 0)}+s\cdot${V(2, 4, 6)}$ zueinander?`, a: [r`Echt parallel`, r`Identisch`, r`Sie schneiden sich.`, r`Windschief`], e: r`Die Richtungen sind Vielfache; $${P(0, 1, 0)}$ liegt aber nicht auf $g$ ($t=-1$ gibt $y=-2$).` },
      { l: 2, q: r`Der Stützpunkt einer Geraden ist eindeutig bestimmt.`, tf: false, e: r`Jeder Punkt der Geraden kann als Stützpunkt dienen.` },
      { l: 2, q: r`Wo durchstösst die Gerade $X=${V(1, 2, 3)}+t\cdot${V(1, 1, 1)}$ die $xy$-Ebene?`, a: [r`In $${P(-2, -1, 0)}$`, r`In $${P(1, 2, 0)}$`, r`In $${P(4, 5, 0)}$`, r`In $${P(0, 1, 2)}$`], e: r`$z=3+t=0$, also $t=-3$.` },
      { l: 2, q: r`Wie liegen die $x$-Achse und die Gerade $X=${V(0, 0, 1)}+s\cdot${V(0, 1, 0)}$ zueinander?`, a: [r`Windschief`, r`Parallel`, r`Sie schneiden sich im Ursprung.`, r`Identisch`], e: r`Die Richtungen sind verschieden, und die zweite Gerade bleibt auf der Höhe $z=1$.` },
      { l: 2, q: r`Welcher Punkt der Geraden $X=${V(2, 1, 0)}+t\cdot${V(1, -1, 2)}$ hat die $x$-Koordinate 5?`, a: [r`$${P(5, -2, 6)}$`, r`$${P(5, 4, 6)}$`, r`$${P(5, -5, 10)}$`, r`$${P(5, 1, 0)}$`], e: r`$2+t=5$, also $t=3$.` },
      { l: 2, q: r`Welche Gleichung beschreibt dieselbe Gerade wie $X=${V(1, 2, 3)}+t\cdot${V(1, 0, 2)}$?`, a: [r`$X=${V(2, 2, 5)}+t\cdot${V(-2, 0, -4)}$`, r`$X=${V(1, 0, 2)}+t\cdot${V(1, 2, 3)}$`, r`$X=${V(2, 2, 5)}+t\cdot${V(1, 2, 3)}$`, r`$X=${V(1, 2, 3)}+t\cdot${V(2, 0, 2)}$`], e: r`$${P(2, 2, 5)}$ liegt auf der Geraden ($t=1$), und die Richtung ist ein Vielfaches.` },

      { l: 3, q: r`Wo schneiden sich $g$: $X=${V(1, 1, 0)}+t\cdot${V(1, 2, 1)}$ und $h$: $X=${V(0, 2, 1)}+s\cdot${V(2, 1, 0)}$?`, a: [r`In $${P(2, 3, 1)}$`, r`In $${P(1, 1, 0)}$`, r`In $${P(4, 4, 1)}$`, r`Gar nicht, sie sind windschief.`], e: r`$z$: $t=1$; $x$: $2=2s$, also $s=1$; $y$: $3=3$ stimmt.` },
      { l: 3, q: r`Für welches $a$ schneiden sich $g$: $X=t\cdot${V(1, 1, 1)}$ und $h$: $X=${V(1, 0, 'a')}+s\cdot${V(0, 1, 0)}$?`, a: [r`Für $a=1$`, r`Für $a=0$`, r`Für jedes $a$`, r`Für kein $a$`], e: r`$x$: $t=1$; dann muss auch $z=t=a$ sein.` },
      { l: 3, q: r`Welchen Abstand haben die $x$-Achse und die Gerade $X=${V(0, 0, 1)}+s\cdot${V(0, 1, 0)}$?`, a: [r`$1$`, r`$0$`, r`$\sqrt2$`, r`$2$`], e: r`Die kürzeste Verbindung führt von $${P(0, 0, 0)}$ nach $${P(0, 0, 1)}$ und steht auf beiden Geraden senkrecht.` },
      { l: 3, q: r`Zwei Geraden mit demselben Richtungsvektor sind identisch.`, tf: false, e: r`Sie können auch echt parallel sein. Identisch sind sie nur, wenn der Stützpunkt der einen auf der anderen liegt.` },
      { l: 3, q: r`Welchen Winkel schliessen zwei sich schneidende Geraden mit den Richtungen $${V(1, 0, 0)}$ und $${V(1, 1, 0)}$ ein?`, a: [r`$45^\circ$`, r`$90^\circ$`, r`$60^\circ$`, r`$30^\circ$`], e: r`$\cos\varphi=\frac{1}{1\cdot\sqrt2}$.` },
      { l: 3, q: r`Wo trifft die Gerade $X=${V(1, 0, 2)}+t\cdot${V(1, 1, -1)}$ die Ebene $x+y+z=6$?`, a: [r`In $${P(4, 3, -1)}$`, r`In $${P(2, 1, 1)}$`, r`In $${P(3, 2, 0)}$`, r`Gar nicht`], e: r`$(1+t)+t+(2-t)=6$ ergibt $t=3$.` },
      { l: 3, q: r`Wie viele Punkte hat die Gerade $X=t\cdot${V(1, 2, 3)}$ mit der Ebene $x+y-z=0$ gemeinsam?`, a: [r`Unendlich viele: Die Gerade liegt in der Ebene.`, r`Genau einen`, r`Keinen`, r`Genau zwei`], e: r`$t+2t-3t=0$ gilt für jedes $t$.` },
      { l: 3, q: r`Eine Gerade durch $${P(1, 2, 3)}$ verläuft parallel zur $z$-Achse. Wo trifft sie die $xy$-Ebene?`, a: [r`In $${P(1, 2, 0)}$`, r`In $${P(0, 0, 3)}$`, r`In $${P(0, 0, 0)}$`, r`Gar nicht`], e: r`Nur die $z$-Koordinate ändert sich.` }
    ],

    // ───────────────────────── Skalarprodukt und Winkel ─────────────────────────
    dot: [
      { l: 1, q: r`Wie berechnet man das Skalarprodukt $\vec a\cdot\vec b$?`, a: [r`$a_1b_1+a_2b_2+a_3b_3$`, r`$(a_1+b_1)(a_2+b_2)(a_3+b_3)$`, r`$a_1b_1\cdot a_2b_2\cdot a_3b_3$`, r`$a_1+b_1+a_2+b_2+a_3+b_3$`], e: r`Entsprechende Komponenten multiplizieren, dann addieren.` },
      { l: 1, q: r`Wie gross ist $${V(1, 2, 3)}\cdot${V(4, 0, 1)}$?`, a: [r`$7$`, r`$11$`, r`$0$`, r`$12$`], e: r`$4+0+3$.` },
      { l: 1, q: r`Was ist das Ergebnis eines Skalarprodukts?`, a: [r`Eine Zahl`, r`Ein Vektor`, r`Ein Punkt`, r`Ein Winkel`], e: r`«Skalar» heisst Zahl.` },
      { l: 1, q: r`Wann stehen zwei Vektoren (keiner der Nullvektor) senkrecht aufeinander?`, a: [r`Wenn ihr Skalarprodukt 0 ist.`, r`Wenn ihr Skalarprodukt 1 ist.`, r`Wenn sie gleich lang sind.`, r`Wenn ihre Summe der Nullvektor ist.`], e: r`Dann ist $\cos\varphi=0$, also $\varphi=90^\circ$.` },
      { l: 1, q: r`Wie hängt das Skalarprodukt mit dem Winkel $\varphi$ zwischen den Vektoren zusammen?`, a: [r`$\vec a\cdot\vec b=|\vec a|\cdot|\vec b|\cdot\cos\varphi$`, r`$\vec a\cdot\vec b=|\vec a|\cdot|\vec b|\cdot\sin\varphi$`, r`$\vec a\cdot\vec b=|\vec a|+|\vec b|+\cos\varphi$`, r`$\vec a\cdot\vec b=\cos\varphi$`], e: r`Längen mal Kosinus des eingeschlossenen Winkels.` },
      { l: 1, q: r`Wie gross ist $${V(1, 0, 0)}\cdot${V(0, 1, 0)}$?`, a: [r`$0$`, r`$1$`, r`$2$`, r`$-1$`], e: r`Die Vektoren zeigen entlang der $x$- und der $y$-Achse und stehen senkrecht.` },
      { l: 1, q: r`Was ergibt $\vec a\cdot\vec a$?`, a: [r`$|\vec a|^2$`, r`$|\vec a|$`, r`$0$`, r`$2\,\vec a$`], e: r`$a_1^2+a_2^2+a_3^2$.` },
      { l: 1, q: r`Es gilt $\vec a\cdot\vec b=\vec b\cdot\vec a$.`, tf: true, e: r`Auf die Reihenfolge kommt es beim Skalarprodukt nicht an.` },
      { l: 1, q: r`Was ist das Vektorprodukt $\vec a\times\vec b$?`, a: [r`Ein Vektor, der senkrecht auf $\vec a$ und auf $\vec b$ steht.`, r`Eine Zahl.`, r`Ein Vektor in der Richtung von $\vec a$.`, r`Die Summe der beiden Vektoren.`], e: r`Anders als das Skalarprodukt liefert es wieder einen Vektor.` },
      { l: 1, q: r`Wie berechnet man den Winkel zwischen zwei Vektoren?`, a: [r`$\cos\varphi=\frac{\vec a\cdot\vec b}{|\vec a|\cdot|\vec b|}$`, r`$\cos\varphi=\vec a\cdot\vec b$`, r`$\sin\varphi=\frac{\vec a\cdot\vec b}{|\vec a|\cdot|\vec b|}$`, r`$\cos\varphi=\frac{|\vec a|\cdot|\vec b|}{\vec a\cdot\vec b}$`], e: r`Die Formel $\vec a\cdot\vec b=|\vec a|\,|\vec b|\cos\varphi$, nach $\cos\varphi$ aufgelöst.` },
      { l: 1, q: r`Stehen $${V(2, 1, 0)}$ und $${V(1, -2, 5)}$ senkrecht aufeinander?`, a: [r`Ja, das Skalarprodukt ist 0.`, r`Nein, das Skalarprodukt ist 4.`, r`Nein, sie sind verschieden lang.`, r`Nein, das Skalarprodukt ist 5.`], e: r`$2-2+0$.` },
      { l: 1, q: r`Das Skalarprodukt zweier Vektoren ist wieder ein Vektor.`, tf: false, e: r`Es ist eine Zahl. Einen Vektor liefert das Vektorprodukt.` },

      { l: 2, q: r`Welchen Winkel schliessen $${V(1, 0, 0)}$ und $${V(1, 1, 0)}$ ein?`, a: [r`$45^\circ$`, r`$90^\circ$`, r`$60^\circ$`, r`$30^\circ$`], e: r`$\cos\varphi=\frac{1}{\sqrt2}$.` },
      { l: 2, q: r`Für welches $k$ steht $${V(1, 2, 'k')}$ senkrecht auf $${V(2, 1, -4)}$?`, a: [r`$k=1$`, r`$k=-1$`, r`$k=4$`, r`$k=0$`], e: r`$2+2-4k=0$.` },
      { l: 2, q: r`Das Skalarprodukt zweier Vektoren ist negativ. Was folgt für den Winkel zwischen ihnen?`, a: [r`Er ist stumpf (grösser als $90^\circ$).`, r`Er ist spitz.`, r`Er ist ein rechter Winkel.`, r`Die Vektoren sind parallel.`], e: r`Der Kosinus ist zwischen $90^\circ$ und $180^\circ$ negativ.` },
      { l: 2, q: r`Was ergibt $${V(1, 0, 0)}\times${V(0, 1, 0)}$?`, a: [r`$${V(0, 0, 1)}$`, r`$${V(1, 1, 0)}$`, r`$${V(0, 0, 0)}$`, r`$${V(0, 0, -1)}$`], e: r`Senkrecht auf beiden: die Richtung der $z$-Achse (Rechte-Hand-Regel).` },
      { l: 2, q: r`Was bedeutet die Länge von $\vec a\times\vec b$?`, a: [r`Die Fläche des Parallelogramms, das $\vec a$ und $\vec b$ aufspannen.`, r`Den Winkel zwischen $\vec a$ und $\vec b$.`, r`Die Summe der Längen.`, r`Das Volumen eines Würfels.`], e: r`$|\vec a\times\vec b|=|\vec a|\,|\vec b|\sin\varphi$.` },
      { l: 2, q: r`Welchen Winkel schliessen $${V(1, 1, 0)}$ und $${V(0, 1, 1)}$ ein?`, a: [r`$60^\circ$`, r`$45^\circ$`, r`$90^\circ$`, r`$30^\circ$`], e: r`$\cos\varphi=\frac{1}{\sqrt2\cdot\sqrt2}=\frac12$.` },
      { l: 2, q: r`Es gilt $\vec a\times\vec b=\vec b\times\vec a$.`, tf: false, e: r`Beim Vertauschen kehrt sich die Richtung um: $\vec b\times\vec a=-\,\vec a\times\vec b$.` },
      { l: 2, q: r`Was ergibt $\vec a\times\vec a$?`, a: [r`Den Nullvektor`, r`$|\vec a|^2$`, r`$2\,\vec a$`, r`$\vec a$`], e: r`Ein Vektor spannt mit sich selbst kein Parallelogramm auf.` },
      { l: 2, q: r`Welcher Vektor steht senkrecht auf $${V(1, 2, 0)}$?`, a: [r`$${V(2, -1, 5)}$`, r`$${V(1, 2, 1)}$`, r`$${V(2, 1, 0)}$`, r`$${V(0, 1, 2)}$`], e: r`$2-2+0=0$.` },
      { l: 2, q: r`Es ist $|\vec a|=3$, $|\vec b|=4$, und der Winkel dazwischen misst $60^\circ$. Wie gross ist $\vec a\cdot\vec b$?`, a: [r`$6$`, r`$12$`, r`$10.4$`, r`$7$`], e: r`$3\cdot4\cdot\cos60^\circ$.` },

      { l: 3, q: r`Was ergibt $${V(1, 2, 3)}\times${V(4, 5, 6)}$?`, a: [r`$${V(-3, 6, -3)}$`, r`$${V(4, 10, 18)}$`, r`$${V(3, -6, 3)}$`, r`$${V(-3, -6, -3)}$`], e: r`$2\cdot6-3\cdot5$, $3\cdot4-1\cdot6$, $1\cdot5-2\cdot4$. Probe: Das Ergebnis steht auf beiden senkrecht.` },
      { l: 3, q: r`Welche Fläche hat das Dreieck mit den Ecken $${P(1, 0, 0)}$, $${P(0, 1, 0)}$ und $${P(0, 0, 1)}$?`, a: [r`$\frac{\sqrt3}{2}$`, r`$\sqrt3$`, r`$\frac12$`, r`$1$`], e: r`Das Vektorprodukt zweier Seitenvektoren ist $${V(1, 1, 1)}$; die halbe Länge davon.` },
      { l: 3, q: r`Welchen Winkel schliesst die Raumdiagonale eines Würfels mit einer Kante ein?`, a: [r`Etwa $54.7^\circ$`, r`$45^\circ$`, r`$60^\circ$`, r`Etwa $35.3^\circ$`], e: r`$${V(1, 1, 1)}$ und $${V(1, 0, 0)}$: $\cos\varphi=\frac{1}{\sqrt3}$.` },
      { l: 3, q: r`Aus $\vec a\cdot\vec b=\vec a\cdot\vec c$ folgt $\vec b=\vec c$.`, tf: false, e: r`Es folgt nur, dass $\vec b-\vec c$ senkrecht auf $\vec a$ steht. Durch einen Vektor kann man nicht «teilen».` },
      { l: 3, q: r`Wie lang ist der Schatten von $\vec b=${V(3, 0, 3)}$ auf der Richtung von $\vec a=${V(1, 2, 2)}$ (senkrechte Projektion)?`, a: [r`$3$`, r`$9$`, r`$\sqrt{18}$`, r`$1$`], e: r`$\frac{\vec a\cdot\vec b}{|\vec a|}=\frac{9}{3}$.` },
      { l: 3, q: r`Welchen Winkel schliessen zwei Raumdiagonalen eines Würfels ein?`, a: [r`Etwa $70.5^\circ$`, r`$90^\circ$`, r`$60^\circ$`, r`$45^\circ$`], e: r`$${V(1, 1, 1)}$ und $${V(1, 1, -1)}$: $\cos\varphi=\frac13$.` },
      { l: 3, q: r`Welches Volumen hat der Spat, den $${V(1, 0, 0)}$, $${V(0, 2, 0)}$ und $${V(1, 1, 3)}$ aufspannen?`, a: [r`$6$`, r`$2$`, r`$3$`, r`$12$`], e: r`$\left|(\vec a\times\vec b)\cdot\vec c\right|$ mit $\vec a\times\vec b=${V(0, 0, 2)}$.` },
      { l: 3, q: r`Wann stehen die Diagonalen $\vec a+\vec b$ und $\vec a-\vec b$ eines Parallelogramms senkrecht aufeinander?`, a: [r`Wenn $\vec a$ und $\vec b$ gleich lang sind (Raute).`, r`Wenn $\vec a$ und $\vec b$ senkrecht stehen (Rechteck).`, r`Immer.`, r`Nie.`], e: r`$(\vec a+\vec b)\cdot(\vec a-\vec b)=|\vec a|^2-|\vec b|^2$.` }
    ],

    // ───────────────────────── Abstände ─────────────────────────
    dist: [
      { l: 1, q: r`Was ist der Abstand eines Punktes von einer Ebene?`, a: [r`Die Länge des Lots vom Punkt auf die Ebene.`, r`Die Länge irgendeiner Strecke vom Punkt zur Ebene.`, r`Der Abstand des Punktes vom Ursprung.`, r`Die $z$-Koordinate des Punktes.`], e: r`Das Lot ist die kürzeste Verbindung.` },
      { l: 1, q: r`Was ist der Lotfusspunkt?`, a: [r`Der Punkt der Ebene (oder Geraden), der dem gegebenen Punkt am nächsten liegt.`, r`Der Mittelpunkt der Ebene.`, r`Der Schnittpunkt mit der $x$-Achse.`, r`Der Ursprung.`], e: r`Dort trifft das Lot auf.` },
      { l: 1, q: r`Wie berechnet man den Abstand des Punktes $${P('x_0', 'y_0', 'z_0')}$ von der Ebene $a\,x+b\,y+c\,z=d$?`, a: [r`$\frac{|a\,x_0+b\,y_0+c\,z_0-d|}{\sqrt{a^2+b^2+c^2}}$`, r`$|a\,x_0+b\,y_0+c\,z_0-d|$`, r`$\frac{a\,x_0+b\,y_0+c\,z_0}{d}$`, r`$\sqrt{x_0^2+y_0^2+z_0^2}-d$`], e: r`Punkt einsetzen und durch die Länge des Normalenvektors teilen.` },
      { l: 1, q: r`Welchen Abstand hat $${P(0, 0, 5)}$ von der Ebene $z=0$?`, a: [r`$5$`, r`$0$`, r`$25$`, r`$\sqrt5$`], e: r`Die Höhe über der $xy$-Ebene.` },
      { l: 1, q: r`Welchen Abstand hat $${P(3, 4, 0)}$ vom Ursprung?`, a: [r`$5$`, r`$7$`, r`$12$`, r`$25$`], e: r`$\sqrt{9+16}$.` },
      { l: 1, q: r`Welche Richtung hat das Lot von einem Punkt auf eine Ebene?`, a: [r`Die Richtung des Normalenvektors.`, r`Die Richtung der $z$-Achse.`, r`Eine Richtung in der Ebene.`, r`Die Richtung zum Ursprung.`], e: r`Das Lot steht senkrecht auf der Ebene.` },
      { l: 1, q: r`Welchen Abstand hat ein Punkt, der in der Ebene liegt, von dieser Ebene?`, a: [r`$0$`, r`$1$`, r`Das hängt von der Ebene ab.`, r`Er ist nicht definiert.`], e: r`Der Punkt erfüllt die Ebenengleichung; der Zähler der Formel ist 0.` },
      { l: 1, q: r`Ein Abstand ist nie negativ.`, tf: true, e: r`Dafür sorgt der Betrag in der Formel.` },
      { l: 1, q: r`Welchen Abstand hat $${P(2, 3, 7)}$ von der $xy$-Ebene?`, a: [r`$7$`, r`$2$`, r`$3$`, r`$\sqrt{62}$`], e: r`Der Betrag der $z$-Koordinate.` },
      { l: 1, q: r`Wie lang ist der Normalenvektor $${V(2, 1, 2)}$?`, a: [r`$3$`, r`$5$`, r`$9$`, r`$\sqrt5$`], e: r`$\sqrt{4+1+4}$.` },
      { l: 1, q: r`Woran erkennt man den Lotfusspunkt $F$ eines Punktes $X$ auf einer Geraden?`, a: [r`$\overrightarrow{XF}$ steht senkrecht auf dem Richtungsvektor.`, r`$\overrightarrow{XF}$ ist parallel zum Richtungsvektor.`, r`$F$ ist der Stützpunkt.`, r`$F$ hat dieselbe $z$-Koordinate wie $X$.`], e: r`Das Skalarprodukt von $\overrightarrow{XF}$ mit dem Richtungsvektor ist 0.` },
      { l: 1, q: r`Der kürzeste Weg von einem Punkt zu einer Ebene verläuft senkrecht zur Ebene.`, tf: true, e: r`Jeder schräge Weg ist die Hypotenuse eines rechtwinkligen Dreiecks und damit länger.` },

      { l: 2, q: r`Welchen Abstand hat der Ursprung von der Ebene $2x+y+2z=6$?`, a: [r`$2$`, r`$6$`, r`$3$`, r`$\frac65$`], e: r`$\frac{|0-6|}{3}$.` },
      { l: 2, q: r`Welchen Abstand hat $${P(1, 1, 1)}$ von der Ebene $2x+y+2z=14$?`, a: [r`$3$`, r`$9$`, r`$5$`, r`$\frac{19}{3}$`], e: r`$\frac{|2+1+2-14|}{3}$.` },
      { l: 2, q: r`Welchen Abstand hat $${P(1, 2, 3)}$ von der $x$-Achse?`, a: [r`$\sqrt{13}$`, r`$1$`, r`$\sqrt{14}$`, r`$5$`], e: r`Der Lotfusspunkt ist $${P(1, 0, 0)}$; es bleiben $y=2$ und $z=3$.` },
      { l: 2, q: r`Welchen Abstand haben die parallelen Ebenen $x+2y+2z=3$ und $x+2y+2z=9$?`, a: [r`$2$`, r`$6$`, r`$3$`, r`$12$`], e: r`$\frac{|9-3|}{3}$.` },
      { l: 2, q: r`Welches ist der Lotfusspunkt von $${P(1, 2, 5)}$ auf der $xy$-Ebene?`, a: [r`$${P(1, 2, 0)}$`, r`$${P(0, 0, 5)}$`, r`$${P(0, 0, 0)}$`, r`$${P(1, 2, -5)}$`], e: r`Senkrecht nach unten: Nur die $z$-Koordinate wird 0.` },
      { l: 2, q: r`Wie lautet die Hessesche Normalform der Ebene $2x+y+2z=6$?`, a: [r`$\frac{2x+y+2z-6}{3}=0$`, r`$\frac{2x+y+2z}{6}=1$`, r`$2x+y+2z-6=3$`, r`$\frac{2x+y+2z-6}{9}=0$`], e: r`Durch die Länge 3 des Normalenvektors teilen.` },
      { l: 2, q: r`Lässt man in der Abstandsformel den Betrag weg, so zeigt das Vorzeichen, auf welcher Seite der Ebene der Punkt liegt.`, tf: true, e: r`Positiv auf der Seite, in die der Normalenvektor zeigt.` },
      { l: 2, q: r`Welchen Abstand hat $${P(4, 0, 0)}$ von der Ebene $x=1$?`, a: [r`$3$`, r`$4$`, r`$1$`, r`$5$`], e: r`Die Ebene steht senkrecht auf der $x$-Achse.` },
      { l: 2, q: r`Welchen Abstand hat $${P(3, 4, 5)}$ von der $z$-Achse?`, a: [r`$5$`, r`$\sqrt{50}$`, r`$7$`, r`$3$`], e: r`$\sqrt{3^2+4^2}$; die $z$-Koordinate spielt keine Rolle.` },
      { l: 2, q: r`Welche Gerade ist das Lot von $${P(1, 1, 1)}$ auf die Ebene $2x+y+2z=14$?`, a: [r`$X=${V(1, 1, 1)}+t\cdot${V(2, 1, 2)}$`, r`$X=${V(2, 1, 2)}+t\cdot${V(1, 1, 1)}$`, r`$X=${V(1, 1, 1)}+t\cdot${V(1, -2, 0)}$`, r`$X=t\cdot${V(2, 1, 2)}$`], e: r`Durch den Punkt, in Richtung des Normalenvektors.` },

      { l: 3, q: r`Welches ist der Lotfusspunkt von $${P(1, 1, 1)}$ auf der Ebene $2x+y+2z=14$?`, a: [r`$${P(3, 2, 3)}$`, r`$${P(5, 3, 5)}$`, r`$${P(2, 1, 2)}$`, r`$${P(7, 0, 0)}$`], e: r`Lotgerade einsetzen: $5+9t=14$, also $t=1$.` },
      { l: 3, q: r`Der Punkt $${P(1, 1, 1)}$ wird an der Ebene $2x+y+2z=14$ gespiegelt. Wo liegt der Bildpunkt?`, a: [r`$${P(5, 3, 5)}$`, r`$${P(3, 2, 3)}$`, r`$${P(-1, -1, -1)}$`, r`$${P(13, 13, 13)}$`], e: r`Doppelt so weit wie zum Lotfusspunkt: $t=2$.` },
      { l: 3, q: r`Welchen Abstand hat $${P(1, 2, 3)}$ von der Geraden $X=t\cdot${V(1, 1, 1)}$?`, a: [r`$\sqrt2$`, r`$2$`, r`$\sqrt{14}$`, r`$1$`], e: r`Lotfusspunkt $${P(2, 2, 2)}$ (aus $(1-t)+(2-t)+(3-t)=0$); von dort zu $P$ sind es $\sqrt{1+0+1}$.` },
      { l: 3, q: r`Der Abstand eines Punktes von einer Geraden ist die Länge irgendeiner Verbindungsstrecke zur Geraden.`, tf: false, e: r`Es ist die Länge der kürzesten Verbindung, des Lots.` },
      { l: 3, q: r`Welche Punkte der $z$-Achse haben von der Ebene $2x+y+2z=6$ den Abstand 3?`, a: [r`$${P(0, 0, 7.5)}$ und $${P(0, 0, -1.5)}$`, r`Nur $${P(0, 0, 7.5)}$`, r`$${P(0, 0, 6)}$ und $${P(0, 0, 0)}$`, r`$${P(0, 0, 4.5)}$ und $${P(0, 0, 1.5)}$`], e: r`$\frac{|2z-6|}{3}=3$, also $2z-6=\pm9$.` },
      { l: 3, q: r`Die Grundfläche einer Pyramide liegt in der Ebene $x+2y+2z=6$, die Spitze ist $${P(3, 3, 3)}$. Wie hoch ist die Pyramide?`, a: [r`$3$`, r`$9$`, r`$5$`, r`$\sqrt{27}$`], e: r`$\frac{|3+6+6-6|}{3}$.` },
      { l: 3, q: r`Welche Ebenen sind parallel zu $x+2y+2z=3$ und haben von ihr den Abstand 2?`, a: [r`$x+2y+2z=9$ und $x+2y+2z=-3$`, r`$x+2y+2z=5$ und $x+2y+2z=1$`, r`Nur $x+2y+2z=9$`, r`$x+2y+2z=6$ und $x+2y+2z=0$`], e: r`Die rechte Seite ändert sich um $2\cdot|\vec n|=6$.` },
      { l: 3, q: r`Eine Kugel um $${P(1, 2, 2)}$ berührt die Ebene $x+2y+2z=18$. Welchen Radius hat sie?`, a: [r`$3$`, r`$9$`, r`$6$`, r`$18$`], e: r`Der Radius ist der Abstand des Mittelpunkts von der Ebene: $\frac{|1+4+4-18|}{3}$.` }
    ],

    // ───────────────────────── Kugel ─────────────────────────
    sph: [
      { l: 1, q: r`Wie lautet die Gleichung der Kugel mit dem Mittelpunkt $${P('m_1', 'm_2', 'm_3')}$ und dem Radius $r$?`, a: [r`$(x-m_1)^2+(y-m_2)^2+(z-m_3)^2=r^2$`, r`$(x-m_1)^2+(y-m_2)^2+(z-m_3)^2=r$`, r`$(x+m_1)^2+(y+m_2)^2+(z+m_3)^2=r^2$`, r`$m_1x+m_2y+m_3z=r$`], e: r`Alle Punkte mit dem Abstand $r$ vom Mittelpunkt.` },
      { l: 1, q: r`Welche Kugel beschreibt $x^2+y^2+z^2=25$?`, a: [r`Mittelpunkt im Ursprung, Radius 5`, r`Mittelpunkt im Ursprung, Radius 25`, r`Mittelpunkt $${P(5, 5, 5)}$, Radius 1`, r`Mittelpunkt im Ursprung, Radius 12.5`], e: r`Rechts steht $r^2$.` },
      { l: 1, q: r`Welche Kugel beschreibt $(x-1)^2+(y+2)^2+z^2=9$?`, a: [r`Mittelpunkt $${P(1, -2, 0)}$, Radius 3`, r`Mittelpunkt $${P(-1, 2, 0)}$, Radius 3`, r`Mittelpunkt $${P(1, -2, 0)}$, Radius 9`, r`Mittelpunkt $${P(1, 2, 0)}$, Radius 3`], e: r`$y+2=y-(-2)$.` },
      { l: 1, q: r`Wann liegt ein Punkt auf der Kugel?`, a: [r`Wenn sein Abstand vom Mittelpunkt gleich dem Radius ist.`, r`Wenn sein Abstand vom Mittelpunkt kleiner als der Radius ist.`, r`Wenn er auf einer Koordinatenachse liegt.`, r`Wenn seine Koordinaten positiv sind.`], e: r`Die Kugel ist hier die Oberfläche.` },
      { l: 1, q: r`Liegt $${P(3, 4, 0)}$ auf der Kugel $x^2+y^2+z^2=25$?`, a: [r`Ja, denn $9+16+0=25$.`, r`Nein, er liegt innerhalb.`, r`Nein, er liegt ausserhalb.`, r`Nein, weil $z=0$ ist.`], e: r`Koordinaten einsetzen.` },
      { l: 1, q: r`Der Abstand eines Punktes vom Mittelpunkt ist kleiner als der Radius. Wo liegt der Punkt?`, a: [r`Innerhalb der Kugel`, r`Auf der Kugel`, r`Ausserhalb der Kugel`, r`Im Mittelpunkt`], e: r`Näher am Mittelpunkt als die Oberfläche.` },
      { l: 1, q: r`Eine Ebene schneidet eine Kugel. Welche Form hat die Schnittfigur?`, a: [r`Ein Kreis`, r`Eine Ellipse`, r`Eine Gerade`, r`Ein Quadrat`], e: r`Jeder ebene Schnitt einer Kugel ist ein Kreis.` },
      { l: 1, q: r`Ist der Abstand des Mittelpunkts von der Ebene gleich dem Radius, so berührt die Ebene die Kugel in einem Punkt.`, tf: true, e: r`Das ist eine Tangentialebene.` },
      { l: 1, q: r`Der Abstand des Mittelpunkts von der Ebene ist grösser als der Radius. Was folgt?`, a: [r`Ebene und Kugel haben keinen gemeinsamen Punkt.`, r`Die Ebene schneidet die Kugel in einem Kreis.`, r`Die Ebene berührt die Kugel.`, r`Die Ebene geht durch den Mittelpunkt.`], e: r`Die Ebene läuft an der Kugel vorbei.` },
      { l: 1, q: r`Wie steht eine Tangentialebene zum Radius, der zum Berührpunkt führt?`, a: [r`Senkrecht`, r`Parallel`, r`Unter $45^\circ$`, r`Beliebig`], e: r`Der Radius zum Berührpunkt ist ein Normalenvektor der Ebene.` },
      { l: 1, q: r`Wo liegt $${P(1, 1, 1)}$ in Bezug auf die Kugel $x^2+y^2+z^2=4$?`, a: [r`Innerhalb, denn $3<4$.`, r`Auf der Kugel.`, r`Ausserhalb, denn $3>2$.`, r`Im Mittelpunkt.`], e: r`Man vergleicht die Quadrate: $1+1+1$ mit $r^2=4$.` },
      { l: 1, q: r`Alle Punkte einer Kugel haben vom Mittelpunkt denselben Abstand.`, tf: true, e: r`So ist die Kugel definiert.` },

      { l: 2, q: r`Eine Kugel hat den Radius 5; die Ebene ist 3 vom Mittelpunkt entfernt. Welchen Radius hat der Schnittkreis?`, a: [r`$4$`, r`$2$`, r`$\sqrt{34}$`, r`$8$`], e: r`$\sqrt{5^2-3^2}$.` },
      { l: 2, q: r`Eine Kugel um $${P(1, 2, 3)}$ geht durch $${P(3, 4, 4)}$. Welchen Radius hat sie?`, a: [r`$3$`, r`$9$`, r`$5$`, r`$\sqrt5$`], e: r`Länge von $${V(2, 2, 1)}$.` },
      { l: 2, q: r`Wo liegt $${P(2, 2, 2)}$ in Bezug auf die Kugel $x^2+y^2+z^2=9$?`, a: [r`Ausserhalb, denn $12>9$.`, r`Innerhalb, denn $2<3$.`, r`Auf der Kugel.`, r`Innerhalb, denn $6<9$.`], e: r`$4+4+4=12$.` },
      { l: 2, q: r`Die Ebene $z=3$ schneidet die Kugel $x^2+y^2+z^2=25$. Welchen Mittelpunkt und Radius hat der Schnittkreis?`, a: [r`Mittelpunkt $${P(0, 0, 3)}$, Radius 4`, r`Mittelpunkt $${P(0, 0, 0)}$, Radius 4`, r`Mittelpunkt $${P(0, 0, 3)}$, Radius 5`, r`Mittelpunkt $${P(0, 0, 3)}$, Radius 2`], e: r`$x^2+y^2=25-9=16$ auf der Höhe $z=3$.` },
      { l: 2, q: r`Wie liegt die Ebene $z=5$ zur Kugel $x^2+y^2+z^2=25$?`, a: [r`Sie berührt die Kugel in $${P(0, 0, 5)}$.`, r`Sie schneidet die Kugel in einem Kreis.`, r`Sie verfehlt die Kugel.`, r`Sie geht durch den Mittelpunkt.`], e: r`Der Abstand vom Mittelpunkt ist gleich dem Radius.` },
      { l: 2, q: r`Welche Ebene schneidet aus einer Kugel den grössten Kreis?`, a: [r`Eine Ebene durch den Mittelpunkt.`, r`Eine Tangentialebene.`, r`Eine Ebene parallel zur $xy$-Ebene.`, r`Alle Schnittkreise sind gleich gross.`], e: r`Für $d=0$ ist der Kreisradius gleich dem Kugelradius (Grosskreis).` },
      { l: 2, q: r`Der Mittelpunkt des Schnittkreises ist der Lotfusspunkt des Kugelmittelpunkts auf der Ebene.`, tf: true, e: r`Aus Symmetriegründen liegt er senkrecht unter (oder über) dem Kugelmittelpunkt.` },
      { l: 2, q: r`Wie liegt die Ebene $2x+y+2z=18$ zur Kugel um den Ursprung mit dem Radius 3?`, a: [r`Sie verfehlt die Kugel.`, r`Sie berührt die Kugel.`, r`Sie schneidet die Kugel in einem Kreis.`, r`Sie geht durch den Mittelpunkt.`], e: r`Abstand $\frac{18}{3}=6$, und das ist grösser als 3.` },
      { l: 2, q: r`Welche Kugel beschreibt $x^2+y^2+z^2-2x=3$?`, a: [r`Mittelpunkt $${P(1, 0, 0)}$, Radius 2`, r`Mittelpunkt $${P(-1, 0, 0)}$, Radius 2`, r`Mittelpunkt $${P(1, 0, 0)}$, Radius $\sqrt3$`, r`Mittelpunkt $${P(2, 0, 0)}$, Radius 3`], e: r`Quadratisch ergänzen: $(x-1)^2+y^2+z^2=4$.` },
      { l: 2, q: r`Zwei Kugeln haben die Radien 2 und 3, ihre Mittelpunkte sind 5 voneinander entfernt. Wie liegen sie?`, a: [r`Sie berühren sich von aussen.`, r`Sie schneiden sich in einem Kreis.`, r`Sie haben keinen gemeinsamen Punkt.`, r`Die eine liegt in der anderen.`], e: r`Der Abstand ist genau die Summe der Radien.` },

      { l: 3, q: r`Welche Tangentialebene hat die Kugel $x^2+y^2+z^2=9$ im Punkt $${P(1, 2, 2)}$?`, a: [r`$x+2y+2z=9$`, r`$x+2y+2z=3$`, r`$x+y+z=5$`, r`$x+2y+2z=0$`], e: r`Der Radius $${V(1, 2, 2)}$ ist Normalenvektor; den Berührpunkt einsetzen.` },
      { l: 3, q: r`Welche Kugel beschreibt $x^2+y^2+z^2-4x+6y-2z=2$?`, a: [r`Mittelpunkt $${P(2, -3, 1)}$, Radius 4`, r`Mittelpunkt $${P(-2, 3, -1)}$, Radius 4`, r`Mittelpunkt $${P(2, -3, 1)}$, Radius $\sqrt2$`, r`Mittelpunkt $${P(4, -6, 2)}$, Radius 16`], e: r`Dreimal ergänzen: rechts steht $2+4+9+1=16$.` },
      { l: 3, q: r`Die Gerade $X=${V(0, 0, 3)}+t\cdot${V(1, 0, 0)}$ schneidet die Kugel $x^2+y^2+z^2=25$. Wie lang ist die Sehne?`, a: [r`$8$`, r`$4$`, r`$10$`, r`$6$`], e: r`$t^2+9=25$ ergibt $t=\pm4$.` },
      { l: 3, q: r`Jede Gerade durch einen Punkt im Innern der Kugel schneidet die Kugel in genau zwei Punkten.`, tf: true, e: r`In beiden Richtungen muss sie die Kugel einmal verlassen.` },
      { l: 3, q: r`Für welche $d$ berührt die Ebene $2x+y+2z=d$ die Kugel um den Ursprung mit dem Radius 3?`, a: [r`Für $d=9$ und $d=-9$`, r`Nur für $d=9$`, r`Für $d=3$ und $d=-3$`, r`Für $d=27$`], e: r`$\frac{|d|}{3}=3$.` },
      { l: 3, q: r`Eine Kugel um $${P(1, 2, 2)}$ berührt die $xy$-Ebene. Wie lautet ihre Gleichung?`, a: [r`$(x-1)^2+(y-2)^2+(z-2)^2=4$`, r`$(x-1)^2+(y-2)^2+(z-2)^2=9$`, r`$(x-1)^2+(y-2)^2+(z-2)^2=2$`, r`$(x-1)^2+(y-2)^2+z^2=4$`], e: r`Der Radius ist die Höhe des Mittelpunkts über der $xy$-Ebene, also 2.` },
      { l: 3, q: r`Zwei Kugeln mit dem Radius 5 haben den Mittelpunktsabstand 6. Welchen Radius hat ihr Schnittkreis?`, a: [r`$4$`, r`$3$`, r`$5$`, r`$\sqrt{11}$`], e: r`Der Kreis liegt in der Mitte, 3 von jedem Mittelpunkt: $\sqrt{25-9}$.` },
      { l: 3, q: r`Wie nahe kommt die Kugel $x^2+y^2+z^2=25$ dem Punkt $${P(6, 8, 0)}$?`, a: [r`$5$`, r`$10$`, r`$15$`, r`$\sqrt{75}$`], e: r`Der Punkt ist 10 vom Mittelpunkt entfernt; davon geht der Radius ab.` }
    ]
  };
})();
