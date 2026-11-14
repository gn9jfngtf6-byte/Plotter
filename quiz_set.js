// quiz_set.js — Quizfragen zur Mengenlehre (wird von 116_quiz.js bei Bedarf geladen)
// Je Ansicht 30 Fragen: 12 × Stufe 1 (Grundwissen), 10 × Stufe 2 (Verständnis), 8 × Stufe 3 (Knacknuss).
// Die Reihenfolge hier ist die Reihenfolge im Quiz und auf dem Arbeitsblatt (Frage 1 bis 30).
// {l, q, a, e}: a[0] ist die richtige Antwort (Anzeige gemischt)   ·   {l, q, tf, e}: Aussage, tf = wahr/falsch
// Intervalle stehen hier als ]2,5[; 116_quiz.js zeigt sie in der im Thema gewählten Schreibweise, (2, 5) oder ]2; 5[ (ausser bei raw: true).
(function () {
  const r = String.raw;
  (window.QUIZ_DATA = window.QUIZ_DATA || {}).set = {

    // ───────────────────────── Intervalle und Schreibweisen ─────────────────────────
    iv: [
      { l: 1, q: r`Welche Zahlen gehören zum Intervall $[2,5]$?`, a: [r`Alle reellen Zahlen von 2 bis 5, die Randpunkte eingeschlossen.`, r`Nur die Zahlen 2 und 5.`, r`Nur die ganzen Zahlen 2, 3, 4 und 5.`, r`Alle reellen Zahlen zwischen 2 und 5, ohne die Randpunkte.`], e: r`Ein Intervall enthält auch alle Bruch- und Kommazahlen dazwischen.` },
      { l: 1, q: r`Wann heisst ein Intervall abgeschlossen?`, a: [r`Wenn beide Randpunkte dazugehören.`, r`Wenn kein Randpunkt dazugehört.`, r`Wenn es nur ganze Zahlen enthält.`, r`Wenn es bis unendlich reicht.`], e: r`Geschrieben mit eckigen Klammern: $[a,b]$.` },
      { l: 1, raw: true, q: r`Wann heisst ein Intervall offen?`, a: [r`Wenn kein Randpunkt dazugehört.`, r`Wenn beide Randpunkte dazugehören.`, r`Wenn es keine Zahlen enthält.`, r`Wenn es nur einen Randpunkt hat.`], e: r`Geschrieben $]a,b[$ oder $(a,b)$.` },
      { l: 1, q: r`Welche Ungleichung beschreibt $[2,5]$?`, a: [r`$2\le x\le5$`, r`$2<x<5$`, r`$2\le x<5$`, r`$x\le2$ oder $x\ge5$`], e: r`Die eckige Klammer heisst «kleiner oder gleich».` },
      { l: 1, q: r`Welche Ungleichung beschreibt $]2,5[$?`, a: [r`$2<x<5$`, r`$2\le x\le5$`, r`$2<x\le5$`, r`$x<2$ oder $x>5$`], e: r`Die Randpunkte gehören nicht dazu.` },
      { l: 1, q: r`Was bedeutet auf der Zahlengeraden ein gefüllter Punkt am Rand eines Intervalls?`, a: [r`Der Randpunkt gehört dazu.`, r`Der Randpunkt gehört nicht dazu.`, r`Das Intervall reicht bis unendlich.`, r`Dort liegt die Mitte des Intervalls.`], e: r`Gefüllt heisst: eingeschlossen.` },
      { l: 1, q: r`Was bedeutet auf der Zahlengeraden ein leerer Punkt am Rand eines Intervalls?`, a: [r`Der Randpunkt gehört nicht dazu.`, r`Der Randpunkt gehört dazu.`, r`Das Intervall ist leer.`, r`Dort liegt die Zahl 0.`], e: r`Leer heisst: ausgeschlossen.` },
      { l: 1, q: r`Die Zahl 5 liegt im Intervall $[2,5[$.`, tf: false, e: r`Rechts ist das Intervall offen: Es gilt $x<5$.` },
      { l: 1, q: r`Wie schreibt man $x\ge3$ als Intervall?`, a: [r`$[3,\infty[$`, r`$]3,\infty[$`, r`$]-\infty,3]$`, r`$[3,\infty]$`], e: r`3 gehört dazu, nach rechts ist das Intervall unbeschränkt.` },
      { l: 1, q: r`Bei $\infty$ und $-\infty$ ist ein Intervall immer offen.`, tf: true, e: r`Unendlich ist keine Zahl und kann nicht dazugehören.` },
      { l: 1, q: r`Liegt 2.5 im Intervall $]2,3]$?`, a: [r`Ja.`, r`Nein, weil 2.5 keine ganze Zahl ist.`, r`Nein, weil das Intervall links offen ist.`, r`Nur wenn man rundet.`], e: r`$2<2.5\le3$.` },
      { l: 1, q: r`Wie schreibt man $[1,4]$ als Menge?`, a: [r`$\{x\in\mathbb{R}\mid1\le x\le4\}$`, r`$\{1,4\}$`, r`$\{1,2,3,4\}$`, r`$\{x\in\mathbb{R}\mid1<x<4\}$`], e: r`Alle reellen Zahlen, die die Ungleichung erfüllen.` },

      { l: 2, q: r`Wie schreibt man $x<-1$ als Intervall?`, a: [r`$]-\infty,-1[$`, r`$]-\infty,-1]$`, r`$]-1,\infty[$`, r`$[-\infty,-1[$`], e: r`$-1$ gehört nicht dazu, nach links ist das Intervall unbeschränkt.` },
      { l: 2, q: r`Welche Ungleichung beschreibt $[2,5[$?`, a: [r`$2\le x<5$`, r`$2<x\le5$`, r`$2\le x\le5$`, r`$2<x<5$`], e: r`Links eingeschlossen, rechts ausgeschlossen.` },
      { l: 2, q: r`Wie viele ganze Zahlen liegen in $]2,6[$?`, a: [r`$3$`, r`$5$`, r`$4$`, r`$2$`], e: r`3, 4 und 5.` },
      { l: 2, q: r`Wie viele ganze Zahlen liegen in $[-2,2]$?`, a: [r`$5$`, r`$4$`, r`$3$`, r`$2$`], e: r`$-2,\ -1,\ 0,\ 1,\ 2$.` },
      { l: 2, q: r`Wie lang ist das Intervall $[3,8]$?`, a: [r`$5$`, r`$6$`, r`$11$`, r`$8$`], e: r`$8-3$.` },
      { l: 2, raw: true, q: r`$]2,5[$ und $(2,5)$ bezeichnen dasselbe Intervall.`, tf: true, e: r`Es sind zwei Schreibweisen für das offene Intervall.` },
      { l: 2, q: r`Welches ist die grösste Zahl im Intervall $[0,1[$?`, a: [r`Es gibt keine.`, r`$1$`, r`$0.9$`, r`$0.99$`], e: r`Zu jeder Zahl unter 1 gibt es eine grössere, die immer noch unter 1 liegt.` },
      { l: 2, q: r`Wie schreibt man $-3<x\le0$ als Intervall?`, a: [r`$]-3,0]$`, r`$[-3,0[$`, r`$[-3,0]$`, r`$]-3,0[$`], e: r`$-3$ ausgeschlossen, 0 eingeschlossen.` },
      { l: 2, q: r`Wie schreibt man die Menge aller reellen Zahlen als Intervall?`, a: [r`$]-\infty,\infty[$`, r`$[0,\infty[$`, r`$[-\infty,\infty]$`, r`$]0,\infty[$`], e: r`Auf beiden Seiten unbeschränkt und offen.` },
      { l: 2, q: r`Welche Zahl liegt nicht im Intervall $[-1,2[$?`, a: [r`$2$`, r`$-1$`, r`$0$`, r`$1.99$`], e: r`Der rechte Randpunkt ist ausgeschlossen.` },

      { l: 3, q: r`Welche Lösungsmenge hat $2x-1>5$?`, a: [r`$]3,\infty[$`, r`$[3,\infty[$`, r`$]-\infty,3[$`, r`$]2,\infty[$`], e: r`$2x>6$, also $x>3$.` },
      { l: 3, q: r`Welche Lösungsmenge hat $|x|\le3$?`, a: [r`$[-3,3]$`, r`$[0,3]$`, r`$]-3,3[$`, r`$]-\infty,3]$`], e: r`Alle Zahlen, die höchstens 3 von 0 entfernt sind.` },
      { l: 3, q: r`Welche Lösungsmenge hat $|x-2|<1$?`, a: [r`$]1,3[$`, r`$]-1,1[$`, r`$[1,3]$`, r`$]2,3[$`], e: r`Alle Zahlen, die weniger als 1 von 2 entfernt sind.` },
      { l: 3, q: r`Das Intervall $]0,1[$ enthält unendlich viele Zahlen.`, tf: true, e: r`Zum Beispiel $\frac12,\ \frac13,\ \frac14,\ \ldots$` },
      { l: 3, q: r`Welche Lösungsmenge hat $x^2<4$?`, a: [r`$]-2,2[$`, r`$]-\infty,2[$`, r`$[0,2[$`, r`$[-2,2]$`], e: r`Auch negative Zahlen zählen: $(-1.5)^2=2.25<4$.` },
      { l: 3, q: r`Welche Lösungsmenge hat $-2x\le6$?`, a: [r`$[-3,\infty[$`, r`$]-\infty,-3]$`, r`$]-3,\infty[$`, r`$]-\infty,3]$`], e: r`Beim Teilen durch $-2$ dreht das Ungleichheitszeichen: $x\ge-3$.` },
      { l: 3, q: r`Welchen Definitionsbereich hat $f(x)=\sqrt{x-2}$?`, a: [r`$[2,\infty[$`, r`$]2,\infty[$`, r`$[0,\infty[$`, r`$]-\infty,2]$`], e: r`Unter der Wurzel darf 0 stehen, aber nichts Negatives.` },
      { l: 3, q: r`Welche Ungleichung beschreibt das Intervall $[1,7]$?`, a: [r`$|x-4|\le3$`, r`$|x-3|\le4$`, r`$|x|\le7$`, r`$|x-1|\le7$`], e: r`Mittelpunkt 4, und jeder Randpunkt ist 3 davon entfernt.` }
    ],

    // ───────────────────────── Operationen mit Intervallen ─────────────────────────
    op: [
      { l: 1, q: r`Welche Zahlen gehören zur Schnittmenge $A\cap B$?`, a: [r`Die Zahlen, die in $A$ und in $B$ liegen.`, r`Die Zahlen, die in $A$ oder in $B$ liegen.`, r`Die Zahlen, die in $A$, aber nicht in $B$ liegen.`, r`Die Zahlen, die weder in $A$ noch in $B$ liegen.`], e: r`«Schnitt» heisst: beiden gemeinsam.` },
      { l: 1, q: r`Welche Zahlen gehören zur Vereinigung $A\cup B$?`, a: [r`Die Zahlen, die in $A$ oder in $B$ liegen (oder in beiden).`, r`Die Zahlen, die in $A$ und in $B$ liegen.`, r`Die Zahlen, die in genau einer der beiden Mengen liegen.`, r`Die Zahlen, die in $B$, aber nicht in $A$ liegen.`], e: r`Alles zusammengenommen.` },
      { l: 1, q: r`Welche Zahlen gehören zur Differenz $A\setminus B$?`, a: [r`Die Zahlen, die in $A$, aber nicht in $B$ liegen.`, r`Die Zahlen, die in $B$, aber nicht in $A$ liegen.`, r`Die Zahlen, die in $A$ und in $B$ liegen.`, r`Die Zahlen, die in keiner der beiden Mengen liegen.`], e: r`«$A$ ohne $B$».` },
      { l: 1, q: r`Was ist das Komplement $\overline{A}$ eines Intervalls $A$?`, a: [r`Alle reellen Zahlen, die nicht in $A$ liegen.`, r`Alle Zahlen in $A$ mit umgekehrtem Vorzeichen.`, r`Die Randpunkte von $A$.`, r`Die leere Menge.`], e: r`Der Rest der Zahlengeraden.` },
      { l: 1, q: r`Was ist $[1,5]\cap[3,8]$?`, a: [r`$[3,5]$`, r`$[1,8]$`, r`$[1,3]$`, r`$[5,8]$`], e: r`Der Teil, in dem sich die beiden Intervalle überlappen.` },
      { l: 1, q: r`Was ist $[1,5]\cup[3,8]$?`, a: [r`$[1,8]$`, r`$[3,5]$`, r`$[1,3]$`, r`$[5,8]$`], e: r`Vom kleinsten bis zum grössten Randpunkt.` },
      { l: 1, q: r`Was ist $[1,3]\cap[5,7]$?`, a: [r`Die leere Menge`, r`$[3,5]$`, r`$[1,7]$`, r`$\{4\}$`], e: r`Die Intervalle haben keine gemeinsame Zahl.` },
      { l: 1, q: r`Es gilt $A\cap B=B\cap A$.`, tf: true, e: r`«In $A$ und in $B$» ist dasselbe wie «in $B$ und in $A$».` },
      { l: 1, q: r`Was bedeutet das Zeichen $\emptyset$?`, a: [r`Die leere Menge: Sie enthält kein Element.`, r`Die Zahl 0.`, r`Die Menge, die nur die 0 enthält.`, r`Unendlich.`], e: r`Auch $\{\,\}$ geschrieben.` },
      { l: 1, q: r`Was ist $[0,10]\cap[2,4]$?`, a: [r`$[2,4]$`, r`$[0,10]$`, r`$[0,2]$`, r`$[4,10]$`], e: r`$[2,4]$ liegt ganz in $[0,10]$.` },
      { l: 1, q: r`Was ist $[0,10]\cup[2,4]$?`, a: [r`$[0,10]$`, r`$[2,4]$`, r`$[0,14]$`, r`$[2,10]$`], e: r`Das kleinere Intervall bringt nichts Neues.` },
      { l: 1, q: r`Es gilt $A\setminus B=B\setminus A$.`, tf: false, e: r`$[1,5]\setminus[3,8]$ liegt links, $[3,8]\setminus[1,5]$ rechts.` },

      { l: 2, q: r`Was ist $[1,5]\setminus[3,8]$?`, a: [r`$[1,3[$`, r`$[1,3]$`, r`$]5,8]$`, r`$[3,5]$`], e: r`3 gehört zu $[3,8]$ und fällt deshalb weg.` },
      { l: 2, q: r`Welches Komplement hat $[2,5]$?`, a: [r`$]-\infty,2[\ \cup\ ]5,\infty[$`, r`$]-\infty,2]\cup[5,\infty[$`, r`$]2,5[$`, r`$[-5,-2]$`], e: r`2 und 5 liegen im Intervall, also nicht im Komplement.` },
      { l: 2, q: r`Welches Komplement hat $]-\infty,3[$?`, a: [r`$[3,\infty[$`, r`$]3,\infty[$`, r`$]-3,\infty[$`, r`$]-\infty,3]$`], e: r`3 liegt nicht im Intervall, also im Komplement.` },
      { l: 2, q: r`Was ist $[1,3]\cap[3,6]$?`, a: [r`$\{3\}$`, r`Die leere Menge`, r`$[1,6]$`, r`$]3,3[$`], e: r`Nur die 3 liegt in beiden Intervallen.` },
      { l: 2, q: r`Was ist $[1,3[\ \cap\ [3,6]$?`, a: [r`Die leere Menge`, r`$\{3\}$`, r`$[1,6]$`, r`$[3,3]$`], e: r`3 gehört nicht zum ersten Intervall.` },
      { l: 2, q: r`Was ist $[1,3[\ \cup\ [3,6]$?`, a: [r`$[1,6]$`, r`$[1,6]$ ohne die 3`, r`$[1,3[$`, r`Die leere Menge`], e: r`Die 3 kommt vom zweiten Intervall dazu; es bleibt keine Lücke.` },
      { l: 2, q: r`Was ist $]1,4[\ \cap\ [2,6]$?`, a: [r`$[2,4[$`, r`$]2,4]$`, r`$]1,6]$`, r`$[2,4]$`], e: r`2 liegt in beiden Intervallen, 4 nur im zweiten.` },
      { l: 2, q: r`Die Vereinigung zweier Intervalle ist immer ein Intervall.`, tf: false, e: r`$[1,2]\cup[5,6]$ besteht aus zwei getrennten Stücken.` },
      { l: 2, q: r`Was ist $[0,10]\setminus[2,4]$?`, a: [r`$[0,2[\ \cup\ ]4,10]$`, r`$[0,2]\cup[4,10]$`, r`$[2,4]$`, r`$[0,2[$`], e: r`Aus der Mitte wird ein Stück samt seinen Randpunkten entfernt.` },
      { l: 2, q: r`Der Schnitt zweier Intervalle besteht nie aus zwei getrennten Stücken.`, tf: true, e: r`Er ist ein Intervall, ein einzelner Punkt oder leer.` },

      { l: 3, q: r`Es ist $A=[-2,3[$ und $B=\,]1,5]$. Was ist $A\setminus B$?`, a: [r`$[-2,1]$`, r`$[-2,1[$`, r`$[3,5]$`, r`$]1,3[$`], e: r`1 gehört nicht zu $B$ und bleibt deshalb erhalten.` },
      { l: 3, q: r`Es ist $A=[-2,3[$ und $B=\,]1,5]$. Was ist $B\setminus A$?`, a: [r`$[3,5]$`, r`$]3,5]$`, r`$[-2,1]$`, r`$]1,3[$`], e: r`3 gehört nicht zu $A$ und bleibt deshalb erhalten.` },
      { l: 3, q: r`Welche Lösungsmenge hat $x^2\ge4$?`, a: [r`$]-\infty,-2]\cup[2,\infty[$`, r`$[2,\infty[$`, r`$[-2,2]$`, r`$]-\infty,-2[\ \cup\ ]2,\infty[$`], e: r`Das Komplement von $]-2,2[$.` },
      { l: 3, q: r`Welche Lösungsmenge hat $|x-1|>2$?`, a: [r`$]-\infty,-1[\ \cup\ ]3,\infty[$`, r`$]-1,3[$`, r`$]3,\infty[$`, r`$]-\infty,-3[\ \cup\ ]1,\infty[$`], e: r`Alle Zahlen, die mehr als 2 von 1 entfernt sind.` },
      { l: 3, q: r`Es ist $A=[0,2]$ und $B=[1,5]$. Welches Komplement hat $A\cup B$?`, a: [r`$]-\infty,0[\ \cup\ ]5,\infty[$`, r`$]-\infty,1[\ \cup\ ]2,\infty[$`, r`$]-\infty,0]\cup[5,\infty[$`, r`$]2,5]$`], e: r`$A\cup B=[0,5]$.` },
      { l: 3, q: r`Es gilt $A\setminus B=A\cap\overline{B}$.`, tf: true, e: r`«In $A$, aber nicht in $B$» heisst «in $A$ und im Komplement von $B$».` },
      { l: 3, q: r`Es ist $A=\,]-\infty,4]$ und $B=[1,\infty[$. Welches Komplement hat $A\cap B$?`, a: [r`$]-\infty,1[\ \cup\ ]4,\infty[$`, r`$]-\infty,1]\cup[4,\infty[$`, r`$[1,4]$`, r`Die leere Menge`], e: r`$A\cap B=[1,4]$.` },
      { l: 3, q: r`Für welche $x$ gilt $-1<x\le4$, aber nicht $0\le x<2$?`, a: [r`$]-1,0[\ \cup\ [2,4]$`, r`$]-1,0]\cup\,]2,4]$`, r`$[0,2[$`, r`$]-1,4]$`], e: r`$]-1,4]\setminus[0,2[$: 0 fällt weg, 2 bleibt.` }
    ],

    // ───────────────────────── Mengenoperationen im Venn-Diagramm ─────────────────────────
    venn: [
      { l: 1, q: r`Welcher Teil des Venn-Diagramms ist $A\cup B$?`, a: [r`Alles, was in mindestens einem der beiden Kreise liegt.`, r`Nur das Feld, in dem sich die Kreise überlappen.`, r`Alles ausserhalb der beiden Kreise.`, r`Nur der Kreis $A$.`], e: r`Vereinigung: in $A$ oder in $B$.` },
      { l: 1, q: r`Welcher Teil des Venn-Diagramms ist $A\cap B$?`, a: [r`Das Feld, in dem sich die beiden Kreise überlappen.`, r`Beide Kreise ganz.`, r`Der Teil von $A$ ausserhalb von $B$.`, r`Alles ausserhalb der Kreise.`], e: r`Schnitt: in $A$ und in $B$.` },
      { l: 1, q: r`Welcher Teil des Venn-Diagramms ist $A\setminus B$?`, a: [r`Der Teil von $A$, der ausserhalb von $B$ liegt.`, r`Der Teil von $B$, der ausserhalb von $A$ liegt.`, r`Das Feld, in dem sich die Kreise überlappen.`, r`Alles ausserhalb von $A$.`], e: r`«$A$ ohne $B$».` },
      { l: 1, q: r`Welcher Teil des Venn-Diagramms ist $\overline{A}$?`, a: [r`Alles in der Grundmenge $G$, was ausserhalb von $A$ liegt.`, r`Der Kreis $A$.`, r`Nur der Kreis $B$.`, r`Nur das Feld ausserhalb beider Kreise.`], e: r`Auch der Teil von $B$ ausserhalb von $A$ gehört dazu.` },
      { l: 1, q: r`Es ist $A=\{1,2,3\}$ und $B=\{3,4\}$. Was ist $A\cap B$?`, a: [r`$\{3\}$`, r`$\{1,2,3,4\}$`, r`$\{1,2\}$`, r`$\{4\}$`], e: r`Nur die 3 liegt in beiden Mengen.` },
      { l: 1, q: r`Es ist $A=\{1,2,3\}$ und $B=\{3,4\}$. Was ist $A\cup B$?`, a: [r`$\{1,2,3,4\}$`, r`$\{1,2,3,3,4\}$`, r`$\{3\}$`, r`$\{1,2,4\}$`], e: r`Jedes Element wird nur einmal aufgeführt.` },
      { l: 1, q: r`Es ist $A=\{1,2,3\}$ und $B=\{3,4\}$. Was ist $A\setminus B$?`, a: [r`$\{1,2\}$`, r`$\{4\}$`, r`$\{1,2,4\}$`, r`$\{3\}$`], e: r`Aus $A$ wird die 3 entfernt.` },
      { l: 1, q: r`$A\cap B$ ist eine Teilmenge von $A$.`, tf: true, e: r`Was in $A$ und in $B$ liegt, liegt in $A$.` },
      { l: 1, q: r`Es ist $G=\{1,2,3,4,5,6\}$ und $A=\{1,2,3\}$. Was ist $\overline{A}$?`, a: [r`$\{4,5,6\}$`, r`$\{1,2,3\}$`, r`$\{-1,-2,-3\}$`, r`Die leere Menge`], e: r`Alle Elemente von $G$, die nicht in $A$ liegen.` },
      { l: 1, q: r`Wie viele Felder hat ein Venn-Diagramm mit zwei Mengen (das Feld ausserhalb mitgezählt)?`, a: [r`$4$`, r`$3$`, r`$2$`, r`$8$`], e: r`Nur $A$, nur $B$, beide, keine.` },
      { l: 1, q: r`Wie viele Felder hat ein Venn-Diagramm mit drei Mengen (das Feld ausserhalb mitgezählt)?`, a: [r`$8$`, r`$6$`, r`$7$`, r`$9$`], e: r`Für jede der drei Mengen «drin oder nicht»: $2\cdot2\cdot2$.` },
      { l: 1, q: r`$A\cup B$ hat immer mindestens so viele Elemente wie $A$.`, tf: true, e: r`$A$ ist in der Vereinigung enthalten.` },

      { l: 2, q: r`$A$ hat 10 Elemente, $B$ hat 8, und 3 liegen in beiden. Wie viele Elemente hat $A\cup B$?`, a: [r`$15$`, r`$18$`, r`$21$`, r`$11$`], e: r`$10+8-3$: Die gemeinsamen würden sonst doppelt gezählt.` },
      { l: 2, q: r`Welche Menge ist nach De Morgan dasselbe wie $\overline{A\cup B}$?`, a: [r`$\overline{A}\cap\overline{B}$`, r`$\overline{A}\cup\overline{B}$`, r`$A\cap B$`, r`$\overline{A}\setminus\overline{B}$`], e: r`«Nicht ($A$ oder $B$)» heisst «nicht $A$ und nicht $B$».` },
      { l: 2, q: r`Welche Menge ist nach De Morgan dasselbe wie $\overline{A\cap B}$?`, a: [r`$\overline{A}\cup\overline{B}$`, r`$\overline{A}\cap\overline{B}$`, r`$A\cup B$`, r`$\overline{A}\setminus B$`], e: r`«Nicht in beiden» heisst «nicht in $A$ oder nicht in $B$».` },
      { l: 2, q: r`$A$ ist eine Teilmenge von $B$. Was ist $A\cap B$?`, a: [r`$A$`, r`$B$`, r`Die leere Menge`, r`$B\setminus A$`], e: r`Alle Elemente von $A$ liegen auch in $B$.` },
      { l: 2, q: r`$A$ ist eine Teilmenge von $B$. Was ist $A\cup B$?`, a: [r`$B$`, r`$A$`, r`Die Grundmenge $G$`, r`Die leere Menge`], e: r`$A$ bringt nichts Neues.` },
      { l: 2, q: r`Wann heissen zwei Mengen disjunkt?`, a: [r`Wenn $A\cap B$ leer ist.`, r`Wenn $A\cup B$ leer ist.`, r`Wenn $A=B$ ist.`, r`Wenn $A$ eine Teilmenge von $B$ ist.`], e: r`Sie haben kein gemeinsames Element; die Kreise überlappen sich nicht.` },
      { l: 2, q: r`$A\setminus B$ und $B\setminus A$ haben nie ein gemeinsames Element.`, tf: true, e: r`Das eine liegt in $A$, das andere nicht.` },
      { l: 2, q: r`Von 25 Jugendlichen spielen 15 Fussball und 12 Tennis, 5 spielen beides. Wie viele spielen keines von beiden?`, a: [r`$3$`, r`$8$`, r`$0$`, r`$5$`], e: r`$15+12-5=22$ spielen mindestens eines.` },
      { l: 2, q: r`Was ist $A\cap\overline{A}$?`, a: [r`Die leere Menge`, r`$A$`, r`Die Grundmenge $G$`, r`$\overline{A}$`], e: r`Nichts liegt zugleich in $A$ und nicht in $A$.` },
      { l: 2, q: r`Was ist $A\cup\overline{A}$?`, a: [r`Die Grundmenge $G$`, r`Die leere Menge`, r`$A$`, r`$\overline{A}$`], e: r`Jedes Element liegt in $A$ oder nicht in $A$.` },

      { l: 3, q: r`$A$, $B$ und $C$ haben 10, 12 und 14 Elemente. In je zwei Mengen liegen 4, 5 und 6 Elemente, in allen dreien 2. Wie viele Elemente hat $A\cup B\cup C$?`, a: [r`$23$`, r`$21$`, r`$36$`, r`$19$`], e: r`$10+12+14-4-5-6+2$: Was zu viel abgezogen wurde, kommt wieder dazu.` },
      { l: 3, q: r`Welche Menge ist dasselbe wie $A\setminus(B\cup C)$?`, a: [r`$(A\setminus B)\cap(A\setminus C)$`, r`$(A\setminus B)\cup(A\setminus C)$`, r`$A\cap B\cap C$`, r`$(A\cup B)\setminus C$`], e: r`In $A$, aber weder in $B$ noch in $C$.` },
      { l: 3, q: r`Von 30 Personen sprechen 18 Deutsch und 15 Französisch; jede spricht mindestens eine der beiden Sprachen. Wie viele sprechen nur Deutsch?`, a: [r`$15$`, r`$18$`, r`$3$`, r`$12$`], e: r`$18+15-30=3$ sprechen beide Sprachen; $18-3$ bleiben.` },
      { l: 3, q: r`Es gilt $(A\setminus B)\cup B=A$.`, tf: false, e: r`Es entsteht $A\cup B$: Die Elemente von $B$ ausserhalb von $A$ kommen dazu.` },
      { l: 3, q: r`Welcher Term beschreibt die Elemente, die in genau einer der Mengen $A$ und $B$ liegen?`, a: [r`$(A\cup B)\setminus(A\cap B)$`, r`$A\cap B$`, r`$\overline{A\cup B}$`, r`$A\setminus(A\cup B)$`], e: r`Die Vereinigung ohne das gemeinsame Feld.` },
      { l: 3, q: r`Welche Menge ist dasselbe wie $A\cap(B\cup C)$?`, a: [r`$(A\cap B)\cup(A\cap C)$`, r`$(A\cap B)\cup C$`, r`$(A\cup B)\cap(A\cup C)$`, r`$A\cap B\cap C$`], e: r`Wie beim Ausmultiplizieren: $a\,(b+c)=ab+ac$.` },
      { l: 3, q: r`Von 100 Befragten trinken 60 Kaffee und 50 Tee, 10 trinken keines von beiden. Wie viele trinken beides?`, a: [r`$20$`, r`$10$`, r`$30$`, r`$0$`], e: r`90 trinken mindestens eines: $60+50-90$.` },
      { l: 3, q: r`Wie viele Felder brauchte ein Diagramm für vier Mengen, damit jede Kombination vorkommt?`, a: [r`$16$`, r`$12$`, r`$8$`, r`$13$`], e: r`Für jede der vier Mengen «drin oder nicht»: $2^4$. Mit vier Kreisen geht das nicht mehr.` }
    ],

    // ───────────────────────── Übungen ─────────────────────────
    ex: [
      { l: 1, q: r`Was ist $[-1,4]\cap[2,6]$?`, a: [r`$[2,4]$`, r`$[-1,6]$`, r`$[-1,2]$`, r`$[4,6]$`], e: r`Der gemeinsame Teil.` },
      { l: 1, q: r`Was ist $[-1,4]\cup[2,6]$?`, a: [r`$[-1,6]$`, r`$[2,4]$`, r`$[-1,2]$`, r`$[4,6]$`], e: r`Beide Intervalle zusammen.` },
      { l: 1, q: r`Wie schreibt man $x>2$ als Intervall?`, a: [r`$]2,\infty[$`, r`$[2,\infty[$`, r`$]-\infty,2[$`, r`$]2,\infty]$`], e: r`2 gehört nicht dazu.` },
      { l: 1, q: r`Es ist $A=\{a,b,c\}$ und $B=\{b,c,d\}$. Was ist $A\cap B$?`, a: [r`$\{b,c\}$`, r`$\{a,b,c,d\}$`, r`$\{a\}$`, r`$\{d\}$`], e: r`$b$ und $c$ liegen in beiden Mengen.` },
      { l: 1, q: r`Es ist $A=\{a,b,c\}$ und $B=\{b,c,d\}$. Was ist $A\cup B$?`, a: [r`$\{a,b,c,d\}$`, r`$\{b,c\}$`, r`$\{a,d\}$`, r`$\{a,b,c\}$`], e: r`Alle Elemente, jedes einmal.` },
      { l: 1, q: r`Es ist $A=\{a,b,c\}$ und $B=\{b,c,d\}$. Was ist $B\setminus A$?`, a: [r`$\{d\}$`, r`$\{a\}$`, r`$\{b,c\}$`, r`$\{a,d\}$`], e: r`Aus $B$ werden $b$ und $c$ entfernt.` },
      { l: 1, q: r`Die Zahl 0 liegt im Intervall $]0,1]$.`, tf: false, e: r`Links ist das Intervall offen.` },
      { l: 1, q: r`Wie schreibt man $-1\le x<3$ als Intervall?`, a: [r`$[-1,3[$`, r`$]-1,3]$`, r`$[-1,3]$`, r`$]-1,3[$`], e: r`$-1$ eingeschlossen, 3 ausgeschlossen.` },
      { l: 1, q: r`Wie viele ganze Zahlen liegen in $[1,4]$?`, a: [r`$4$`, r`$3$`, r`$2$`, r`$5$`], e: r`1, 2, 3 und 4.` },
      { l: 1, q: r`$\{1,2\}\cap\{3,4\}$ ist die leere Menge.`, tf: true, e: r`Die Mengen haben kein gemeinsames Element.` },
      { l: 1, q: r`Es ist $G=\{1,2,\ldots,10\}$, und $A$ enthält die geraden Zahlen. Was ist $\overline{A}$?`, a: [r`$\{1,3,5,7,9\}$`, r`$\{2,4,6,8,10\}$`, r`$\{1,2,3,4,5\}$`, r`Die leere Menge`], e: r`Die ungeraden Zahlen von $G$.` },
      { l: 1, q: r`Was ist $[0,5]\setminus[0,2]$?`, a: [r`$]2,5]$`, r`$[2,5]$`, r`$[0,2]$`, r`$[0,5]$`], e: r`2 gehört zum entfernten Stück.` },

      { l: 2, q: r`Was ist $]-\infty,3]\cap[1,\infty[$?`, a: [r`$[1,3]$`, r`Alle reellen Zahlen`, r`Die leere Menge`, r`$]1,3[$`], e: r`Höchstens 3 und mindestens 1.` },
      { l: 2, q: r`Was ist $]-\infty,3]\cup[1,\infty[$?`, a: [r`Alle reellen Zahlen`, r`$[1,3]$`, r`Die leere Menge`, r`Alle reellen Zahlen ausser denen in $[1,3]$`], e: r`Jede Zahl ist höchstens 3 oder mindestens 1.` },
      { l: 2, q: r`Was ist $[0,6]\setminus\,]2,4[$?`, a: [r`$[0,2]\cup[4,6]$`, r`$[0,2[\ \cup\ ]4,6]$`, r`$]2,4[$`, r`$[0,2]$`], e: r`2 und 4 gehören nicht zum entfernten Stück und bleiben.` },
      { l: 2, q: r`$A$ hat 20 Elemente, $B$ hat 15, $A\cup B$ hat 28. Wie viele Elemente hat $A\cap B$?`, a: [r`$7$`, r`$5$`, r`$8$`, r`$13$`], e: r`$20+15-28$.` },
      { l: 2, q: r`In $G=\{1,2,\ldots,10\}$ ist $A$ die Menge der geraden Zahlen und $B$ die Menge der Vielfachen von 3. Was ist $A\cap B$?`, a: [r`$\{6\}$`, r`$\{2,3,4,6,8,9,10\}$`, r`$\{3,6,9\}$`, r`$\{6,12\}$`], e: r`Gerade und durch 3 teilbar; 12 liegt nicht in $G$.` },
      { l: 2, q: r`In $G=\{1,2,\ldots,10\}$ ist $A$ die Menge der geraden Zahlen und $B$ die Menge der Vielfachen von 3. Wie viele Elemente hat $A\cup B$?`, a: [r`$7$`, r`$8$`, r`$6$`, r`$5$`], e: r`$5+3-1$: Es sind 2, 3, 4, 6, 8, 9 und 10.` },
      { l: 2, q: r`$[2,5]\setminus\,]2,5[$ ist die Menge $\{2,5\}$.`, tf: true, e: r`Es bleiben nur die beiden Randpunkte.` },
      { l: 2, q: r`Welches Komplement hat $]-2,2]$?`, a: [r`$]-\infty,-2]\cup\,]2,\infty[$`, r`$]-\infty,-2[\ \cup\ [2,\infty[$`, r`$[-2,2[$`, r`$]-\infty,-2]\cup[2,\infty[$`], e: r`$-2$ liegt nicht im Intervall, 2 schon.` },
      { l: 2, q: r`In $G=\{1,2,\ldots,10\}$ ist $A$ die Menge der geraden Zahlen und $B$ die Menge der Vielfachen von 3. Was ist $\overline{A\cup B}$?`, a: [r`$\{1,5,7\}$`, r`$\{1,3,5,7,9\}$`, r`$\{1,5,7,9\}$`, r`$\{6\}$`], e: r`Weder gerade noch durch 3 teilbar.` },
      { l: 2, q: r`Für welche $x$ gilt $3x+1\le10$ und zugleich $x>-2$?`, a: [r`$]-2,3]$`, r`$[-2,3[$`, r`$]-2,\infty[$`, r`$]-\infty,3]$`], e: r`$x\le3$ und $x>-2$.` },

      { l: 3, q: r`In einer Klasse mit 24 Jugendlichen spielen 14 ein Instrument, 10 treiben Sport, 4 tun keines von beidem. Wie viele tun beides?`, a: [r`$4$`, r`$0$`, r`$6$`, r`$10$`], e: r`20 tun mindestens eines: $14+10-20$.` },
      { l: 3, q: r`Für welche $x$ gilt $x^2\le9$ und zugleich $x>1$?`, a: [r`$]1,3]$`, r`$[-3,3]$`, r`$]1,9]$`, r`$]1,\infty[$`], e: r`$[-3,3]\,\cap\,]1,\infty[$.` },
      { l: 3, q: r`Von 40 Personen gehören 20 zu $A$, 18 zu $B$ und 15 zu $C$; 8 zu $A$ und $B$, 6 zu $A$ und $C$, 5 zu $B$ und $C$, 3 zu allen dreien. Wie viele gehören zu keiner Menge?`, a: [r`$3$`, r`$0$`, r`$6$`, r`$37$`], e: r`$20+18+15-8-6-5+3=37$ gehören zu mindestens einer.` },
      { l: 3, q: r`Ist $A\cup B=A$, so ist $B$ eine Teilmenge von $A$.`, tf: true, e: r`$B$ bringt nichts Neues, also liegt jedes Element von $B$ schon in $A$.` },
      { l: 3, q: r`Was ist $\big([1,5]\cup[7,9]\big)\cap[4,8]$?`, a: [r`$[4,5]\cup[7,8]$`, r`$[4,8]$`, r`$[1,9]$`, r`$[5,7]$`], e: r`Jedes der beiden Stücke einzeln mit $[4,8]$ schneiden.` },
      { l: 3, q: r`Welche Zahlen liegen in genau einem der Intervalle $[0,4]$ und $[2,6]$?`, a: [r`$[0,2[\ \cup\ ]4,6]$`, r`$[0,2]\cup[4,6]$`, r`$[2,4]$`, r`$[0,6]$`], e: r`Die Vereinigung $[0,6]$ ohne den Schnitt $[2,4]$.` },
      { l: 3, q: r`Wie viele der Zahlen von 1 bis 100 sind durch 2 oder durch 5 teilbar?`, a: [r`$60$`, r`$70$`, r`$50$`, r`$55$`], e: r`$50+20-10$: Die Vielfachen von 10 würden sonst doppelt gezählt.` },
      { l: 3, q: r`Wie viele der Zahlen von 1 bis 100 sind weder durch 2 noch durch 3 teilbar?`, a: [r`$33$`, r`$17$`, r`$34$`, r`$50$`], e: r`$50+33-16=67$ sind durch 2 oder 3 teilbar; $100-67$ bleiben.` }
    ]
  };
})();
