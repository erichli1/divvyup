"use client";

import { Button } from "@/components/ui/button";
import { Authenticated, Unauthenticated, useAction } from "convex/react";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import {
  EMPTY_SPLIT_DETAILS,
  SplitDetails,
  calculateSplit,
  convertJsonIntoSplitDetails,
} from "@/lib/splitHelpers";
import { Input } from "@/components/ui/input";
import { Plus, Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/convex/_generated/api";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <>
      {/* <StickyHeader className="px-4 py-2">
        <div className="flex justify-between items-center">
          billsplit (v3)
          <SignInButtonContainer />
        </div>
      </StickyHeader> */}
      <main className="mx-auto p-2 max-w-2xl flex flex-col gap-8">
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

// function SignInButtonContainer() {
//   return (
//     <div className="flex gap-4">
//       <Authenticated>
//         <UserButton afterSignOutUrl="#" />
//       </Authenticated>
//       <Unauthenticated>
//         <SignInButton mode="modal">
//           <Button variant="ghost">Sign in</Button>
//         </SignInButton>
//       </Unauthenticated>
//     </div>
//   );
// }

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
  const [initialSplitNotes, setInitialSplitNotes] = React.useState<
    string | null
  >(null);

  if (initialSplitDetails === null)
    return (
      <InitialEntry
        initialInput={initialInput}
        onInitialInputChange={(initialInput) => setInitialInput(initialInput)}
        setSplitDetails={(splitDetails) => setInitialSplitDetails(splitDetails)}
        setInitialSplitNotes={(notes) => setInitialSplitNotes(notes)}
      />
    );

  return (
    <SplitDetailsDisplay
      initialInput={initialInput}
      initialSplitDetails={initialSplitDetails}
      initialSplitNotes={initialSplitNotes}
    />
  );
}

function InitialEntry({
  initialInput,
  onInitialInputChange,
  setSplitDetails,
  setInitialSplitNotes,
}: {
  initialInput: string;
  onInitialInputChange: (initialInput: string) => void;
  setSplitDetails: (splitDetails: SplitDetails) => void;
  setInitialSplitNotes: (notes: string) => void;
}) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const processInputInfo = useAction(api.myActions.processInputInfo);

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={initialInput}
        onChange={(event) => onInitialInputChange(event.target.value)}
        placeholder="Start talking or typing into here to begin!"
        disabled={loading}
      />
      <div className="flex flex-row justify-end">
        <Button
          disabled={loading}
          onClick={() => {
            setLoading(true);

            if (initialInput !== "")
              processInputInfo({ input: initialInput })
                .then((res) => {
                  const result = convertJsonIntoSplitDetails(res);
                  if (result.note) setInitialSplitNotes(result.note);

                  setSplitDetails(result.output);
                })
                .catch(console.error);
            else setSplitDetails(EMPTY_SPLIT_DETAILS);
          }}
        >
          {loading
            ? "Loading..."
            : initialInput === ""
            ? "Manual input"
            : "Process inputs"}
        </Button>
      </div>
    </div>
  );
}

function SplitDetailsDisplay({
  initialInput,
  initialSplitDetails,
  initialSplitNotes,
}: {
  initialInput: string;
  initialSplitDetails: SplitDetails;
  initialSplitNotes: string | null;
}) {
  const [splitDetails, setSplitDetails] =
    React.useState<SplitDetails>(initialSplitDetails);

  const addName = () => {
    setSplitDetails((old) => ({
      ...old,
      names: [...old.names, `person-${old.names.length + 1}`],
    }));
  };

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

  const addItem = () => {
    setSplitDetails((old) => ({
      ...old,
      items: [
        ...old.items,
        {
          names: [],
        },
      ],
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

  const editItemName = (itemIndex: number, newItemName: string) => {
    setSplitDetails((old) => ({
      ...old,
      items: old.items.map((item, index) => ({
        ...item,
        itemName: index === itemIndex ? newItemName : item.itemName,
      })),
    }));
  };

  const editItemCost = (itemIndex: number, newItemCost: number) => {
    setSplitDetails((old) => ({
      ...old,
      items: old.items.map((item, index) => ({
        ...item,
        cost: index === itemIndex ? newItemCost : item.cost,
      })),
    }));
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold">Initial input</p>
      <p>{initialInput}</p>

      {initialSplitNotes !== null && <p>Note: {initialSplitNotes}</p>}

      <br />

      <p className="font-bold">Total</p>
      <Input
        value={splitDetails.total}
        onChange={(event) => {
          console.log(event.target.value);
          setSplitDetails((old) => ({
            ...old,
            total: parseFloat(event.target.value),
          }));
        }}
        type="number"
      />

      <br />

      <p className="font-bold">People</p>
      <div className="flex flex-row">
        <Button onClick={() => addName()}>
          <Plus className="h-4 w-4" />
        </Button>
        <div className="ml-2 flex-grow grid grid-cols-2 gap-2">
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
      </div>

      <br />

      <p className="font-bold">Items</p>
      {splitDetails.items.map((item, itemIndex) => (
        <div key={`item-${itemIndex}`} className="grid grid-cols-12 gap-2">
          <Button size="icon" variant="ghost">
            <Trash className="h-4 w-4" />
          </Button>
          <Input
            value={item.itemName}
            onChange={(event) => editItemName(itemIndex, event.target.value)}
            className="col-span-3"
          />
          <Input
            value={item.cost}
            onChange={(event) =>
              editItemCost(itemIndex, parseFloat(event.target.value))
            }
            className="col-span-3"
            type="number"
          />
          <div className="col-span-5 flex flex-col gap-1">
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
          <div className="col-span-12">
            <Separator />
          </div>
        </div>
      ))}
      <div>
        <Button onClick={() => addItem()}>
          <Plus className="h-4 w-4 mr-2" />
          Add item
        </Button>
      </div>

      <br />

      <CalculatedSplit splitDetails={splitDetails} />
    </div>
  );
}

function CalculatedSplit({ splitDetails }: { splitDetails: SplitDetails }) {
  const calculatedSplit = calculateSplit(splitDetails);

  if (calculatedSplit.error) return <p>{calculatedSplit.error}</p>;

  return (
    <>
      <p className="font-bold">Split</p>
      <div>
        {calculatedSplit.output &&
          Object.entries(calculatedSplit.output).map(([name, cost]) => (
            <p key={`split-${name}`}>
              {name}: {cost}
            </p>
          ))}
      </div>

      {calculatedSplit.outputStats && (
        <>
          <p className="font-bold">Checks</p>
          <div>
            <p>Subtotal: {calculatedSplit.outputStats.subtotal}</p>
            <p>Sum: {calculatedSplit.outputStats.sum}</p>
          </div>
        </>
      )}
    </>
  );
}
