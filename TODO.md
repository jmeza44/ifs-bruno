# TODO

## Show OData-qualified enum names in endpoint UI

Show the OData-qualified enum type name (e.g. `IfsApp.SalesQuotationHandling.OrderQuotationState`) next to enum values in the endpoint detail panel and generated docs, so writing `$filter` on enum fields (e.g. `Objstate`) doesn't require digging through `$metadata` to find the qualified literal:

```
Objstate eq IfsApp.SalesQuotationHandling.OrderQuotationState'Cancelled'
```

**Key finding:** No `$metadata` fetch needed — the qualified name is already in the Swagger/OpenAPI spec. Response schemas reference enum definitions by their fully-qualified key: `#/definitions/IfsApp.SalesQuotationHandling.OrderQuotationState`. Chain: response `$ref` → `{Entity}arrayResponse` → `#/definitions/{Entity}` → property `$ref` → `#/definitions/{Namespace}.{Type}`.

**Where to start:** `src/core/ref-resolver.ts`, `resolveSchemaDeep()` — already follows this `$ref` chain but discards the `$ref` string once resolved. Fix: when a resolved `$ref` target has `enum`, stash the `$ref`'s final path segment as `qualifiedName` on the returned `SchemaObject` (new optional field in `src/types/spec.types.ts`).

**Consumers to update:**

- `ui/frontend/src/components/workspace/endpoint/endpoint-detail-panel.tsx` — Responses section (`SchemaDetails`/`JsonTree`)
- `src/core/request-builder.ts` — `buildDocs()`, enum values table (~line 148-156)

**Scope boundary:** Only applies to enum fields reachable via response schema `$ref` chains. Query params like `$filter` are inline strings in Swagger with no `$ref` to follow — no qualified name derivable there directly; user copies it from the resolved response schema instead.

**Explicitly out of scope (parked separately):** `$metadata` fetch/parser for `NavigationProperty` + `$expand` support — has no Swagger equivalent, but bigger scope, not needed for this item.
