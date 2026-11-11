"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Infographic } from "@infoglitch/react";
import { parseDsl, renderToString, stringify, themes, templateCatalog } from "@infoglitch/core";
import { registerSimpleIcons } from "@infoglitch/icons";
import { fontFaceCss, loadFonts } from "@infoglitch/fonts";
import { downloadPdf, downloadPng, downloadSvg } from "@infoglitch/export";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = any;
type Leaf = Record<string, unknown> & { type: string };

const PRESETS: Record<string, () => Leaf> = {
  Título: () => ({ type: "title", text: "Un título", subtitle: "Subtítulo", icon: "rocket" }),
  Lista: () => ({ type: "list", heading: "Lista", items: [{ label: "A favor", tone: "pro" }, { label: "En contra", tone: "con" }] }),
  Código: () => ({ type: "codeSnippet", heading: "Código", language: "javascript", code: "const x = 1;\nconsole.log(x);" }),
  Métricas: () => ({ type: "stat", heading: "Métricas", items: [{ value: "99.9", label: "uptime", unit: "%" }, { value: "12k", label: "req/s" }] }),
  Flow: () => ({ type: "flow", heading: "Flujo", items: [{ kind: "start", label: "Inicio" }, { kind: "decision", label: "¿ok?", branch: "No" }, { kind: "end", label: "Fin" }] }),
  Grid: () => ({ type: "iconGrid", heading: "Grid", columns: 3, items: [{ icon: "python", label: "Python" }, { icon: "react", label: "React" }, { icon: "docker", label: "Docker" }] }),
  Versus: () => ({ type: "versus", left: { title: "A" }, right: { title: "B" }, rows: [{ label: "Tema", left: "Bueno", right: "Malo", leftTone: "pro", rightTone: "con" }] }),
  Roadmap: () => ({ type: "roadmap", heading: "Ruta", items: [{ label: "Paso 1", points: ["x"] }, { label: "Paso 2", points: ["y"] }] }),
  Callout: () => ({ type: "callout", text: "Nota importante.", tone: "info" }),
  Steps: () => ({ type: "steps", heading: "Pasos", items: [{ label: "Build", desc: "Compila", icon: "package" }, { label: "Deploy", desc: "Publica", icon: "rocket" }] }),
  Timeline: () => ({ type: "timeline", heading: "Historia", items: [{ date: "2023", label: "Inicio" }, { date: "2024", label: "v1.0" }] }),
  Comparación: () => ({ type: "comparison", heading: "Comparación", columns: [{ title: "Opción A", points: ["Pro 1", "Pro 2"] }, { title: "Opción B", points: ["Con 1"] }] }),
  Arquitectura: () => ({ type: "architecture", heading: "Arquitectura", nodes: [{ id: "api", label: "API", icon: "server" }, { id: "db", label: "DB", icon: "database" }], edges: [{ from: "api", to: "db" }] }),
  Chart: () => ({ type: "chart", chart: "bar", heading: "Gráfico", items: [{ label: "A", value: 60 }, { label: "B", value: 40 }, { label: "C", value: 25 }] }),
};

const STARTER = `template stack
theme neon-night
title Mi infografía

section title
  text Un título
  subtitle Subtítulo
  icon rocket

section list
  heading Lista
  - label A favor
    tone pro
  - label En contra
    tone con
`;

function flatten(sections: AnyDoc[]): Leaf[] {
  return sections.flatMap((s) => (s?.type === "columns" ? s.columns.flatMap((c: AnyDoc) => c.sections) : [s]));
}
function isCols(sections: AnyDoc[]): boolean {
  return sections.length === 1 && sections[0]?.type === "columns";
}
function buildBody(flat: Leaf[], layout: "rows" | "cols"): AnyDoc[] {
  if (layout === "cols" && flat.length >= 2) {
    const mid = Math.ceil(flat.length / 2);
    return [{ type: "columns", ratio: [1, 1], columns: [{ sections: flat.slice(0, mid) }, { sections: flat.slice(mid) }] }];
  }
  return flat;
}

