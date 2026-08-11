"use client";

import { tagOptions } from "@/data/tagOptions";

type TagSelectorProps = {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
};

export default function TagSelector({
  selectedTags,
  setSelectedTags,
}: TagSelectorProps) {
  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  return (
    <div className="grid gap-3">
      <p className="font-medium text-gray-800">Tags</p>

      <div className="flex flex-wrap gap-2">
        {tagOptions.map((tag) => {
          const isSelected = selectedTags.includes(tag);

          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={
                isSelected
                  ? "rounded-full bg-black px-3 py-2 text-sm font-semibold text-white"
                  : "rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-black hover:text-white"
              }
            >
              {tag}
            </button>
          );
        })}
      </div>

      {selectedTags.length > 0 && (
        <p className="text-sm text-gray-600">
          Selected: {selectedTags.join(", ")}
        </p>
      )}
    </div>
  );
}