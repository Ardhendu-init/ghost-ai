"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-base items-center justify-center p-4">
      {/* Two-panel container with rounded border */}
      <div className="hidden lg:flex w-full max-w-5xl rounded-2xl overflow-hidden border border-border shadow-2xl">
        {/* Left panel - gradient background with motivational content */}
        <div
          className="w-1/2 p-12 flex flex-col justify-between"
          style={{
            background:
              "linear-gradient(135deg, rgb(100, 87, 249) 0%, rgb(0, 200, 212) 100%)",
          }}
        >
          <div>
            <p className="text-sm font-semibold text-white/70 mb-8">
              A WISE QUOTE
            </p>
            <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
              Get Everything You Want
            </h2>
            <p className="text-white/80 text-lg">
              You can get everything you want if you work hard, trust the
              process, and stick to the plan.
            </p>
          </div>
          <div className="text-white/60 text-sm">
            <p>Ghost AI © 2026</p>
          </div>
        </div>

        {/* Right panel - dark elevated surface with form */}
        <div className="w-1/2 bg-elevated flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <SignIn />
          </div>
        </div>
      </div>

      {/* Mobile layout - form only */}
      <div className="lg:hidden w-full max-w-sm bg-elevated rounded-2xl p-8 border border-border">
        <SignIn />
      </div>
    </div>
  );
}
