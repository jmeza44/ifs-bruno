export const HAS_BODY_METHODS = new Set(["post", "put", "patch"]);
export const NEEDS_XSRF_METHODS = new Set(["post", "delete", "patch"]);
export const SKIP_KEYS = new Set(["luname", "keyref", "objstate", "objkey", "@odata.etag"]);
