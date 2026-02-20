import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Programs",
  description: "Browse available home energy rebates and incentives by country.",
};

export default function ProgramsLayout({ children }: { readonly children: ReactNode }) {
  return children;
}
