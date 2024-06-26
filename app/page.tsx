"use client";

import { Button } from "@/components/ui/button";
import { Authenticated, Unauthenticated, useAction } from "convex/react";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import {
  EMPTY_SPLIT_DETAILS,
  ProcessedSplitDetails,
  SplitDetails,
  calculateSplit,
  convertInitialSplitToProcessed,
  convertJsonIntoSplitDetails,
} from "@/lib/splitHelpers";
import { Input } from "@/components/ui/input";
import {
  FilePlus2,
  Loader2,
  TextCursorInput,
  Trash,
  UserRoundPlus,
  WandSparkles,
  Zap,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/convex/_generated/api";
import { Separator } from "@/components/ui/separator";
import { cn, displayAsCurrency, displayAsPercentage } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isMobile } from "react-device-detect";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <main className="mx-auto p-2 max-w-2xl flex flex-col gap-8">
        <h1 className="text-4xl font-extrabold my-8 text-center">divvy up</h1>
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

const NAMES = [
  "Liam",
  "Olivia",
  "Noah",
  "Emma",
  "Oliver",
  "Charlotte",
  "James",
  "Amelia",
  "Elijah",
  "Sophia",
  "Mateo",
  "Mia",
  "Theodore",
  "Isabella",
  "Henry",
  "Ava",
  "Lucas",
  "Evelyn",
  "William",
  "Luna",
];

const ITEMS = [
  "pizza",
  "burger",
  "sushi",
  "pasta",
  "tacos",
  "steak",
  "ramen",
  "curry",
  "paella",
  "falafel",
  "dumplings",
  "barbecue",
  "fish and chips",
  "lasagna",
  "chocolate",
  "ice cream",
  "chicken wings",
  "donuts",
  "crepes",
  "poutine",
];

function getRandomItems<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
}

