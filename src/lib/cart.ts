import { cookies } from "next/headers";
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const getCart = (): string[] => { try { return (JSON.parse(cookies().get("cart")?.value ?? "[]") as string[]).filter((i) => UUID.test(i)); } catch { return []; } };
export const setCart = (ids: string[]) => cookies().set("cart", JSON.stringify([...new Set(ids)].slice(0, 50)), { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
