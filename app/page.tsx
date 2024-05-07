"use client";

import { Button } from "@/components/ui/button";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { StickyHeader } from "@/components/layout/sticky-header";

export default function Home() {
  return (
    <>
      <StickyHeader className="px-4 py-2">
        <div className="flex justify-between items-center">
          billsplit (v3)
          <SignInButtonContainer />
        </div>
      </StickyHeader>
      <main className="container max-w-2xl flex flex-col gap-8">
        <h1 className="text-4xl font-extrabold my-8 text-center">
          billsplit (v3)
        </h1>
        <Authenticated>
          <SignedInContent />
        </Authenticated>
        <Unauthenticated>
          <p>Click one of the buttons in the top right corner to sign in.</p>
        </Unauthenticated>
      </main>
    </>
  );
}

function SignInButtonContainer() {
  return (
    <div className="flex gap-4">
      <Authenticated>
        <UserButton afterSignOutUrl="#" />
      </Authenticated>
      <Unauthenticated>
        <SignInButton mode="modal">
          <Button variant="ghost">Sign in</Button>
        </SignInButton>
      </Unauthenticated>
    </div>
  );
}

function SignedInContent() {
  return (
    <>
      <p>Welcome! You are now signed in.</p>
    </>
  );
}
