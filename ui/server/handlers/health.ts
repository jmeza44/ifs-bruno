import { ok, route } from "../json.ts";

export const getHealth = route(() => ok({ ok: true }));