function generateExample(): string {
  const outputArr: Array<string> = [];

  const totalNumPeople = Math.floor(Math.random() * 3) + 2; // 2-4 people
  const totalNumItems = Math.floor(Math.random() * 3) + 2; // 2-4 items

  const people = getRandomItems(NAMES, totalNumPeople);
  const items = getRandomItems(ITEMS, totalNumItems);
  const itemsSomeNull = items.map((item) =>
    Math.random() > 0.5 ? item : null
  );

  let subtotal = 0;

  itemsSomeNull.forEach((item) => {
    const price = Math.floor(Math.random() * 20) + 5; // 5-25
    subtotal += price;

    const peopleInvolved = getRandomItems(
      people,
      Math.floor(Math.random() * totalNumPeople) + 1
    );

    outputArr.push(
      `${
        peopleInvolved.length === people.length
          ? "Everybody split"
          : peopleInvolved.length > 1
          ? peopleInvolved.join(", ") + " split"
          : peopleInvolved[0] + " got"
      } ${item === null ? price : item + " for " + price}`
    );
  });

  const total = `The total was ${(Math.random() * subtotal + subtotal).toFixed(
    2
  )}.`;

  return `${total} ${outputArr.join(". ")}`;
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

  const status = loading ? "loading" : initialInput === "" ? "empty" : "typed";

  return (
    <div className="flex flex-col gap-2">
      <p>
        <span className="font-bold">
          Just say the total and who split what! Edit on the next page if
          something goes wrong.
        </span>
        &nbsp;
        <span>
          Ex: The total was 80. Kelsey and Eric split 35, Derek got a steak for
          20.
        </span>
      </p>

      <br />

      <p className="text-sm text-muted-foreground">
        {isMobile ? (
          <>Hit the microphone on your keyboard to start talking!</>
        ) : (
          <>
            You can enable dictation on{" "}
            <Link
              href="https://support.apple.com/guide/mac-help/use-dictation-mh40584/mac"
              className="underline"
            >
              MacOS
            </Link>{" "}
            and{" "}
            <Link
              href="https://support.microsoft.com/en-us/windows/use-voice-typing-to-talk-instead-of-type-on-your-pc-fec94565-c4bd-329d-e59a-af033fa5689f"
              className="underline"
            >
              Windows
            </Link>
            .
          </>
        )}
      </p>
      <Textarea
        value={initialInput}
        onChange={(event) => onInitialInputChange(event.target.value)}
        placeholder="Start talking or typing here..."
        disabled={loading}
        autoSize
        className="shadow-md min-h-[100px]"
      />
      <div className="flex flex-row justify-end">
        <div className="flex flex-row gap-2">
          <Button
            variant="outline"
            className="transition-all hover:scale-105 shadow-md hover:shadow-lg"
            onClick={() => {
              onInitialInputChange(generateExample());
            }}
          >
            <Zap className="h-4 w-4 mr-2" />
            Try example
          </Button>
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
            className={cn(
              "transition-all shadow-md hover:shadow-lg",
              status === "typed"
                ? "bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500"
                : "",
              status === "loading" ? "" : "hover:scale-105"
            )}
          >
            {status === "loading" && (
              <>
                <div className="animate-spin mr-2">
                  <Loader2 className="h-4 w-4" />
                </div>
                Loading...
              </>
            )}
            {status === "empty" && (
              <>
                <TextCursorInput className="h-4 w-4 mr-2" />
                Manually divvy
              </>
            )}
            {status === "typed" && (
              <>
                <WandSparkles className="h-4 w-4 mr-2" />
                Auto divvy
              </>
            )}
          </Button>
        </div>
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
  // const processedInitialSplitDetails = {
  //   ...initialSplitDetails,
  //   items: initialSplitDetails.items.map((item) => ({
  //     ...item,
  //     itemName: item.itemName ?? "",
  //     cost: item.cost ?? 0,
  //     id: uuidv4(),
  //   })),
  // };

  // const [splitDetails, setSplitDetails] = React.useState<SplitDetailsWithIds>(
  //   processedInitialSplitDetails
  // );

  const [splitDetails, setSplitDetails] = React.useState<ProcessedSplitDetails>(
    convertInitialSplitToProcessed(initialSplitDetails)
  );

  const addName = () => {
    setSplitDetails((old) => ({
      ...old,
      names: [
        ...old.names,
        { name: `person-${old.names.length + 1}`, id: uuidv4() },
      ],
    }));
  };

  const deleteName = (nameId: string) => {
    setSplitDetails((old) => ({
      ...old,
      names: old.names.filter((n) => n.id !== nameId),
      items: old.items.map((item) => ({
        ...item,
        names: item.nameIds.filter((id) => id !== nameId),
      })),
    }));
  };

  const editName = (newName: string, nameId: string) => {
    setSplitDetails((old) => ({
      ...old,
      names: old.names.map((name) =>
        name.id === nameId ? { ...name, name: newName } : name
      ),
    }));
  };

  const addItem = () => {
    setSplitDetails((old) => ({
      ...old,
      items: [
        ...old.items,
        {
          id: uuidv4(),
          cost: 0,
          itemName: "",
          nameIds: [],
        },
      ],
    }));
  };

  const editInclusionOnItem = (itemId: string, nameId: string) => {
    setSplitDetails((old) => ({
      ...old,
      items: old.items.map((item) => ({
        ...item,
        nameIds:
          item.id === itemId
            ? item.nameIds.includes(nameId)
              ? item.nameIds.filter((id) => id !== nameId)
              : [...item.nameIds, nameId]
            : item.nameIds,
      })),
    }));
  };

  const editItemName = (itemId: string, newItemName: string) => {
    setSplitDetails((old) => ({
      ...old,
      items: old.items.map((item) => ({
        ...item,
        itemName: item.id === itemId ? newItemName : item.itemName,
      })),
    }));
  };

  const editItemCost = (itemId: string, newItemCost: number) => {
    setSplitDetails((old) => ({
      ...old,
      items: old.items.map((item) => ({
        ...item,
        cost: item.id === itemId ? newItemCost : item.cost,
      })),
    }));
  };

  const deleteItem = (itemId: string) => {
    setSplitDetails((old) => ({
      ...old,
      items: old.items.filter((item) => item.id !== itemId),
    }));
  };

  return (
    <div className="flex flex-col gap-2">
      {initialInput !== "" && (
        <>
          <p className="font-bold">Initial input</p>
          <p>{initialInput}</p>
        </>
      )}

      {initialSplitNotes !== null && <p>Note: {initialSplitNotes}</p>}

      <br />

      <p className="font-bold">Total</p>
      <Input
        value={splitDetails.total ?? ""}
        onChange={(event) => {
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
        <Button
          onClick={() => addName()}
          className="transition-all hover:scale-105"
        >
          <UserRoundPlus className="h-4 w-4" />
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
                onClick={() => deleteName(name.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
              <Input
                value={name.name}
                onChange={(event) => editName(event.target.value, name.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <br />

      <p className="font-bold">Items</p>
      {splitDetails.items.map((item) => (
        <div key={`item-${item.id}`} className="grid grid-cols-12 gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => deleteItem(item.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
          <Input
            value={item.itemName}
            onChange={(event) => editItemName(item.id, event.target.value)}
            className="col-span-3"
          />
          <Input
            value={item.cost}
            onChange={(event) =>
              editItemCost(item.id, parseFloat(event.target.value))
            }
            className="col-span-3"
            type="number"
          />
          <div className="col-span-5 flex flex-col gap-1">
            {splitDetails.names.map((name, nameIndex) => (
              <div
                key={`item-${item.id}-name-${nameIndex}`}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={item.nameIds.includes(name.id)}
                  onClick={() => editInclusionOnItem(item.id, name.id)}
                />
                <label className="text-sm font-medium leading-none">
                  {name.name}
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
        <Button
          onClick={() => addItem()}
          className="transition-all hover:scale-105"
        >
          <FilePlus2 className="h-4 w-4 mr-2" />
          Add item
        </Button>
      </div>

      <br />

      <CalculatedSplit splitDetails={splitDetails} />
    </div>
  );
}

function CalculatedSplit({
  splitDetails,
}: {
  splitDetails: ProcessedSplitDetails;
}) {
  const calculatedSplit = calculateSplit(splitDetails);

  if (calculatedSplit.error)
    return (
      <Alert variant="destructive">
        <p className="font-bold">{calculatedSplit.error}</p>
      </Alert>
    );

  return (
    <>
      <p className="font-bold">Split</p>
      <div>
        {calculatedSplit.output &&
          Object.entries(calculatedSplit.output).map(([name, cost]) => (
            <p key={`split-${name}`}>
              {name}: {displayAsCurrency(cost)}
            </p>
          ))}
      </div>

      <br />

      <p className="font-bold">Math</p>
      {calculatedSplit.math && (
        <Table>
          <TableCaption>
            Split totals may be off by a few cents due to rounding.
          </TableCaption>
          <TableHeader>
            <TableRow>
              {calculatedSplit.math.header.map((elem, elemIndex) => (
                <TableHead key={`table-head-${elemIndex}`}>{elem}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculatedSplit.math.table.map((row, rowIndex) => (
              <TableRow
                key={`table-row-${rowIndex}`}
                className={
                  row.name === "Split" || row.name === "Subtotal"
                    ? "font-bold"
                    : ""
                }
              >
                <TableCell>{row.name}</TableCell>
                <TableCell>
                  {row.type === "currency"
                    ? displayAsCurrency(row.total)
                    : displayAsPercentage(row.total)}
                </TableCell>
                {row.values.map((elem, elemIndex) => (
                  <TableCell key={`table-row-${rowIndex}-elem-${elemIndex}`}>
                    {row.hideIfZero && elem === 0
                      ? ""
                      : row.type === "currency"
                      ? displayAsCurrency(elem)
                      : displayAsPercentage(elem)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
