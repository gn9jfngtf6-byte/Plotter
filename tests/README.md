# Tests für die Lösungsweg-Engine

Die Tests prüfen den exakten Rechenkern (`20_exact.js`), den Gleichungslöser (`21_solver.js`, `21b_equation.js`)
und alle Lösungswege (`22_steps.js`, `22b_steps_asymptotes.js`) — **ohne Browser**, nur mit Node (≥ 16).

## Ausführen

```
node tests/run.js              # alle Tests
node tests/run.js -f tan       # nur Fälle, deren Funktion "tan" enthält
node tests/run.js -q           # kurze Ausgabe
```

Ein Lauf dauert wenige Sekunden. Der Test schlägt fehl (Exit-Code 1), wenn

* ein Einzeltest (Brüche, Polynome, Wurzeln, Gleichungslöser) ein anderes Ergebnis liefert,
* ein Lösungsweg einen Fehler wirft oder `NaN` / `undefined` im Text enthält,
* der Rechenweg nicht zum numerisch gefundenen Punkt passt (x, y, Asymptote),
* sich das **Ergebnis** eines Lösungswegs gegenüber `expected.json` geändert hat.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `engine.js` | lädt die Engine in eine Node-VM (gleiche Reihenfolge wie `index.html`) |
| `unit.js` | Einzeltests der Rechenkerne und des Gleichungslösers |
| `run.js` | Testläufer |
| `cases.json` | Testfunktionen mit ihren Sonderpunkten (aus der echten Anwendung gesammelt) |
| `expected.json` | erwartetes Ergebnis jedes Lösungswegs (Schlusszeile, Näherung ja/nein, Rückfall ja/nein) |
| `lists/alle.json` | Liste aller Testfunktionen |
| `collect.js` | sammelt Sonderpunkte aus der echten Anwendung (braucht Playwright) |

## Eine Änderung bewusst übernehmen

Wenn sich ein Ergebnis absichtlich ändert (z. B. ein Lösungsweg wurde schöner formuliert oder ist jetzt exakt statt
genähert), prüfen Sie die Ausgabe und schreiben die neuen Erwartungswerte fest:

```
node tests/run.js --update
```

## Neue Testfunktion hinzufügen

1. Anwendung lokal ausliefern: `python3 -m http.server 8913` im Projektordner.
2. `node tests/collect.js http://localhost:8913/index.html "x^3-3x" "tan(x)"` — fügt die Funktionen samt Sonderpunkten zu `cases.json` hinzu
   (Playwright mit Chromium nötig; mit `CHROMIUM_PATH=…` lässt sich ein vorhandener Browser angeben).
3. `node tests/run.js --update` — erwartete Ergebnisse erzeugen, danach die Schlusszeilen in `expected.json` kurz auf Richtigkeit prüfen.

Schreibweise der Funktionen wie im Programm: natürlicher Logarithmus `log(x)`, Eulersche Zahl `EC`, z. B. `EC^(-x^2)`.

## Bekannte Grenzen

* `sin(1/x)`, `x·sin(1/x)`: Nullstellen/Extrema (Folge `1/(kπ)`) werden numerisch genähert.
* `sin(x)/x`, `x·sin(x)`, `tan(x)+x`: Extrema/Nullstellen sind transzendente Gleichungen (z. B. `tan x = x`) und nur numerisch lösbar.
* Polstelle von `log(x)/x` bei `x = 0` und die wesentliche Singularität von `e^(1/x)` haben noch keinen eigenen Lösungsweg (Rückfall auf die alte Variante).
