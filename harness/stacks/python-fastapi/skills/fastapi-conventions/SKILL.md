# FastAPI Conventions (skill)

> Stack-specific skill for FastAPI projects. Loaded
> automatically when the project is detected as FastAPI.

## When to load

- Working on any file under `app/`.
- Adding a route, a Pydantic model, or a service.
- Reviewing a PR that touches `app/main.py` or
  `pyproject.toml`.

## Procedure

1. **Check the layout.** `app/main.py`, `app/api/`,
   `app/models/`, `app/services/`, `app/db/`. Flag any
   router doing business logic.
2. **Check the type hints.** Python 3.11+ syntax, no
   `Optional`, no `Dict[str, Any]` without a strong
   reason.
3. **Check the async discipline.** No sync I/O in async
   handlers. No `time.sleep` in tests.
4. **Check the validation.** Every request has a Pydantic
   model. Every response has a `response_model`.
5. **Check the errors.** Custom exception classes. Single
   handler. 4xx vs 5xx correct. No stack traces in
   production.
6. **Run `pytest`.** Capture the result.
7. **Run `mypy --strict` or `pyright`.** Capture the
   result.

## Stack-specific traps

- **`pydantic.BaseModel` mixed with `dataclass`.** Pick
  one for the boundary. Pydantic for I/O, dataclass for
  internal.
- **`Depends()` in a service.** The service is now
  coupled to FastAPI's DI. Refactor to take the
  dependency as a parameter.
- **Pydantic v1 patterns in a v2 project.** `Config`
  class, `validator` decorator, `orm_mode` — all gone.
- **Returning `dict` from a route.** The schema is now
  untyped. Add a Pydantic response model.
- **No `response_model`.** The shape can drift. Add it.

## Output

```
## FastAPI Audit: <route or surface>

### Layout
- main.py: <ok|flag>
- api/: <list of routers>
- services/: <list of services>
- models/: <list of models>

### Type discipline
- 3.11+ syntax: <ok|flag>
- Optional usage: <count>
- Dict/Any: <count>

### Async discipline
- sync I/O in async: <count>
- tests with time.sleep: <count>

### Validation
- routes with Pydantic request: N/M
- routes with response_model: N/M

### Errors
- custom exceptions: <ok|flag>
- single handler: <ok|flag>
- 4xx/5xx correctness: <ok|flag>

### Verdict
- ship / fix-first
```
