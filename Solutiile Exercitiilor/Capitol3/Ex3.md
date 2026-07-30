Ex3. Service care primește filtre și returnează lucrări
Cerință: Date hardcodate, fără DB.

---

Soluție (logică de business separată)
```
// src/services/works.service.ts
const MOCK_WORKS = [
  { id: "w1", title: "Luceafărul", author: "Mihai Eminescu", year: 1883 },
  { id: "w2", title: "Moromeții", author: "Marin Preda", year: 1955 },
  { id: "w3", title: "Ion", author: "Liviu Rebreanu", year: 1920 }
];

export const WorksService = {
  getWorks(filters) {
    let results = MOCK_WORKS;

    if (filters.author) {
      results = results.filter(w =>
        w.author.toLowerCase().includes(filters.author.toLowerCase())
      );
    }

    if (filters.year) {
      results = results.filter(w => w.year === filters.year);
    }

    return results;
  }
};
```
-----

Explicație
Service-ul este independent de controller.
Poate fi testat separat.
Poate fi înlocuit ulterior cu repository + DB.