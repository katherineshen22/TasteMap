"use client";

import { useState } from "react";
import { tagOptions } from "@/data/tagOptions";
import { normalizeTag } from "@/lib/formatters";

type TagSelectorProps = {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
};

export default function TagSelector({
  selectedTags,
  setSelectedTags,
}: TagSelectorProps) {
  const [customTag, setCustomTag] = useState("");

  // Show preset tags plus any custom tags already on the dish.
  const allTags = [
    ...tagOptions,
    ...selectedTags.filter((tag) => !tagOptions.includes(tag)),
  ];

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  function addCustomTag() {
    const tag = normalizeTag(customTag);
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setCustomTag("");
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 font-medium text-gray-800">
        Flavor tags{" "}
        <span className="font-normal text-gray-500">
          ({selectedTags.length} selected)
        </span>
      </legend>

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);

          return (
            <button
              key={tag}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleTag(tag)}
              className={
                isSelected
                  ? "rounded-full border border-black bg-black px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-black"
              }
            >
              {isSelected ? "✓ " : ""}
              {tag}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          placeholder="Add your own tag..."
          value={customTag}
          onChange={(event) => setCustomTag(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustomTag();
            }
          }}
        />
        <button
          type="button"
          onClick={addCustomTag}
          disabled={!customTag.trim()}
          className="rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </fieldset>
  );
}