/* ----------------------------- editores ------------------------------- */
function Field({ label, value, onChange, type, options }: AnyDoc) {
  const base: CSSProperties = { padding: 6, fontSize: 13, width: "100%", boxSizing: "border-box" };
  return (
    <label style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
      {label}
      {options ? (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={base}>
          {options.map((o: string) => (<option key={o} value={o}>{o}</option>))}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} spellCheck={false}
          style={{ ...base, height: 100, fontFamily: "ui-monospace, monospace", whiteSpace: "pre" }} />
      ) : (
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={base} />
      )}
    </label>
  );
}

function ItemsEditor({ items, fields, onChange, makeItem }: AnyDoc) {
  const list: AnyDoc[] = items ?? [];
  const update = (i: number, patch: AnyDoc) => onChange(list.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 6, padding: 8, marginBottom: 8 }}>
      {list.map((it, i) => (
        <div key={i} style={{ borderBottom: "1px dashed #eee", paddingBottom: 6, marginBottom: 6 }}>
          {fields.map((f: AnyDoc) => (
            <Field key={f.key} label={f.label ?? f.key} value={it[f.key]} options={f.options} type={f.type}
              onChange={(v: string) => update(i, { [f.key]: f.type === "number" ? (v === "" ? undefined : Number(v)) : v || undefined })} />
          ))}
          <button onClick={() => onChange(list.filter((_, k) => k !== i))}>Quitar ítem</button>
        </div>
      ))}
      <button onClick={() => onChange([...list, makeItem ? makeItem(list.length) : {}])}>+ ítem</button>
    </div>
  );
}

