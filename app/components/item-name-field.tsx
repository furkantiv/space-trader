"use client";

import { useId, useState } from "react";

import type { ItemGroup } from "@/lib/items";

export function ItemNameField({
  defaultValue,
  groups,
  suggestions,
}: {
  defaultValue: string;
  groups: ItemGroup[];
  suggestions: string[];
}) {
  const [value, setValue] = useState(defaultValue);
  const inputId = useId();
  const listId = useId();
  const selectId = useId();

  return (
    <div className="grid gap-3">
      <label className="block" htmlFor={inputId}>
        <span className="mb-2 block text-sm font-medium text-slate-200">
          Item name
        </span>
        <input
          id={inputId}
          type="text"
          list={listId}
          name="item_name"
          required
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
          placeholder="Start typing or choose from catalog"
        />
      </label>
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      <label className="block" htmlFor={selectId}>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Browse catalog
        </span>
        <select
          id={selectId}
          value=""
          onChange={(event) => {
            if (event.currentTarget.value) {
              setValue(event.currentTarget.value);
            }
          }}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/50"
        >
          <option value="">Choose grouped item...</option>
          {groups.map((group) => (
            <optgroup key={group.name} label={group.name}>
              {group.items.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  );
}
