import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SecureOne Confluence",
  description: "Platform documentation, architecture, and API integration guides.",
};

export default function ConfluenceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