function SectionEditor({ section, onChange }: { section: AnyDoc; onChange: (s: AnyDoc) => void }) {
  const s = section;
  const set = (patch: AnyDoc) => onChange({ ...s, ...patch });
  const setItems = (items: AnyDoc) => onChange({ ...s, items });
  const H = () => <Field label="Título (heading)" value={s.heading} onChange={(v: string) => set({ heading: v || undefined })} />;

  switch (s.type) {
    case "title":
      return (<div><Field label="Texto" value={s.text} onChange={(v: string) => set({ text: v })} />
        <Field label="Subtítulo" value={s.subtitle} onChange={(v: string) => set({ subtitle: v || undefined })} />
        <Field label="Icono" value={s.icon} onChange={(v: string) => set({ icon: v || undefined })} /></div>);
    case "callout":
      return (<div><Field label="Texto" type="textarea" value={s.text} onChange={(v: string) => set({ text: v })} />
        <Field label="Tono" options={["info", "warn", "success"]} value={s.tone} onChange={(v: string) => set({ tone: v })} /></div>);
    case "codeSnippet":
      return (<div><H />
        <Field label="Lenguaje" value={s.language} onChange={(v: string) => set({ language: v || undefined })} />
        <Field label="Código" type="textarea" value={s.code} onChange={(v: string) => set({ code: v })} /></div>);
    case "stat":
      return (<div><H /><ItemsEditor items={s.items} onChange={setItems} fields={[{ key: "value" }, { key: "label" }, { key: "unit" }, { key: "icon" }]} /></div>);
    case "list":
      return (<div><H /><ItemsEditor items={s.items} onChange={setItems} fields={[{ key: "label" }, { key: "desc" }, { key: "icon" }, { key: "tone", options: ["pro", "con", "neutral"] }]} /></div>);
    case "flow":
      return (<div><H /><ItemsEditor items={s.items} onChange={setItems} fields={[{ key: "kind", options: ["start", "process", "decision", "end"] }, { key: "label" }, { key: "branch" }]} /></div>);
    case "iconGrid":
      return (<div><H />
        <Field label="Columnas" type="number" value={s.columns} onChange={(v: string) => set({ columns: Number(v) || undefined })} />
        <ItemsEditor items={s.items} onChange={setItems} fields={[{ key: "icon" }, { key: "label" }, { key: "desc" }]} /></div>);
    case "roadmap":
      return (<div><H />
        {(s.items ?? []).map((it: AnyDoc, i: number) => {
          const upd = (patch: AnyDoc) => setItems((s.items as AnyDoc[]).map((x, k) => (k === i ? { ...x, ...patch } : x)));
          return (<div key={i} style={{ border: "1px solid #eee", borderRadius: 6, padding: 8, marginBottom: 6 }}>
            <Field label="Paso" value={it.label} onChange={(v: string) => upd({ label: v })} />
            <Field label="Desc" value={it.desc} onChange={(v: string) => upd({ desc: v || undefined })} />
            <Field label="Icono" value={it.icon} onChange={(v: string) => upd({ icon: v || undefined })} />
            <Field label="Puntos (coma)" value={(it.points ?? []).join(", ")} onChange={(v: string) => upd({ points: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
            <button onClick={() => setItems((s.items as AnyDoc[]).filter((_, k) => k !== i))}>Quitar</button>
          </div>);
        })}
        <button onClick={() => setItems([...(s.items ?? []), { label: "Paso", points: [] }])}>+ paso</button></div>);
    case "versus":
      return (<div><H />
        <Field label="Izq título" value={s.left?.title} onChange={(v: string) => set({ left: { ...s.left, title: v } })} />
        <Field label="Izq icono" value={s.left?.icon} onChange={(v: string) => set({ left: { ...s.left, icon: v || undefined } })} />
        <Field label="Der título" value={s.right?.title} onChange={(v: string) => set({ right: { ...s.right, title: v } })} />
        <Field label="Der icono" value={s.right?.icon} onChange={(v: string) => set({ right: { ...s.right, icon: v || undefined } })} />
        <div style={{ fontSize: 11, margin: "6px 0 4px" }}>Filas</div>
        {(s.rows ?? []).map((r: AnyDoc, i: number) => {
          const upd = (patch: AnyDoc) => set({ rows: (s.rows as AnyDoc[]).map((x, k) => (k === i ? { ...x, ...patch } : x)) });
          return (<div key={i} style={{ border: "1px solid #eee", borderRadius: 6, padding: 8, marginBottom: 6 }}>
            <Field label="Tema" value={r.label} onChange={(v: string) => upd({ label: v })} />
            <Field label="Izq" value={r.left} onChange={(v: string) => upd({ left: v || undefined })} />
            <Field label="Der" value={r.right} onChange={(v: string) => upd({ right: v || undefined })} />
            <Field label="Tono izq" options={["pro", "con", "neutral"]} value={r.leftTone} onChange={(v: string) => upd({ leftTone: v })} />
            <Field label="Tono der" options={["pro", "con", "neutral"]} value={r.rightTone} onChange={(v: string) => upd({ rightTone: v })} />
            <button onClick={() => set({ rows: (s.rows as AnyDoc[]).filter((_, k) => k !== i) })}>Quitar fila</button>
          </div>);
        })}
        <button onClick={() => set({ rows: [...(s.rows ?? []), { label: "Tema", leftTone: "pro", rightTone: "con" }] })}>+ fila</button></div>);
    case "steps":
      return (<div><H /><ItemsEditor items={s.items} onChange={setItems} fields={[{ key: "label" }, { key: "desc" }, { key: "icon" }]} /></div>);
    case "timeline":
      return (<div><H /><ItemsEditor items={s.items} onChange={setItems} fields={[{ key: "date" }, { key: "label" }, { key: "desc" }]} /></div>);
    case "comparison": {
      const setCols = (columns: AnyDoc) => onChange({ ...s, columns });
      const cols: AnyDoc[] = s.columns ?? [];
      return (<div><H />
        {cols.map((col, i) => {
          const upd = (patch: AnyDoc) => setCols(cols.map((x, k) => (k === i ? { ...x, ...patch } : x)));
          return (<div key={i} style={{ border: "1px solid #eee", borderRadius: 6, padding: 8, marginBottom: 6 }}>
            <Field label="Título" value={col.title} onChange={(v: string) => upd({ title: v })} />
            <Field label="Icono" value={col.icon} onChange={(v: string) => upd({ icon: v || undefined })} />
            <Field label="Puntos (coma)" value={(col.points ?? []).join(", ")} onChange={(v: string) => upd({ points: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
            <button onClick={() => setCols(cols.filter((_, k) => k !== i))}>Quitar columna</button>
          </div>);
        })}
        <button onClick={() => setCols([...cols, { title: "Columna", points: [] }])}>+ columna</button></div>);
    }
    case "chart":
      return (<div><H />
        <Field label="Tipo" options={["bar", "pie", "donut", "line"]} value={s.chart} onChange={(v: string) => set({ chart: v })} />
        <Field label="Unidad" value={s.unit} onChange={(v: string) => set({ unit: v || undefined })} />
        <ItemsEditor items={s.items} onChange={setItems} fields={[{ key: "label" }, { key: "value", type: "number" }, { key: "color" }]} /></div>);
    case "architecture":
      return (<div><H />
        <div style={{ fontSize: 11, margin: "4px 0" }}>Nodos</div>
        <ItemsEditor items={s.nodes} onChange={(nodes: AnyDoc) => onChange({ ...s, nodes })}
          fields={[{ key: "id" }, { key: "label" }, { key: "icon" }]}
          makeItem={(n: number) => ({ id: `n${n + 1}`, label: `Nodo ${n + 1}` })} />
        <div style={{ fontSize: 11, margin: "4px 0" }}>Aristas</div>
        <ItemsEditor items={s.edges} onChange={(edges: AnyDoc) => onChange({ ...s, edges })}
          fields={[{ key: "from" }, { key: "to" }, { key: "label" }]} /></div>);
    default:
      return (<div><H /><small style={{ opacity: 0.6 }}>Editá el resto de este tipo en el modo DSL.</small></div>);
  }
}

export default function Page() {
  const [dsl, setDsl] = useState(STARTER);
  const [tab, setTab] = useState<"form" | "dsl">("form");
  const [editing, setEditing] = useState<number | null>(null);
  const [prompt, setPrompt] = useState("Pipeline de CI/CD en 4 pasos");
  const [busy, setBusy] = useState(false);
  const [fontCss, setFontCss] = useState("");

  useEffect(() => {
    registerSimpleIcons({ brandColors: true });
    loadFonts();
    fontFaceCss().then(setFontCss);
  }, []);

  // Única fuente de verdad: `dsl`. El doc se deriva en vivo (tolerante).
  const doc = useMemo<AnyDoc>(() => parseDsl(dsl), [dsl]);
  const flat = flatten(doc.sections ?? []);
  const layout: "rows" | "cols" = isCols(doc.sections ?? []) ? "cols" : "rows";

  // Edita el doc y re-serializa al DSL (mantiene ambos modos en sync).
  const update = (fn: (d: AnyDoc) => AnyDoc) => {
    const d = structuredClone(parseDsl(dsl));
    setDsl(stringify(fn(d)));
  };
  const setFlat = (fn: (f: Leaf[]) => Leaf[]) =>
    update((d) => {
      const mode: "rows" | "cols" = isCols(d.sections) ? "cols" : "rows";
      d.sections = buildBody(fn(flatten(d.sections)), mode);
      return d;
    });

  const add = (name: string) => setFlat((f) => [...f, PRESETS[name]!()]);
  const remove = (i: number) => setFlat((f) => f.filter((_, k) => k !== i));
  const move = (i: number, dir: number) =>
    setFlat((f) => {
      const n = [...f];
      const j = i + dir;
      if (j < 0 || j >= n.length) return f;
      [n[i], n[j]] = [n[j]!, n[i]!];
      return n;
    });
  const setLayout = (mode: "rows" | "cols") =>
    update((d) => {
      d.sections = buildBody(flatten(d.sections), mode);
      return d;
    });

  async function generateFromAI() {
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as AnyDoc)?.error ?? `HTTP ${res.status}`);
      setDsl(await res.text()); // llena ambos modos
    } catch (e) {
      alert("IA: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const box: CSSProperties = { padding: 10, fontSize: 14, borderRadius: 6, width: "100%", boxSizing: "border-box" };
  const tabStyle = (active: boolean): CSSProperties => ({
    padding: "8px 14px", border: "none", borderBottom: active ? "2px solid #4f8cff" : "2px solid transparent",
    background: "none", fontWeight: active ? 700 : 400, cursor: "pointer",
  });

  return (
    <main style={{ display: "flex", gap: 20, padding: 20, fontFamily: "system-ui", alignItems: "flex-start" }}>
      <aside style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>infoglitch · playground</h1>

        <div style={{ display: "flex", borderBottom: "1px solid #ddd" }}>
          <button style={tabStyle(tab === "form")} onClick={() => setTab("form")}>Compositor</button>
          <button style={tabStyle(tab === "dsl")} onClick={() => setTab("dsl")}>Editor DSL</button>
        </div>

        {tab === "form" ? (
          <>
            <label style={{ fontSize: 12 }}>
              Tema
              <select value={doc.theme ?? "dark-terminal"} onChange={(e) => update((d) => ((d.theme = e.target.value), d))} style={box}>
                {Object.keys(themes).map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </label>

            <label style={{ fontSize: 12 }}>
              Plantilla
              <select value={doc.template ?? "stack"} onChange={(e) => update((d) => ((d.template = e.target.value), d))} style={box}>
                {templateCatalog().map((t) => (<option key={t.id} value={t.id}>{t.id}</option>))}
              </select>
            </label>

            <div style={{ fontSize: 12 }}>
              Disposición
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <label><input type="radio" checked={layout === "rows"} onChange={() => setLayout("rows")} /> Filas</label>
                <label><input type="radio" checked={layout === "cols"} onChange={() => setLayout("cols")} /> 2 columnas (50/50)</label>
              </div>
            </div>

            <input value={doc.title ?? ""} onChange={(e) => update((d) => ((d.title = e.target.value || undefined), d))} placeholder="Título" style={box} />
            <input value={doc.footer?.text ?? ""} onChange={(e) => update((d) => ((d.footer = e.target.value ? { text: e.target.value } : undefined), d))} placeholder="Footer (opcional)" style={box} />

            <div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Agregar sección</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.keys(PRESETS).map((name) => (<button key={name} onClick={() => add(name)}>{name}</button>))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Secciones ({flat.length})</div>
              {flat.map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{i + 1}. {s.type}{(s as AnyDoc).heading ? ` — ${(s as AnyDoc).heading}` : ""}</span>
                    <button title="Editar" onClick={() => setEditing(editing === i ? null : i)}>✎</button>
                    <button onClick={() => move(i, -1)}>↑</button>
                    <button onClick={() => move(i, 1)}>↓</button>
                    <button onClick={() => { remove(i); setEditing(null); }}>✕</button>
                  </div>
                  {editing === i && (
                    <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 6, padding: 10, margin: "4px 0 10px" }}>
                      <SectionEditor section={s} onChange={(ns) => setFlat((f) => f.map((x, k) => (k === i ? ns : x)))} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12 }}>DSL (tolerante: se renderiza mientras escribís)</div>
            <textarea
              value={dsl}
              onChange={(e) => setDsl(e.target.value)}
              spellCheck={false}
              style={{ ...box, height: 420, fontFamily: "ui-monospace, monospace", fontSize: 13, whiteSpace: "pre", overflowWrap: "normal", overflowX: "auto" }}
            />
            <small style={{ opacity: 0.6 }}>Editar en el formulario reescribe este DSL (y viceversa).</small>
          </>
        )}

        <hr />
        <div style={{ fontSize: 12 }}>Generar con IA (reemplaza todo)</div>
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} style={box} />
        <button onClick={generateFromAI} disabled={busy}>{busy ? "Generando…" : "Generar con IA"}</button>

        <hr />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => downloadPng(renderToString(dsl, { width: 1600, fontCss }), "infografia.png")}>PNG</button>
          <button onClick={() => downloadPdf(renderToString(dsl, { width: 960, fontCss }), "infografia.pdf")}>PDF</button>
          <button onClick={() => downloadSvg(renderToString(dsl, { width: 960, fontCss }), "infografia.svg")}>SVG</button>
        </div>
      </aside>

      <section style={{ flex: 1, minWidth: 0 }}>
        <Infographic source={dsl} width={960} fontCss={fontCss} />
      </section>
    </main>
  );
}
