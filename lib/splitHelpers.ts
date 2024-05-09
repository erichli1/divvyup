import { v4 as uuidv4 } from "uuid";
import {
  displayAsCurrency,
  displayAsPercentage,
  notNullOrUndefined,
} from "./utils";

export type ProcessedSplitDetails = {
  total?: number;
  names: Array<{ name: string; id: string }>;
  items: Array<ProcessedItem>;
};

export const EMPTY_PROCESSED_SPLIT_DETAILS: ProcessedSplitDetails = {
  names: [],
  items: [],
};

export function convertInitialSplitToProcessed(
  initial: SplitDetails
): ProcessedSplitDetails {
  const total = initial.total;
  const names = initial.names.map((name) => ({
    name: name,
    id: uuidv4(),
  }));

  const items = initial.items.map((item) => {
    const id = uuidv4();
    const cost = item.cost ?? 0;
    const itemName = item.itemName ?? "";
    const nameIdsMaybeNull = item.names.map((name) => {
      const nameObj = names.find((n) => n.name === name);

      return nameObj !== undefined ? nameObj.id : null;
    });

    const nameIds = nameIdsMaybeNull.filter(notNullOrUndefined);

    return {
      id,
      cost,
      itemName,
      nameIds,
    };
  });

  return {
    total,
    names,
    items,
  };
}

export type SplitDetails = {
  total?: number;
  names: Array<string>;
  items: Array<Item>;
};

export type SplitDetailsWithIds = {
  total?: number;
  names: Array<string>;
  items: Array<Item & { id: string }>;
};

export type ProcessedItem = {
  id: string;
  cost: number;
  itemName: string;
  nameIds: Array<string>;
};

export type Item = {
  cost?: number;
  itemName?: string;
  names: Array<string>;
};

export const EMPTY_SPLIT_DETAILS: SplitDetails = {
  names: [],
  items: [],
};

// TODO: remove any names in subarrays that aren't in the main names array
export function convertJsonIntoSplitDetails(input: string): {
  note?: string;
  output: SplitDetails;
} {
  if (input === "" || input === "{}")
    return { note: "Unable to parse given text.", output: EMPTY_SPLIT_DETAILS };

  const json: { [key: string]: any } = JSON.parse(input);

  const total = json["total"];
  const names = (json["names"] as Array<string>) ?? [];
  const rawItems = (json["items"] as Array<{ [key: string]: any }>) ?? [];

  const items: Array<Item> = rawItems.map((rawItem) => {
    const itemCost = rawItem["cost"];
    const itemName = rawItem["itemName"];

    const namesInItem = rawItem["names"] as Array<string>;

    return {
      cost: itemCost !== undefined ? parseFloat(itemCost) : undefined,
      itemName: itemName,
      names: namesInItem,
    };
  });

  return {
    output: {
      total: total !== undefined ? parseFloat(total) : undefined,
      names: names,
      items: items,
    },
  };
}

// Returns dictionary of each person's bill, split by proportion of subtotal paid
export function calculateSplit(splitDetails: ProcessedSplitDetails): {
  error?: string;
  warning?: string;
  output?: { [key: string]: number };
  mathTable?: Array<Array<string>>;
} {
  // Retrieve the total
  const total = splitDetails.total;
  if (total === undefined || isNaN(total))
    return errorObj("No total cost provided");

  // Retrieve the names
  const names = splitDetails.names;
  const namesOnlyStr = names.map((name) => name.name);
  if (namesOnlyStr.length !== new Set(namesOnlyStr).size)
    return errorObj("Duplicate names found in the list of names");

  // Create the math
  let mathTable = [["", "Total", ...names.map((name) => name.name)]];

  // Retrieve the items
  const items = splitDetails.items;

  // Calculate the subtotal from each item
  let errorMessage = "";
  const subtotal: number = items.reduce((acc, item) => {
    if (item.cost === undefined) {
      errorMessage = "No cost provided for an item";
      return 0;
    }
    return acc + item.cost;
  }, 0);
  if (errorMessage !== "") return errorObj(errorMessage);
  if (subtotal > total) return errorObj("Subtotal is greater than total cost.");

  // Initialize subtotals dictionary
  const subtotalsPerPerson = names.reduce((acc, name) => {
    acc[name.name] = 0;
    return acc;
  }, {} as { [key: string]: number });

  // Iterate through each item
  items.forEach((item, itemIndex) => {
    const itemInTable = [
      item.itemName !== "" ? item.itemName : `item-${itemIndex + 1}`,
    ];

    const itemCost = item.cost ?? 0; // will never fallback to 0, bc we break earlier if so
    itemInTable.push(displayAsCurrency(itemCost));
    if (isNaN(itemCost) && item.nameIds.length > 0)
      errorMessage = "At least one item cost is not set";
    if (itemCost > 0 && item.nameIds.length === 0)
      errorMessage = "At least one item has a cost not assigned to somebody";

    const perPersonUnitCost = itemCost / item.nameIds.length;
    names.forEach((name) => {
      if (!item.nameIds.includes(name.id)) itemInTable.push("");
      else {
        subtotalsPerPerson[name.name] += perPersonUnitCost;
        itemInTable.push(displayAsCurrency(perPersonUnitCost));
      }
    });

    mathTable.push(itemInTable);
  });
  if (errorMessage !== "") return errorObj(errorMessage);

  // Add subtotal to math table
  mathTable.push([
    "Subtotal",
    displayAsCurrency(subtotal),
    ...names.map((name) =>
      displayAsCurrency(subtotalsPerPerson[name.name] ?? 0)
    ),
  ]);

  // Post-processing given subtotal
  const proportionInTable = ["Proportion", "100%"];
  const feesInTable = ["Fees", displayAsCurrency(total - subtotal)];
  const splitInTable = ["Split", displayAsCurrency(total)];

  const split = names.reduce((acc, name) => {
    const proportion = subtotalsPerPerson[name.name] / subtotal;
    proportionInTable.push(displayAsPercentage(proportion));
    feesInTable.push(displayAsCurrency(proportion * (total - subtotal)));
    splitInTable.push(displayAsCurrency(proportion * total));

    acc[name.name] = proportion * total;
    return acc;
  }, {} as { [key: string]: number });
  mathTable = mathTable.concat([proportionInTable, feesInTable, splitInTable]);

  return {
    output: split,
    mathTable,
  };
}

function errorObj(message: string) {
  return {
    error: message,
  };
}
