// quiz_inv.js — Quizfragen zu den Umkehrfunktionen (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).inv = {

    // ───────────────────────── Begriff: Spiegelung an y = x ─────────────────────────
    mirror: [
      { l: 1, q: r`Was macht die Umkehrfunktion $f^{-1}$?`, a: [r`Sie ordnet jedem Funktionswert $y$ wieder das zugehörige $x$ zu.`, r`Sie ordnet jedem $x$ den Kehrwert von $f(x)$ zu.`, r`Sie ordnet jedem $x$ den Wert $-f(x)$ zu.`, r`Sie ordnet jedem $x$ die Steigung von $f$ zu.`], e: r`Sie liest die Zuordnung rückwärts.` },
      { l: 1, q: r`An welcher Geraden spiegelt man den Graphen von $f$, um den Graphen von $f^{-1}$ zu erhalten?`, a: [r`An $y=x$`, r`An der $x$-Achse`, r`An der $y$-Achse`, r`An $y=-x$`], e: r`Beim Spiegeln an der Winkelhalbierenden tauschen $x$ und $y$ die Rollen.` },
      { l: 1, q: r`Der Punkt $(2\,|\,8)$ liegt auf dem Graphen von $f$. Welcher Punkt liegt dann auf dem Graphen von $f^{-1}$?`, a: [r`$(8\,|\,2)$`, r`$(-2\,|\,-8)$`, r`$(2\,|\,-8)$`, r`$\left(\frac12\,\big|\,\frac18\right)$`], e: r`Die Koordinaten werden vertauscht.` },
      { l: 1, q: r`Es ist $f(3)=7$. Wie gross ist $f^{-1}(7)$?`, a: [r`$3$`, r`$7$`, r`$\frac17$`, r`$-3$`], e: r`$f^{-1}$ führt von 7 zurück zu 3.` },
      { l: 1, q: r`$f^{-1}(x)$ bedeutet dasselbe wie $\frac{1}{f(x)}$.`, tf: false, e: r`Die hochgestellte $-1$ steht hier für «umkehren», nicht für den Kehrwert.` },
      { l: 1, q: r`Wie erhält man aus der Wertetabelle von $f$ die Wertetabelle von $f^{-1}$?`, a: [r`Man vertauscht die Zeile der $x$-Werte mit der Zeile der $y$-Werte.`, r`Man ändert bei allen Werten das Vorzeichen.`, r`Man bildet von allen $y$-Werten den Kehrwert.`, r`Man liest die Tabelle von rechts nach links.`], e: r`Aus dem Paar $(x\,|\,y)$ wird das Paar $(y\,|\,x)$.` },
      { l: 1, q: r`Was ergibt $f^{-1}\big(f(x)\big)$?`, a: [r`$x$`, r`$1$`, r`$0$`, r`$f(x)^2$`], e: r`Erst $f$, dann $f^{-1}$ führt zum Ausgangswert zurück.` },
      { l: 1, q: r`Welchen Definitionsbereich hat $f^{-1}$?`, a: [r`Den Wertebereich von $f$.`, r`Den Definitionsbereich von $f$.`, r`Immer alle reellen Zahlen.`, r`Nur die positiven Zahlen.`], e: r`Definitions- und Wertebereich tauschen.` },
      { l: 1, q: r`Welchen Bildpunkt hat $(a\,|\,b)$ bei der Spiegelung an $y=x$?`, a: [r`$(b\,|\,a)$`, r`$(-a\,|\,-b)$`, r`$(a\,|\,-b)$`, r`$(-b\,|\,-a)$`], e: r`Die Koordinaten tauschen die Plätze.` },
      { l: 1, q: r`Punkte auf der Geraden $y=x$ bleiben bei der Spiegelung an ihrem Ort.`, tf: true, e: r`Aus $(a\,|\,a)$ wird wieder $(a\,|\,a)$.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=x+3$?`, a: [r`$f^{-1}(x)=x-3$`, r`$f^{-1}(x)=-x-3$`, r`$f^{-1}(x)=\frac{1}{x+3}$`, r`$f^{-1}(x)=3-x$`], e: r`«Plus 3» wird durch «minus 3» rückgängig gemacht.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=2x$?`, a: [r`$f^{-1}(x)=\frac{x}{2}$`, r`$f^{-1}(x)=-2x$`, r`$f^{-1}(x)=x-2$`, r`$f^{-1}(x)=\frac{2}{x}$`], e: r`«Mal 2» wird durch «geteilt durch 2» rückgängig gemacht.` },

      { l: 2, q: r`Der Graph von $f$ schneidet die $y$-Achse bei 5. Was folgt für $f^{-1}$?`, a: [r`$f^{-1}$ hat die Nullstelle $x=5$.`, r`$f^{-1}$ schneidet die $y$-Achse bei 5.`, r`$f^{-1}$ hat die Nullstelle $x=-5$.`, r`$f^{-1}$ schneidet die $y$-Achse bei $\frac15$.`], e: r`Aus $(0\,|\,5)$ wird $(5\,|\,0)$.` },
      { l: 2, q: r`Ist $f$ streng monoton steigend, so ist auch $f^{-1}$ streng monoton steigend.`, tf: true, e: r`Grösseres $x$ gibt grösseres $y$, und das gilt auch rückwärts gelesen.` },
      { l: 2, q: r`Die Gerade $f(x)=2x+1$ hat die Steigung 2. Welche Steigung hat $f^{-1}$?`, a: [r`$\frac12$`, r`$-2$`, r`$2$`, r`$-\frac12$`], e: r`$\Delta x$ und $\Delta y$ tauschen: Die Steigung wird zum Kehrwert.` },
      { l: 2, q: r`Wo schneiden sich die Graphen von $f(x)=2x+1$ und $f^{-1}$?`, a: [r`In $(-1\,|\,-1)$`, r`In $(1\,|\,3)$`, r`In $(0\,|\,1)$`, r`Gar nicht`], e: r`Auf der Geraden $y=x$: $2x+1=x$.` },
      { l: 2, q: r`Was ist die Umkehrfunktion von $f^{-1}$?`, a: [r`$f$`, r`$\frac{1}{f}$`, r`$-f$`, r`$f^{-2}$`], e: r`Zweimal Spiegeln an $y=x$ ergibt wieder das Original.` },
      { l: 2, q: r`Es ist $f(x)=x^3$. Wie gross ist $f^{-1}(8)$?`, a: [r`$2$`, r`$512$`, r`$\frac18$`, r`$24$`], e: r`Gesucht ist das $x$ mit $x^3=8$.` },
      { l: 2, q: r`Welche Funktion ist ihre eigene Umkehrfunktion?`, a: [r`$f(x)=\frac1x$`, r`$f(x)=x^2$`, r`$f(x)=2x$`, r`$f(x)=x+1$`], e: r`Der Graph von $\frac1x$ ist symmetrisch zur Geraden $y=x$.` },
      { l: 2, q: r`Die Graphen von $f$ und $f^{-1}$ sind immer verschieden.`, tf: false, e: r`Bei $f(x)=x$ oder $f(x)=\frac1x$ fallen sie zusammen.` },
      { l: 2, q: r`Der Graph von $f$ hat die waagrechte Asymptote $y=0$. Was folgt für $f^{-1}$?`, a: [r`Der Graph hat die senkrechte Asymptote $x=0$.`, r`Der Graph hat die waagrechte Asymptote $y=0$.`, r`Der Graph hat keine Asymptote.`, r`Der Graph hat die Asymptote $y=x$.`], e: r`Beim Spiegeln an $y=x$ wird aus der $x$-Achse die $y$-Achse. Beispiel: $2^x$ und $\log_2x$.` },
      { l: 2, q: r`$f$ hat den Definitionsbereich $[0,4]$ und den Wertebereich $[1,9]$. Was gilt für $f^{-1}$?`, a: [r`Definitionsbereich $[1,9]$, Wertebereich $[0,4]$`, r`Definitionsbereich $[0,4]$, Wertebereich $[1,9]$`, r`Definitionsbereich $[-4,0]$, Wertebereich $[-9,-1]$`, r`Definitionsbereich $\left[\frac19,1\right]$, Wertebereich $[0,4]$`], e: r`Die beiden Bereiche tauschen.` },

      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=-x+4$?`, a: [r`$f^{-1}(x)=-x+4$`, r`$f^{-1}(x)=x-4$`, r`$f^{-1}(x)=x+4$`, r`$f^{-1}(x)=-x-4$`], e: r`$y=-x+4$ nach $x$ auflösen: $x=-y+4$. Die Gerade steht senkrecht auf $y=x$ und wird auf sich selbst gespiegelt.` },
      { l: 3, q: r`Ein Schnittpunkt der Graphen von $f$ und $f^{-1}$ liegt immer auf der Geraden $y=x$.`, tf: false, e: r`Gegenbeispiel $f(x)=\frac1x$: Der Punkt $(2\,|\,0.5)$ liegt auf beiden Graphen. Für steigende Funktionen stimmt die Aussage.` },
      { l: 3, q: r`Die Tangente an $f(x)=x^3$ im Punkt $(2\,|\,8)$ hat die Steigung 12. Welche Steigung hat die Tangente an $f^{-1}$ im Punkt $(8\,|\,2)$?`, a: [r`$\frac{1}{12}$`, r`$12$`, r`$-12$`, r`$-\frac{1}{12}$`], e: r`Auch die Tangente wird gespiegelt, ihre Steigung wird zum Kehrwert.` },
      { l: 3, q: r`Es ist $f(x)=x^3+x$. Wie gross ist $f^{-1}(10)$?`, a: [r`$2$`, r`$1010$`, r`$\frac{1}{10}$`, r`$3$`], e: r`$f^{-1}$ muss man dazu nicht berechnen: Gesucht ist das $x$ mit $x^3+x=10$.` },
      { l: 3, q: r`$f$ ist streng monoton fallend. Was gilt für $f^{-1}$?`, a: [r`$f^{-1}$ ist auch streng monoton fallend.`, r`$f^{-1}$ ist streng monoton steigend.`, r`$f^{-1}$ ist konstant.`, r`$f^{-1}$ gibt es nicht.`], e: r`Eine fallende Kurve bleibt beim Spiegeln an $y=x$ fallend. Beispiel: $f(x)=-x+4$.` },
      { l: 3, q: r`Der Graph einer linearen Funktion $f$ geht durch $(1\,|\,4)$ und $(3\,|\,10)$. Wie gross ist $f^{-1}(7)$?`, a: [r`$2$`, r`$22$`, r`$\frac17$`, r`$5$`], e: r`7 liegt in der Mitte zwischen 4 und 10, also gehört dazu die Mitte zwischen 1 und 3.` },
      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=\frac{x+1}{x-1}$?`, a: [r`$f^{-1}(x)=\frac{x+1}{x-1}$`, r`$f^{-1}(x)=\frac{x-1}{x+1}$`, r`$f^{-1}(x)=\frac{1-x}{1+x}$`, r`$f^{-1}(x)=\frac{x+1}{1-x}$`], e: r`$y\,(x-1)=x+1$ ergibt $x\,(y-1)=y+1$. Die Funktion ist ihre eigene Umkehrfunktion.` },
      { l: 3, q: r`Wie viele Schnittpunkte haben die Graphen von $f(x)=x^3$ und $f^{-1}$?`, a: [r`$3$`, r`$1$`, r`$2$`, r`Keinen`], e: r`$f$ ist steigend, also liegen sie auf $y=x$: $x^3=x$ hat die Lösungen $-1$, $0$ und $1$.` }
    ],

    // ───────────────────────── Umkehrbarkeit und Einschränkung ─────────────────────────
    test: [
      { l: 1, q: r`Wann ist eine Funktion umkehrbar?`, a: [r`Wenn jeder Funktionswert höchstens einmal vorkommt.`, r`Wenn sie keine Nullstelle hat.`, r`Wenn ihr Graph durch den Ursprung geht.`, r`Wenn sie nur positive Werte annimmt.`], e: r`Nur dann führt von jedem $y$ ein eindeutiger Weg zurück zum $x$.` },
      { l: 1, q: r`Wie erkennt man am Graphen, ob $f$ umkehrbar ist?`, a: [r`Jede waagrechte Gerade schneidet den Graphen höchstens einmal.`, r`Jede senkrechte Gerade schneidet den Graphen höchstens einmal.`, r`Der Graph schneidet die Gerade $y=x$.`, r`Der Graph hat keine Knicke.`], e: r`Zwei Schnittpunkte auf gleicher Höhe heissen: Derselbe Wert kommt zweimal vor.` },
      { l: 1, q: r`Ist $f(x)=x^2$ auf ganz $\mathbb{R}$ umkehrbar?`, a: [r`Nein, zum Beispiel ist $f(2)=f(-2)$.`, r`Ja, die Umkehrfunktion ist $\sqrt{x}$.`, r`Ja, denn jede Funktion ist umkehrbar.`, r`Nein, weil $f$ keine negativen Werte annimmt.`], e: r`Der Wert 4 kommt zweimal vor.` },
      { l: 1, q: r`$f(x)=x^3$ ist auf ganz $\mathbb{R}$ umkehrbar.`, tf: true, e: r`Die Funktion ist streng monoton steigend.` },
      { l: 1, q: r`Jede streng monoton steigende Funktion ist umkehrbar.`, tf: true, e: r`Verschiedene $x$ haben dann immer verschiedene Funktionswerte.` },
      { l: 1, q: r`Wie macht man $f(x)=x^2$ umkehrbar?`, a: [r`Man schränkt den Definitionsbereich ein, zum Beispiel auf $x\ge0$.`, r`Man schränkt den Wertebereich auf $y\ge0$ ein.`, r`Man spiegelt den Graphen an der $x$-Achse.`, r`Das geht nicht.`], e: r`Auf dem rechten Parabelast kommt jeder Wert nur einmal vor.` },
      { l: 1, q: r`Ist $f(x)=2x+1$ umkehrbar?`, a: [r`Ja.`, r`Nein, weil der Graph nicht durch den Ursprung geht.`, r`Nur für $x\ge0$.`, r`Nein, weil die Steigung nicht 1 ist.`], e: r`Eine Gerade mit Steigung ungleich 0 ist streng monoton.` },
      { l: 1, q: r`Ist die konstante Funktion $f(x)=3$ umkehrbar?`, a: [r`Nein, alle $x$ haben denselben Funktionswert.`, r`Ja, die Umkehrfunktion ist $f^{-1}(x)=\frac13$.`, r`Ja, die Umkehrfunktion ist $f^{-1}(x)=3$.`, r`Nur für $x=3$.`], e: r`Vom Wert 3 gibt es keinen eindeutigen Weg zurück.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=x^2$ mit $x\ge0$?`, a: [r`$f^{-1}(x)=\sqrt{x}$`, r`$f^{-1}(x)=-\sqrt{x}$`, r`$f^{-1}(x)=\frac{1}{x^2}$`, r`$f^{-1}(x)=\frac{x}{2}$`], e: r`Die Wurzel macht das Quadrieren rückgängig.` },
      { l: 1, q: r`Die Sinusfunktion ist auf ganz $\mathbb{R}$ umkehrbar.`, tf: false, e: r`Jeder Wert zwischen $-1$ und 1 kommt unendlich oft vor.` },
      { l: 1, q: r`Eine waagrechte Gerade schneidet den Graphen von $f$ dreimal. Was folgt?`, a: [r`$f$ ist nicht umkehrbar.`, r`$f$ ist umkehrbar.`, r`$f$ ist keine Funktion.`, r`$f$ hat drei Nullstellen.`], e: r`Derselbe Funktionswert kommt dreimal vor.` },
      { l: 1, q: r`Ist $f(x)=\frac1x$ (mit $x\ne0$) umkehrbar?`, a: [r`Ja, jeder Wert kommt genau einmal vor.`, r`Nein, wegen der Polstelle.`, r`Nein, weil der Graph zwei Äste hat.`, r`Nur für $x>0$.`], e: r`Jede waagrechte Gerade $y=k$ mit $k\ne0$ trifft die Hyperbel genau einmal.` },

      { l: 2, q: r`Welches ist der grösste Bereich der Form $x\ge r$, auf dem $f(x)=(x-1)^2+2$ umkehrbar ist?`, a: [r`$x\ge1$`, r`$x\ge0$`, r`$x\ge-1$`, r`$x\ge-2$`], e: r`Der Scheitel liegt bei $x=1$. Rechts davon steigt die Parabel nur noch.` },
      { l: 2, q: r`Welche Umkehrfunktion hat $f(x)=x^2$ mit $x\le0$?`, a: [r`$f^{-1}(x)=-\sqrt{x}$`, r`$f^{-1}(x)=\sqrt{x}$`, r`$f^{-1}(x)=\sqrt{-x}$`, r`$f^{-1}(x)=-x^2$`], e: r`Auf dem linken Parabelast sind die $x$-Werte negativ.` },
      { l: 2, q: r`Ist $f(x)=|x|$ auf ganz $\mathbb{R}$ umkehrbar?`, a: [r`Nein, zum Beispiel ist $f(-2)=f(2)$.`, r`Ja, die Umkehrfunktion ist $|x|$.`, r`Ja, die Umkehrfunktion ist $-|x|$.`, r`Nein, wegen des Knicks.`], e: r`Wie bei der Parabel kommt jeder positive Wert zweimal vor.` },
      { l: 2, q: r`$f(x)=x^2$ ist auf dem Intervall $[-1,3]$ umkehrbar.`, tf: false, e: r`$f(-1)=f(1)=1$: Das Intervall enthält den Scheitel.` },
      { l: 2, q: r`Auf welches Intervall schränkt man den Sinus üblicherweise ein, damit er umkehrbar wird?`, a: [r`Auf $\left[-\frac{\pi}{2},\frac{\pi}{2}\right]$`, r`Auf $[0,\pi]$`, r`Auf $[0,2\pi]$`, r`Auf $[-\pi,\pi]$`], e: r`Dort steigt er von $-1$ bis 1, und jeder Wert kommt genau einmal vor.` },
      { l: 2, q: r`Ist $f(x)=2^x$ umkehrbar?`, a: [r`Ja, die Funktion ist streng monoton steigend.`, r`Nein, weil sie nur positive Werte annimmt.`, r`Nein, weil sie keine Nullstelle hat.`, r`Nur für $x\ge0$.`], e: r`Die Umkehrfunktion ist $\log_2x$.` },
      { l: 2, q: r`Jede senkrechte Gerade schneidet einen Graphen höchstens einmal. Was sagt das aus?`, a: [r`Der Graph gehört zu einer Funktion.`, r`Die Funktion ist umkehrbar.`, r`Die Funktion ist monoton.`, r`Die Funktion hat keine Nullstelle.`], e: r`Die senkrechte Probe prüft die Funktion selbst, die waagrechte ihre Umkehrbarkeit.` },
      { l: 2, q: r`Welche Umkehrfunktion hat $f(x)=x^4$ mit $x\ge0$?`, a: [r`$f^{-1}(x)=\sqrt[4]{x}$`, r`$f^{-1}(x)=\frac{x}{4}$`, r`$f^{-1}(x)=x^{-4}$`, r`$f^{-1}(x)=\sqrt{x}$`], e: r`Die vierte Wurzel macht «hoch 4» rückgängig.` },
      { l: 2, q: r`Ist $f(x)=x^3-3x$ auf ganz $\mathbb{R}$ umkehrbar?`, a: [r`Nein, der Graph hat einen Hoch- und einen Tiefpunkt.`, r`Ja, wie jede Funktion dritten Grades.`, r`Ja, weil der Graph punktsymmetrisch ist.`, r`Nein, weil $f$ eine Nullstelle hat.`], e: r`Waagrechte Geraden zwischen Tief- und Hochpunkt schneiden den Graphen dreimal.` },
      { l: 2, q: r`Man schränkt $f(x)=(x-1)^2+2$ auf $x\ge1$ ein. Welchen Definitionsbereich hat die Umkehrfunktion?`, a: [r`$x\ge2$`, r`$x\ge1$`, r`$x\ge0$`, r`Alle reellen Zahlen`], e: r`Der Wertebereich von $f$ ist $y\ge2$, und er wird zum Definitionsbereich von $f^{-1}$.` },

      { l: 3, q: r`Jede umkehrbare Funktion ist streng monoton.`, tf: false, e: r`$f(x)=\frac1x$ ist umkehrbar, aber über die Polstelle hinweg nicht monoton: $f(-1)<f(1)$, obwohl beide Äste fallen.` },
      { l: 3, q: r`Welches ist das grösste Intervall um 0, auf dem $f(x)=x^3-3x$ umkehrbar ist?`, a: [r`$[-1,1]$`, r`$[-3,3]$`, r`$\left[-\sqrt3,\sqrt3\right]$`, r`$[-2,2]$`], e: r`$f'(x)=3x^2-3$ ist zwischen den Extremstellen $-1$ und 1 negativ; dort fällt $f$.` },
      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=x^2-4x$ mit $x\le2$?`, a: [r`$f^{-1}(x)=2-\sqrt{x+4}$`, r`$f^{-1}(x)=2+\sqrt{x+4}$`, r`$f^{-1}(x)=-2+\sqrt{x+4}$`, r`$f^{-1}(x)=2-\sqrt{x-4}$`], e: r`$y=(x-2)^2-4$; links vom Scheitel ist $x-2=-\sqrt{y+4}$.` },
      { l: 3, q: r`Für welche $a$ ist $f(x)=x^3+a\,x$ auf ganz $\mathbb{R}$ umkehrbar?`, a: [r`Für $a\ge0$`, r`Für $a\le0$`, r`Für alle $a$`, r`Nur für $a=0$`], e: r`$f'(x)=3x^2+a$ wird für $a\ge0$ nie negativ. Für $a<0$ entstehen ein Hoch- und ein Tiefpunkt.` },
      { l: 3, q: r`Ist $f(x)=e^x+x$ umkehrbar?`, a: [r`Ja, aber $f^{-1}$ lässt sich nicht als Formel hinschreiben.`, r`Nein, weil man $y=e^x+x$ nicht nach $x$ auflösen kann.`, r`Ja, mit $f^{-1}(x)=\ln x-x$.`, r`Nein, $f$ ist nicht monoton.`], e: r`$f$ ist als Summe zweier steigender Funktionen streng monoton steigend. Umkehrbar sein und eine Formel haben sind zwei verschiedene Dinge.` },
      { l: 3, q: r`Auf welches Intervall schränkt man den Kosinus üblicherweise ein, damit er umkehrbar wird?`, a: [r`Auf $[0,\pi]$`, r`Auf $\left[-\frac{\pi}{2},\frac{\pi}{2}\right]$`, r`Auf $[0,2\pi]$`, r`Auf $[-\pi,\pi]$`], e: r`Dort fällt er von 1 auf $-1$. Auf $\left[-\frac{\pi}{2},\frac{\pi}{2}\right]$ hat er in der Mitte einen Hochpunkt.` },
      { l: 3, q: r`Ist $f(x)=x+\frac1x$ für $x>0$ umkehrbar?`, a: [r`Nein, zum Beispiel ist $f\left(\frac12\right)=f(2)$.`, r`Ja, $f$ ist streng monoton steigend.`, r`Ja, $f$ ist streng monoton fallend.`, r`Nein, $f$ ist konstant.`], e: r`Beide Werte sind 2.5. Der Graph hat bei $x=1$ einen Tiefpunkt.` },
      { l: 3, q: r`Ist $f$ auf $[0,1]$ umkehrbar und auf $[1,2]$ umkehrbar, so auch auf $[0,2]$.`, tf: false, e: r`Gegenbeispiel $f(x)=(x-1)^2$: fällt auf $[0,1]$, steigt auf $[1,2]$, aber $f(0)=f(2)$.` }
    ],

    // ───────────────────────── Umkehrfunktion berechnen ─────────────────────────
    calc: [
      { l: 1, q: r`Womit beginnt man, wenn man die Umkehrfunktion berechnet?`, a: [r`Man löst $y=f(x)$ nach $x$ auf.`, r`Man leitet $f$ ab.`, r`Man setzt $f(x)=0$.`, r`Man bildet den Kehrwert von $f(x)$.`], e: r`Gesucht ist das $x$ zu einem gegebenen $y$.` },
      { l: 1, q: r`Was macht man, nachdem man $y=f(x)$ nach $x$ aufgelöst hat?`, a: [r`Man vertauscht $x$ und $y$.`, r`Man ändert alle Vorzeichen.`, r`Man setzt $x=0$ ein.`, r`Man quadriert beide Seiten.`], e: r`So heisst die Variable der Umkehrfunktion wieder $x$.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=2x+1$?`, a: [r`$f^{-1}(x)=\frac{x-1}{2}$`, r`$f^{-1}(x)=\frac{x}{2}-1$`, r`$f^{-1}(x)=\frac{x+1}{2}$`, r`$f^{-1}(x)=-2x-1$`], e: r`Zuerst 1 abziehen, dann durch 2 teilen.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=x-5$?`, a: [r`$f^{-1}(x)=x+5$`, r`$f^{-1}(x)=5-x$`, r`$f^{-1}(x)=-x-5$`, r`$f^{-1}(x)=\frac{x}{5}$`], e: r`«Minus 5» wird durch «plus 5» rückgängig gemacht.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=3x$?`, a: [r`$f^{-1}(x)=\frac{x}{3}$`, r`$f^{-1}(x)=-3x$`, r`$f^{-1}(x)=x-3$`, r`$f^{-1}(x)=\frac{3}{x}$`], e: r`«Mal 3» wird durch «geteilt durch 3» rückgängig gemacht.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=x^3$?`, a: [r`$f^{-1}(x)=\sqrt[3]{x}$`, r`$f^{-1}(x)=\frac{x}{3}$`, r`$f^{-1}(x)=x^{-3}$`, r`$f^{-1}(x)=3^x$`], e: r`Die dritte Wurzel macht «hoch 3» rückgängig.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=2^x$?`, a: [r`$f^{-1}(x)=\log_2x$`, r`$f^{-1}(x)=\sqrt{x}$`, r`$f^{-1}(x)=\frac{x}{2}$`, r`$f^{-1}(x)=x^2$`], e: r`Der Logarithmus fragt nach dem Exponenten.` },
      { l: 1, q: r`Beim Umkehren macht man die Rechenschritte von $f$ in umgekehrter Reihenfolge rückgängig.`, tf: true, e: r`Wie beim Ausziehen: Was zuletzt angezogen wurde, kommt zuerst weg.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=e^x$?`, a: [r`$f^{-1}(x)=\ln x$`, r`$f^{-1}(x)=e^{-x}$`, r`$f^{-1}(x)=\frac{x}{e}$`, r`$f^{-1}(x)=x^e$`], e: r`Der natürliche Logarithmus ist der Logarithmus zur Basis $e$.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=\frac{x}{4}$?`, a: [r`$f^{-1}(x)=4x$`, r`$f^{-1}(x)=\frac{4}{x}$`, r`$f^{-1}(x)=x-4$`, r`$f^{-1}(x)=-\frac{x}{4}$`], e: r`«Geteilt durch 4» wird durch «mal 4» rückgängig gemacht.` },
      { l: 1, q: r`Welche Umkehrfunktion hat $f(x)=\sqrt{x}$?`, a: [r`$f^{-1}(x)=x^2$ mit $x\ge0$`, r`$f^{-1}(x)=x^2$ für alle $x$`, r`$f^{-1}(x)=-\sqrt{x}$`, r`$f^{-1}(x)=\frac{x}{2}$`], e: r`Die Wurzel nimmt nur Werte ab 0 an; das ist der Definitionsbereich der Umkehrfunktion.` },
      { l: 1, q: r`Wie prüft man eine berechnete Umkehrfunktion?`, a: [r`Man setzt ein: $f^{-1}\big(f(x)\big)$ muss $x$ ergeben.`, r`Man prüft, ob $f^{-1}(0)=0$ ist.`, r`Man prüft, ob $f(x)\cdot f^{-1}(x)=1$ ist.`, r`Man prüft, ob $f(x)+f^{-1}(x)=0$ ist.`], e: r`Erst $f$, dann $f^{-1}$ führt zum Ausgangswert zurück.` },

      { l: 2, q: r`Welche Umkehrfunktion hat $f(x)=-\frac{x}{2}+3$?`, a: [r`$f^{-1}(x)=-2x+6$`, r`$f^{-1}(x)=-2x+3$`, r`$f^{-1}(x)=2x-6$`, r`$f^{-1}(x)=-2x-6$`], e: r`$y-3=-\frac{x}{2}$, also $x=-2\,(y-3)$.` },
      { l: 2, q: r`Welche Umkehrfunktion hat $f(x)=\sqrt{x-2}+1$?`, a: [r`$f^{-1}(x)=(x-1)^2+2$ mit $x\ge1$`, r`$f^{-1}(x)=(x+1)^2-2$ mit $x\ge-1$`, r`$f^{-1}(x)=(x-2)^2+1$ mit $x\ge2$`, r`$f^{-1}(x)=x^2+1$ mit $x\ge0$`], e: r`Zuerst 1 abziehen, dann quadrieren, dann 2 addieren.` },
      { l: 2, q: r`Welche Umkehrfunktion hat $f(x)=\frac{2}{x+1}-1$?`, a: [r`$f^{-1}(x)=\frac{2}{x+1}-1$`, r`$f^{-1}(x)=\frac{2}{x-1}+1$`, r`$f^{-1}(x)=\frac{x+1}{2}-1$`, r`$f^{-1}(x)=\frac{x+1}{2}+1$`], e: r`$y+1=\frac{2}{x+1}$ ergibt $x+1=\frac{2}{y+1}$. Die Funktion ist ihre eigene Umkehrfunktion.` },
      { l: 2, q: r`Welche Umkehrfunktion hat $f(x)=3\cdot2^x-1$?`, a: [r`$f^{-1}(x)=\log_2\left(\frac{x+1}{3}\right)$`, r`$f^{-1}(x)=\frac{\log_2(x+1)}{3}$`, r`$f^{-1}(x)=\log_2\left(\frac{x}{3}\right)+1$`, r`$f^{-1}(x)=\log_2\left(\frac{x-1}{3}\right)$`], e: r`Zuerst 1 addieren, dann durch 3 teilen, dann den Logarithmus nehmen.` },
      { l: 2, q: r`Welche Umkehrfunktion hat $f(x)=\ln(x-1)$?`, a: [r`$f^{-1}(x)=e^x+1$`, r`$f^{-1}(x)=e^x-1$`, r`$f^{-1}(x)=e^{x+1}$`, r`$f^{-1}(x)=e^{x-1}$`], e: r`$x-1=e^y$.` },
      { l: 2, q: r`Welche Umkehrfunktion hat $f(x)=2\lg x+1$?`, a: [r`$f^{-1}(x)=10^{\frac{x-1}{2}}$`, r`$f^{-1}(x)=\frac{10^{x-1}}{2}$`, r`$f^{-1}(x)=10^{\frac{x}{2}}-1$`, r`$f^{-1}(x)=10^{\frac{x+1}{2}}$`], e: r`$\lg x=\frac{y-1}{2}$.` },
      { l: 2, q: r`Welche Umkehrfunktion hat $f(x)=(x-1)^2+2$ mit $x\ge1$?`, a: [r`$f^{-1}(x)=\sqrt{x-2}+1$`, r`$f^{-1}(x)=\sqrt{x-1}+2$`, r`$f^{-1}(x)=\sqrt{x+2}-1$`, r`$f^{-1}(x)=-\sqrt{x-2}+1$`], e: r`Zuerst 2 abziehen, dann die Wurzel ziehen, dann 1 addieren.` },
      { l: 2, q: r`Die Umkehrfunktion von $f(x)=2x+1$ ist $f^{-1}(x)=\frac{1}{2x+1}$.`, tf: false, e: r`Das ist der Kehrwert. Die Umkehrfunktion ist $\frac{x-1}{2}$.` },
      { l: 2, q: r`Welche Umkehrfunktion hat $f(x)=x^3+1$?`, a: [r`$f^{-1}(x)=\sqrt[3]{x-1}$`, r`$f^{-1}(x)=\sqrt[3]{x}-1$`, r`$f^{-1}(x)=\sqrt[3]{x+1}$`, r`$f^{-1}(x)=(x-1)^3$`], e: r`Zuerst 1 abziehen, dann die dritte Wurzel ziehen.` },
      { l: 2, q: r`Welchen Definitionsbereich hat die Umkehrfunktion von $f(x)=\sqrt{x-2}+1$?`, a: [r`$x\ge1$`, r`$x\ge2$`, r`$x\ge0$`, r`Alle reellen Zahlen`], e: r`Die Wurzel ist mindestens 0, also ist $f(x)\ge1$: Das ist der Wertebereich von $f$.` },

      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=\frac{2x+1}{x-3}$?`, a: [r`$f^{-1}(x)=\frac{3x+1}{x-2}$`, r`$f^{-1}(x)=\frac{x-3}{2x+1}$`, r`$f^{-1}(x)=\frac{3x-1}{x+2}$`, r`$f^{-1}(x)=\frac{2x-1}{x+3}$`], e: r`$y\,(x-3)=2x+1$ ergibt $x\,(y-2)=3y+1$.` },
      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=\frac{1}{(x-1)^2}$ mit $x>1$?`, a: [r`$f^{-1}(x)=\frac{1}{\sqrt{x}}+1$`, r`$f^{-1}(x)=\frac{1}{\sqrt{x}}-1$`, r`$f^{-1}(x)=\frac{1}{\sqrt{x+1}}$`, r`$f^{-1}(x)=\sqrt{x}+1$`], e: r`$(x-1)^2=\frac1y$, und wegen $x>1$ ist $x-1=\frac{1}{\sqrt{y}}$.` },
      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=e^{2x}-3$?`, a: [r`$f^{-1}(x)=\frac12\ln(x+3)$`, r`$f^{-1}(x)=\ln\left(\frac{x+3}{2}\right)$`, r`$f^{-1}(x)=\frac12\ln x+3$`, r`$f^{-1}(x)=2\ln(x+3)$`], e: r`$e^{2x}=y+3$, also $2x=\ln(y+3)$.` },
      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=x^2-6x+10$ mit $x\ge3$?`, a: [r`$f^{-1}(x)=3+\sqrt{x-1}$`, r`$f^{-1}(x)=3-\sqrt{x-1}$`, r`$f^{-1}(x)=3+\sqrt{x-10}$`, r`$f^{-1}(x)=1+\sqrt{x-3}$`], e: r`Quadratisch ergänzen: $f(x)=(x-3)^2+1$.` },
      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=\frac{e^x-e^{-x}}{2}$?`, a: [r`$f^{-1}(x)=\ln\left(x+\sqrt{x^2+1}\right)$`, r`$f^{-1}(x)=\ln\left(x-\sqrt{x^2+1}\right)$`, r`$f^{-1}(x)=\ln(2x)$`, r`$f^{-1}(x)=\frac{\ln x-\ln(-x)}{2}$`], e: r`Mit $u=e^x$ wird $u-\frac1u=2y$ zur quadratischen Gleichung $u^2-2y\,u-1=0$; nur die positive Lösung passt.` },
      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=\log_2(x+3)-1$?`, a: [r`$f^{-1}(x)=2^{x+1}-3$`, r`$f^{-1}(x)=2^{x-1}+3$`, r`$f^{-1}(x)=2^{x}-2$`, r`$f^{-1}(x)=2^{x+3}-1$`], e: r`$\log_2(x+3)=y+1$, also $x+3=2^{y+1}$.` },
      { l: 3, q: r`Welche Umkehrfunktion hat $f(x)=\frac{x}{x+1}$?`, a: [r`$f^{-1}(x)=\frac{x}{1-x}$`, r`$f^{-1}(x)=\frac{x+1}{x}$`, r`$f^{-1}(x)=\frac{x}{x-1}$`, r`$f^{-1}(x)=\frac{1-x}{x}$`], e: r`$y\,(x+1)=x$ ergibt $x\,(1-y)=y$.` },
      { l: 3, q: r`Für die Umkehrfunktion von $f(x)=x^5+x$ gilt $f^{-1}(2)=1$.`, tf: true, e: r`$f(1)=2$. Den Term von $f^{-1}$ kann man nicht hinschreiben, einzelne Werte aber schon.` }
    ],

    // ───────────────────────── Bekannte Paare ─────────────────────────
    pairs: [
      { l: 1, q: r`Welche Funktion ist die Umkehrfunktion von $x^2$ (mit $x\ge0$)?`, a: [r`$\sqrt{x}$`, r`$\frac{x}{2}$`, r`$2^x$`, r`$\frac{1}{x^2}$`], e: r`Quadrieren und Wurzelziehen heben sich auf.` },
      { l: 1, q: r`Welche Funktion ist die Umkehrfunktion von $e^x$?`, a: [r`$\ln x$`, r`$\lg x$`, r`$e^{-x}$`, r`$x^e$`], e: r`Der natürliche Logarithmus.` },
      { l: 1, q: r`Welche Funktion ist die Umkehrfunktion von $10^x$?`, a: [r`$\lg x$`, r`$\ln x$`, r`$\frac{x}{10}$`, r`$x^{10}$`], e: r`Der Zehnerlogarithmus.` },
      { l: 1, q: r`Welche Funktion ist die Umkehrfunktion von $2^x$?`, a: [r`$\log_2x$`, r`$\sqrt{x}$`, r`$x^2$`, r`$\frac{x}{2}$`], e: r`Der Logarithmus zur Basis 2.` },
      { l: 1, q: r`Welche Funktion ist die Umkehrfunktion von $x^3$?`, a: [r`$\sqrt[3]{x}$`, r`$3^x$`, r`$\frac{x}{3}$`, r`$\log_3x$`], e: r`Die dritte Wurzel.` },
      { l: 1, q: r`Wie heisst die Umkehrfunktion des (eingeschränkten) Sinus?`, a: [r`$\arcsin$`, r`$\arccos$`, r`$\frac{1}{\sin}$`, r`$\cos$`], e: r`Auf dem Taschenrechner steht dafür meist $\sin^{-1}$.` },
      { l: 1, q: r`Wie gross ist $\ln\left(e^3\right)$?`, a: [r`$3$`, r`$e^3$`, r`$3e$`, r`$\frac13$`], e: r`$\ln$ macht $e^x$ rückgängig.` },
      { l: 1, q: r`Wie gross ist $e^{\ln7}$?`, a: [r`$7$`, r`$e^7$`, r`$\ln7$`, r`$7e$`], e: r`$e^x$ macht $\ln$ rückgängig.` },
      { l: 1, q: r`$f(x)=\frac1x$ ist ihre eigene Umkehrfunktion.`, tf: true, e: r`Der Kehrwert des Kehrwerts ist wieder die Zahl selbst.` },
      { l: 1, q: r`Wie gross ist $\log_28$?`, a: [r`$3$`, r`$4$`, r`$16$`, r`$\frac14$`], e: r`$2^3=8$.` },
      { l: 1, q: r`Wie gross ist $\arcsin(1)$?`, a: [r`$\frac{\pi}{2}$ (also $90^\circ$)`, r`$\pi$ (also $180^\circ$)`, r`$0$`, r`$1$`], e: r`Bei $90^\circ$ ist der Sinus 1.` },
      { l: 1, q: r`$\ln x$ ist nur für $x>0$ definiert.`, tf: true, e: r`$e^x$ nimmt nur positive Werte an.` },

      { l: 2, q: r`Warum ist $\ln x$ nur für $x>0$ definiert?`, a: [r`Weil $e^x$ nur positive Werte annimmt.`, r`Weil $e^x$ nur für $x>0$ definiert ist.`, r`Weil $e$ positiv ist.`, r`Weil man aus negativen Zahlen keine Wurzel ziehen kann.`], e: r`Der Wertebereich von $e^x$ ist der Definitionsbereich von $\ln x$.` },
      { l: 2, q: r`Was ergibt $\sqrt{x^2}$ für beliebige reelle $x$?`, a: [r`$|x|$`, r`$x$`, r`$-x$`, r`$\pm x$`], e: r`Die Wurzel ist nie negativ: $\sqrt{(-3)^2}=3$.` },
      { l: 2, q: r`Wie gross ist $\arcsin\left(\frac12\right)$?`, a: [r`$\frac{\pi}{6}$ (also $30^\circ$)`, r`$\frac{\pi}{3}$ (also $60^\circ$)`, r`$\frac{\pi}{4}$ (also $45^\circ$)`, r`$\frac{5\pi}{6}$ (also $150^\circ$)`], e: r`$\sin30^\circ=\frac12$, und $30^\circ$ liegt im Bereich des Arkussinus.` },
      { l: 2, q: r`Welchen Wertebereich hat $\arcsin$?`, a: [r`$\left[-\frac{\pi}{2},\frac{\pi}{2}\right]$`, r`$[0,\pi]$`, r`$[-1,1]$`, r`$[0,2\pi]$`], e: r`Das ist der eingeschränkte Definitionsbereich des Sinus.` },
      { l: 2, q: r`Wie gross ist $\arccos(0)$?`, a: [r`$\frac{\pi}{2}$`, r`$0$`, r`$1$`, r`$\pi$`], e: r`$\cos\frac{\pi}{2}=0$.` },
      { l: 2, q: r`Wie gross ist $\arctan(1)$?`, a: [r`$\frac{\pi}{4}$`, r`$\frac{\pi}{2}$`, r`$1$`, r`$\frac{\pi}{3}$`], e: r`$\tan45^\circ=1$.` },
      { l: 2, q: r`Wie gross ist $10^{\lg5}$?`, a: [r`$5$`, r`$50$`, r`$10^5$`, r`$\lg5$`], e: r`$10^x$ macht $\lg$ rückgängig.` },
      { l: 2, q: r`Für alle $x\ge0$ gilt $\left(\sqrt{x}\right)^2=x$.`, tf: true, e: r`Erst die Wurzel, dann das Quadrat führt zum Ausgangswert zurück.` },
      { l: 2, q: r`Durch welchen Punkt gehen die Graphen aller Logarithmusfunktionen $\log_ax$?`, a: [r`Durch $(1\,|\,0)$`, r`Durch $(0\,|\,1)$`, r`Durch $(1\,|\,1)$`, r`Durch $(0\,|\,0)$`], e: r`Alle Exponentialfunktionen $a^x$ gehen durch $(0\,|\,1)$; gespiegelt wird daraus $(1\,|\,0)$.` },
      { l: 2, q: r`Welchen Wertebereich hat $\arctan$?`, a: [r`Alle Werte zwischen $-\frac{\pi}{2}$ und $\frac{\pi}{2}$ (ohne die Ränder)`, r`Alle reellen Zahlen`, r`$[-1,1]$`, r`$[0,\pi]$`], e: r`Das ist der Bereich zwischen zwei Polstellen des Tangens.` },

      { l: 3, q: r`Wie gross ist $\arcsin(\sin\pi)$?`, a: [r`$0$`, r`$\pi$`, r`$1$`, r`$-\pi$`], e: r`$\sin\pi=0$ und $\arcsin0=0$. Der Arkussinus liefert nur Werte zwischen $-\frac{\pi}{2}$ und $\frac{\pi}{2}$.` },
      { l: 3, q: r`Wie gross ist $\arcsin\left(\sin\frac{2\pi}{3}\right)$?`, a: [r`$\frac{\pi}{3}$`, r`$\frac{2\pi}{3}$`, r`$-\frac{\pi}{3}$`, r`$\frac{\pi}{6}$`], e: r`$\sin120^\circ=\sin60^\circ$, und nur $60^\circ$ liegt im Bereich des Arkussinus.` },
      { l: 3, q: r`Für alle $x$ mit $-1\le x\le1$ gilt $\sin(\arcsin x)=x$.`, tf: true, e: r`In dieser Reihenfolge klappt es immer. Umgekehrt, bei $\arcsin(\sin x)$, nur im eingeschränkten Bereich.` },
      { l: 3, q: r`Wie gross ist $\arccos\left(\cos\left(-\frac{\pi}{3}\right)\right)$?`, a: [r`$\frac{\pi}{3}$`, r`$-\frac{\pi}{3}$`, r`$\frac{2\pi}{3}$`, r`$\frac{\pi}{6}$`], e: r`$\cos\left(-\frac{\pi}{3}\right)=\frac12$, und der Arkuskosinus liefert Werte zwischen 0 und $\pi$.` },
      { l: 3, q: r`Wie gross ist $e^{2\ln3}$?`, a: [r`$9$`, r`$6$`, r`$8$`, r`$3e^2$`], e: r`$2\ln3=\ln\left(3^2\right)$.` },
      { l: 3, q: r`Welche Asymptoten hat der Graph von $\arctan$?`, a: [r`Die waagrechten Geraden $y=\frac{\pi}{2}$ und $y=-\frac{\pi}{2}$`, r`Die senkrechten Geraden $x=\frac{\pi}{2}$ und $x=-\frac{\pi}{2}$`, r`Die waagrechten Geraden $y=1$ und $y=-1$`, r`Keine`], e: r`Aus den senkrechten Asymptoten des Tangens werden beim Spiegeln waagrechte.` },
      { l: 3, q: r`Was ergibt $\cos(\arcsin x)$ für $-1\le x\le1$?`, a: [r`$\sqrt{1-x^2}$`, r`$1-x$`, r`$\sqrt{1+x^2}$`, r`$\frac1x$`], e: r`Ist $\varphi=\arcsin x$, so ist $\sin\varphi=x$ und $\cos\varphi=\sqrt{1-\sin^2\varphi}$ (in diesem Bereich nie negativ).` },
      { l: 3, q: r`Für alle $x$ mit $-1\le x\le1$ gilt $\arcsin x+\arccos x=\frac{\pi}{2}$.`, tf: true, e: r`Im rechtwinkligen Dreieck: Der Sinus des einen spitzen Winkels ist der Kosinus des anderen, und beide ergänzen sich zu $90^\circ$.` }
    ]
  };
})();
