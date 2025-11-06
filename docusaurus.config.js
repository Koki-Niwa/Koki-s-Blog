// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Koki's Blog",
  tagline: "Document the learning process of computer technology",
  favicon: "img/logo2.png",

  future: {
    v4: true,
  },

  url: "https://Koki-Niwa.github.io",
  baseUrl: "/Koki-s-Blog/",
  organizationName: "Koki-Niwa",
  projectName: "Koki-s-Blog",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh-CN"],
  },

  // ✅ 启用 Docusaurus 原生 Mermaid 支持
  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      ({
        docs: {
          sidebarPath: "./sidebars.js",
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        blog: {
          showReadingTime: true,
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],

  themeConfig: ({
    navbar: {
      title: "Koki",
      logo: {
        alt: "Logo",
        src: "img/logo2.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "introSidebar",
          position: "left",
          label: "Intro",
        },
        {
          type: "docSidebar",
          sidebarId: "compilerSidebar",
          position: "left",
          label: "Compiler",
        },
        { type: "localeDropdown", position: "right" },
        { to: "/blog", label: "Blog", position: "left" },
        {
          href: "https://github.com/facebook/docusaurus",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [{ label: "Tutorial", to: "/docs/intro" }],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Koki's Blog.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  }),
};

export default config;
