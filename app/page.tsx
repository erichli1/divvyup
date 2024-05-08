"use client";

import { Button } from "@/components/ui/button";
import { Authenticated, Unauthenticated, useAction } from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { StickyHeader } from "@/components/layout/sticky-header";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import {
  SplitDetails,
  calculateSplit,
  convertJsonIntoSplitDetails,
} from "@/lib/splitHelpers";
import { Input } from "@/components/ui/input";
import { Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/convex/_generated/api";

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
          <SplitContainer />
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

function SplitContainer() {
  const [initialInput, setInitialInput] = React.useState<string>("");
  const [initialSplitDetails, setInitialSplitDetails] =
    React.useState<SplitDetails | null>(null);

  if (initialSplitDetails === null)
    return (
      <InitialEntry
        initialInput={initialInput}
        onInitialInputChange={(initialInput) => setInitialInput(initialInput)}
        setSplitDetails={(splitDetails) => setInitialSplitDetails(splitDetails)}
      />
    );

  return (
    <SplitDetailsDisplay
      initialInput={initialInput}
      initialSplitDetails={initialSplitDetails}
    />
  );
}

function InitialEntry({
  initialInput,
  onInitialInputChange,
  setSplitDetails,
}: {
  initialInput: string;
  onInitialInputChange: (initialInput: string) => void;
  setSplitDetails: (splitDetails: SplitDetails) => void;
}) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const processInputInfo = useAction(api.myActions.processInputInfo);

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={initialInput}
        onChange={(event) => onInitialInputChange(event.target.value)}
        placeholder="Start talking or typing into here to begin!"
      />
      <div className="flex flex-row justify-end">
        <Button
          disabled={loading}
          onClick={() => {
            setLoading(true);
            processInputInfo({ input: initialInput })
              .then((res) => {
                setSplitDetails(convertJsonIntoSplitDetails(res));
              })
              .catch(console.error);
          }}
        >
          Process!
        </Button>
      </div>
    </div>
  );
}

function SplitDetailsDisplay({
  initialInput,
  initialSplitDetails,
}: {
  initialInput: string;
  initialSplitDetails: SplitDetails;
}) {
  const [splitDetails, setSplitDetails] =
    React.useState<SplitDetails>(initialSplitDetails);

  const deleteName = (name: string) => {
    setSplitDetails((old) => ({
      ...old,
      names: old.names.filter((n) => n !== name),
      items: old.items.map((item) => ({
        ...item,
        names: item.names.filter((n) => n !== name),
      })),
    }));
  };

  const editName = (newName: string, oldName: string) => {
    setSplitDetails((old) => ({
      ...old,
      names: old.names.map((name) => (name === oldName ? newName : name)),
      items: old.items.map((item) => ({
        ...item,
        names: item.names.map((name) => (name === oldName ? newName : name)),
      })),
    }));
  };

  const editInclusionOnItem = (itemIndex: number, name: string) => {
    setSplitDetails((old) => ({
      ...old,
      items: old.items.map((item, index) => ({
        ...item,
        names:
          index === itemIndex
            ? item.names.includes(name)
              ? item.names.filter((n) => n !== name)
              : [...item.names, name]
            : item.names,
      })),
    }));
  };

  return (
    <div className="flex flex-col gap-2">
      <p>Initial input</p>
      <p>{initialInput}</p>

      <p>Total</p>
      <Input
        value={splitDetails.total}
        onChange={(event) =>
          setSplitDetails((old) => ({
            ...old,
            total: parseInt(event.target.value),
          }))
        }
      />

      <p>People</p>
      <div className="flex flex-row gap-2">
        {splitDetails.names.map((name, index) => (
          <div
            key={`name-${index}`}
            className="flex flex-row gap-1 items-center"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteName(name)}
            >
              <Trash className="h-4 w-4" />
            </Button>
            <Input
              value={name}
              onChange={(event) => editName(event.target.value, name)}
            />
          </div>
        ))}
      </div>

      <p>Items</p>
      {splitDetails.items.map((item, itemIndex) => (
        <div key={`item-${itemIndex}`} className="grid grid-cols-12 gap-2">
          <Input value={item.itemName} className="col-span-3" />
          <Input value={item.cost} className="col-span-3" />
          <div className="col-span-6 flex flex-col gap-1">
            {splitDetails.names.map((name, nameIndex) => (
              <div
                key={`item-${itemIndex}-name-${nameIndex}`}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={item.names.includes(name)}
                  onClick={() => editInclusionOnItem(itemIndex, name)}
                />
                <label className="text-sm font-medium leading-none">
                  {name}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p>Split</p>
      <CalculatedSplit splitDetails={splitDetails} />
    </div>
  );
}

function CalculatedSplit({ splitDetails }: { splitDetails: SplitDetails }) {
  const calculatedSplit = calculateSplit(splitDetails);

  return (
    <div>
      {Object.entries(calculatedSplit).map(([name, cost]) => (
        <p key={`split-${name}`}>
          {name}: {cost}
        </p>
      ))}
    </div>
  );
}
