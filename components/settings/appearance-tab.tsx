"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import {
  BASE_DARK,
  BASE_LIGHT,
  type CustomTheme,
  DEFAULT_CUSTOM_THEMES,
  PALETTE_FIELDS,
  type Palette,
  pickForeground,
  useColorTheme,
} from "@/components/color-theme-provider";
import { useCompactMode } from "@/components/compact-mode-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const PRESET_THEMES = [
  { id: "system", name: "System" },
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
];

/** A new theme starts from the app's own palettes, so only the parts edited change. */
function createBlankTheme(): CustomTheme {
  return {
    id: "",
    name: "",
    light: { ...BASE_LIGHT, primary: "#0ea5e9", primaryForeground: pickForeground("#0ea5e9", "light") },
    dark: { ...BASE_DARK, primary: "#38bdf8", primaryForeground: pickForeground("#38bdf8", "dark") },
  };
}

/** `<input type="color">` only understands hex, so anything else falls back. */
function toHexInput(value: string, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

/**
 * Previews a theme's primary colour. The light and dark values are both rendered and
 * chosen between in CSS, so the swatch is right on the first paint without reading
 * the resolved theme during hydration.
 */
function ThemeSwatch({ theme, className }: { theme: { light: Palette; dark: Palette }; className?: string }) {
  return (
    <span className={`relative block overflow-hidden ${className ?? ""}`}>
      <span className="absolute inset-0 dark:hidden" style={{ backgroundColor: theme.light.primary }} />
      <span className="absolute inset-0 hidden dark:block" style={{ backgroundColor: theme.dark.primary }} />
    </span>
  );
}

/** Settings → Appearance: light/dark, the colour palette, custom themes, and density. */
export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { isCompact, setIsCompact } = useCompactMode();
  const { colorTheme: selectedColorTheme, setColorTheme, customThemes, setCustomThemes } = useColorTheme();

  const ids = useId();
  const id = (name: string) => `${ids}-${name}`;

  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<CustomTheme | null>(null);
  const [draft, setDraft] = useState<CustomTheme>(createBlankTheme);
  const [editorMode, setEditorMode] = useState<"light" | "dark">("light");

  /** The built-ins are copied into storage on first run, then filtered back out of every list by id. */
  const userThemes = customThemes.filter((t) => !DEFAULT_CUSTOM_THEMES.find((d) => d.id === t.id));
  const allThemes = [...DEFAULT_CUSTOM_THEMES, ...userThemes];

  /**
   * Edits one field of whichever palette is on screen. The on-primary colour follows
   * the primary for as long as the user has not picked one themselves.
   */
  const updatePaletteField = (key: keyof Palette, value: string) => {
    setDraft((previous) => {
      const current = previous[editorMode];
      const palette: Palette = { ...current, [key]: value };
      if (key === "primary" && current.primaryForeground === pickForeground(current.primary, editorMode)) {
        palette.primaryForeground = pickForeground(value, editorMode);
      }
      return { ...previous, [editorMode]: palette };
    });
  };

  const copyPaletteFromOtherMode = () => {
    setDraft((previous) => ({
      ...previous,
      [editorMode]: { ...previous[editorMode === "light" ? "dark" : "light"] },
    }));
  };

  const handleAdd = () => {
    if (!draft.name.trim()) return;

    setCustomThemes([
      ...customThemes,
      { ...draft, id: `${draft.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}` },
    ]);
    setIsAdding(false);
    setDraft(createBlankTheme());
    setEditorMode("light");
  };

  const handleDelete = (themeId: string) => {
    setCustomThemes(customThemes.filter((t) => t.id !== themeId));
    if (selectedColorTheme === themeId) setColorTheme("default");
  };

  const handleEdit = (target: CustomTheme) => {
    setEditing(target);
    setDraft({ ...target, light: { ...target.light }, dark: { ...target.dark } });
    setIsAdding(false);
    setEditorMode("light");
  };

  const handleSaveEdit = () => {
    if (!editing || !draft.name.trim()) return;

    // Writing the themes re-applies the live one on its own, so there is nothing to
    // force here even when the theme being edited is the one currently selected.
    setCustomThemes(customThemes.map((t) => (t.id === editing.id ? { ...draft, id: editing.id } : t)));
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setDraft(createBlankTheme());
    setEditorMode("light");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Theme Mode</CardTitle>
          <CardDescription>Choose between light, dark, or system theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor={id("theme-mode")}>Mode</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id={id("theme-mode")} className="w-full">
                <SelectValue placeholder="Select theme mode" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_THEMES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Theme</CardTitle>
          <CardDescription>
            Recolour the whole application. Each theme carries its own light and dark palette, so the appearance setting
            above still decides which one you see.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor={id("color-theme")}>Color Palette</Label>
            <Select value={selectedColorTheme} onValueChange={setColorTheme}>
              <SelectTrigger id={id("color-theme")} className="w-full">
                <SelectValue placeholder="Select color theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Teal)</SelectItem>
                {DEFAULT_CUSTOM_THEMES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
                {userThemes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} (Custom)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Preview Swatches */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <button
              type="button"
              onClick={() => setColorTheme("default")}
              className={`h-8 rounded-md border-2 transition-all ${selectedColorTheme === "default" ? "border-foreground" : "border-transparent"}`}
              style={{ backgroundColor: "oklch(0.55 0.15 180)" }}
              title="Default (Teal)"
            >
              <span className="sr-only">Use the default teal palette</span>
            </button>
            {allThemes.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setColorTheme(t.id)}
                className={`h-8 overflow-hidden rounded-md border-2 transition-all ${selectedColorTheme === t.id ? "border-foreground" : "border-transparent"}`}
                title={t.name}
              >
                {/* Square on purpose: the button clips it to the rounded shape. Giving it a
                    radius of its own pulls its corners inside that clip, away from the border. */}
                <ThemeSwatch theme={t} className="h-full w-full" />
                <span className="sr-only">Use the {t.name} palette</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Themes</CardTitle>
          <CardDescription>Create and manage your own color themes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userThemes.length > 0 && (
            <ul className="space-y-2">
              {userThemes.map((t) => (
                <li key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <ThemeSwatch theme={t} className="h-6 w-6 rounded-full" />
                    <span className="font-medium">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(t)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Edit ${t.name}`}
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(t.id)}
                      className="text-destructive hover:text-destructive"
                      aria-label={`Delete ${t.name}`}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isAdding || editing ? (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="grid gap-2">
                <Label htmlFor={id("theme-name")}>{editing ? "Edit Theme Name" : "Theme Name"}</Label>
                <Input
                  id={id("theme-name")}
                  placeholder="My Custom Theme"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                {/* Real radios behind the segmented look. It was two buttons
                    whose selected state was carried by background colour alone,
                    with nothing announcing which of the two was active — and
                    arrow keys did not move between them. */}
                <fieldset className="inline-flex rounded-md border p-0.5">
                  <legend className="sr-only">Palette being edited</legend>
                  {(["light", "dark"] as const).map((mode) => (
                    <label
                      key={mode}
                      className={`cursor-pointer rounded px-3 py-1 text-sm capitalize transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring ${
                        editorMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name={id("editor-mode")}
                        value={mode}
                        checked={editorMode === mode}
                        onChange={() => setEditorMode(mode)}
                        className="sr-only"
                      />
                      {mode}
                    </label>
                  ))}
                </fieldset>
                <Button type="button" variant="ghost" size="sm" onClick={copyPaletteFromOtherMode}>
                  Copy from {editorMode === "light" ? "dark" : "light"}
                </Button>
              </div>

              <div className="grid gap-4">
                {PALETTE_FIELDS.map(({ key, label, hint }) => {
                  const value = draft[editorMode][key];
                  return (
                    <div key={key} className="grid gap-2">
                      <Label htmlFor={id(`theme-color-${key}`)}>{label}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          aria-label={`${label} colour picker`}
                          value={toHexInput(value, editorMode === "light" ? "#ffffff" : "#111111")}
                          onChange={(e) => updatePaletteField(key, e.target.value)}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          id={id(`theme-color-${key}`)}
                          value={value}
                          onChange={(e) => updatePaletteField(key, e.target.value)}
                          placeholder="#0ea5e9 or oklch(...)"
                          aria-describedby={id(`theme-hint-${key}`)}
                          className="flex-1"
                        />
                      </div>
                      <p id={id(`theme-hint-${key}`)} className="text-xs text-muted-foreground">
                        {hint}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Use hex colors (#0ea5e9) or OKLCH format (oklch(0.55 0.15 180)). The colour picker only handles hex, so
                OKLCH values have to be typed.
              </p>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button onClick={handleSaveEdit} disabled={!draft.name.trim()}>
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleAdd} disabled={!draft.name.trim()}>
                      Save Theme
                    </Button>
                    <Button variant="outline" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
              <Plus aria-hidden="true" className="h-4 w-4 mr-2" />
              Add Custom Theme
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layout Density</CardTitle>
          <CardDescription>Adjust the spacing and padding of UI elements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={id("compact-mode")}>Compact Mode</Label>
              <p id={id("compact-hint")} className="text-sm text-muted-foreground">
                Reduce padding and spacing for a denser interface
              </p>
            </div>
            <Switch
              id={id("compact-mode")}
              checked={isCompact}
              onCheckedChange={setIsCompact}
              aria-describedby={id("compact-hint")}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
