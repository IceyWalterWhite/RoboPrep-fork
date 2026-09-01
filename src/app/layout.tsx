import type { Metadata } from "next";

import "./globals.css";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: {
    default: "RoboPrep — Master Embodied AI",
    template: "%s · RoboPrep",
  },
  description:
    "Real interview experiences, essential knowledge, and hands-on coding for Embodied AI roles.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile(user.id) : null;

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Navbar
          user={
            user
              ? {
                  email: user.email ?? "",
                  displayName: profile?.displayName ?? null,
                }
              : null
          }
        />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
