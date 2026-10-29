import { Node, mergeAttributes } from "@tiptap/core";

export const AudioExtension = Node.create({
  name: "audio",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: "true",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "audio",
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          return {
            src: el.getAttribute("src") || el.querySelector("source")?.getAttribute("src"),
            controls: "true",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        class: "w-full my-3 h-10 outline-none",
      }),
    ];
  },
});