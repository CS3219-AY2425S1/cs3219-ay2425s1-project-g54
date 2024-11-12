/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        buttonColour: "#45A29E",
      },
      typography: {
        markdown: {
          css: {
            maxWidth: "100%",
            maxHeight: "600px",
            overflow: "scroll",
            "p": {
              margin: "8px 0 8px 0",
            },
            "code": {
              background: "#4B4B4B",
              borderRadius: "5px",
              padding: ".125rem",
              "&::before": { content: '""' },
              "&::after": { content: '""' },
            },
            "blockquote": {
              margin: "8px 0 8px 0",
              "p:first-of-type::before": { content: "none" },
              "p:first-of-type::after": { content: "none" },
            },
            "ul": {
              margin: "8px 0 8px 0",
            },
            "a": {
              color: "#646CFF",
              "&:hover": {
                color: "#535BF2",
              }
            },
            "p, code, li, th, td, strong": {
              fontStyle: "normal",
              color: "white",
            },
            "li::marker": {
              color: "white",
            },
            "table": {
              width: "auto",
            },
            "th": {
              fontWeight: "bold",
            }
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
