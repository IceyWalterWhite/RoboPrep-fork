import type { Metadata } from "next";

import "./globals.css";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: {
    default: "RoboPrep — 具身智能面试准备",
    template: "%s · RoboPrep",
  },
  description: "面向具身智能岗位的真实面试经历、核心知识与 Coding 练习。",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile(user.id) : null;

  return (
    <html lang="zh-CN">
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
