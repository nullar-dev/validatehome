import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programs",
  description: "Browse available home energy rebates and incentives by country.",
};

export default function ProgramsLayout({ children }: { readonly children: React.ReactNode }) {
  return children;
}
