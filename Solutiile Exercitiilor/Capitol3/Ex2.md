Ex2. Controller pentru GET /v1/works
Cerință: Validează input, apelează service, returnează JSON coerent.

---

Soluție (Fastify + TypeScript, subțire, profesionist)
```
//src/controllers/works.controller.ts
import { WorksService } from "../services/works.service";
import { validateWorksQuery } from "../validators/works.validator";

export async function getWorksController(req, reply) {
  const filters = validateWorksQuery(req.query);

  const works = await WorksService.getWorks(filters);

  return reply.send({
    data: works,
    meta: {
      request_id: req.request_id
    },
    links: {
      self: "/v1/works"
    }
  });
}
```
-----

Explicație
Controllerul nu conține logică de business.
Validează input -> trimite către service -> returnează răspuns coerent.