

## Refine Laboratory UI - Visual Grouping & Polish

### Changes in `src/components/laboratory/ActiveGrowsSection.tsx`

**1. Containerize each GrowBox group (lines 436-450)**

Replace the current `space-y-3` wrapper with a styled container:
```
border border-white/10 bg-card/30 rounded-xl p-4 md:p-6
```

**2. Improve section headers (lines 438-446)**

- Import `Separator` from `@/components/ui/separator`
- Make header text `text-base md:text-lg font-bold`
- Use accent-colored `Layers` icon (`text-primary`) for devices, `Package` icon for unassigned
- Add `<Separator className="mt-3" />` below the header, inside the container

**3. Fix grid layout (line 447)**

Replace current grid + border-left styling with clean responsive grid:
```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4
```
Remove the `pl-1 border-l-2 border-primary/20 ml-3` classes.

**4. Empty state per group**

Add a conditional: if `plants.length === 0`, render a muted text "No plants active" instead of the grid.

### Files Modified
- `src/components/laboratory/ActiveGrowsSection.tsx` — restyle the grouped view section (lines 434-508)

