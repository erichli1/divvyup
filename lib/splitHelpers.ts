import { v4 as uuidv4 } from "uuid";
import { notNullOrUndefined, round } from "./utils";

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

type MathRow = {
  name: string;
  total: number;
  type: "percentage" | "currency";
  values: Array<number>;
};

// Returns dictionary of each person's bill, split by proportion of subtotal paid
export function calculateSplit(splitDetails: ProcessedSplitDetails): {
  error?: string;
  warning?: string;
  output?: { [key: string]: number };
  math?: { header: Array<string>; table: Array<MathRow> };
} {
  let mathTable: Array<MathRow> = [];

  // Retrieve the total
  const total = splitDetails.total;
  if (total === undefined || isNaN(total))
    return errorObj("No total cost provided");

  // Retrieve the names
  const names = splitDetails.names;
  const namesOnlyStr = names.map((name) => name.name);
  if (namesOnlyStr.length !== new Set(namesOnlyStr).size)
    return errorObj("Duplicate names found in the list of names");

  // Retrieve the items
  const items = splitDetails.items;

  // Initialize subtotal array
  const subtotalInTable: MathRow = {
    name: "Subtotal",
    total: 0,
    type: "currency",
    values: names.map(() => 0),
  };

  // Iterate through each item
  let errorMessage = "";
  items.forEach((item, itemIndex) => {
    const itemCost = item.cost;

    const itemInTable: MathRow = {
      name: item.itemName === "" ? `item-${itemIndex + 1}` : item.itemName,
      total: itemCost,
      type: "currency",
      values: names.map(() => 0),
    };

    if (isNaN(itemCost) && item.nameIds.length > 0)
      errorMessage = "At least one item cost is not set";
    if (itemCost > 0 && item.nameIds.length === 0)
      errorMessage = "At least one item has a cost not assigned to somebody";

    const perPersonUnitCost = itemCost / item.nameIds.length;
    names.forEach((name, nameIndex) => {
      if (item.nameIds.includes(name.id)) {
        itemInTable.values[nameIndex] = perPersonUnitCost;
        subtotalInTable.values[nameIndex] += perPersonUnitCost;
        subtotalInTable.total += perPersonUnitCost;
      }
    });

    mathTable.push(itemInTable);
  });
  if (errorMessage !== "") return errorObj(errorMessage);

  // Add subtotal to math table
  mathTable.push(subtotalInTable);
  if (subtotalInTable.total > total)
    return errorObj("Subtotal is greater than total cost.");

  // Post-processing given subtotal
  const proportionInTable: MathRow = {
    name: "Proportion",
    total: 1,
    type: "percentage",
    values: names.map(
      (_name, nameIndex) =>
        subtotalInTable.values[nameIndex] / subtotalInTable.total
    ),
  };
  const feesInTable: MathRow = {
    name: "Fees",
    total: total - subtotalInTable.total,
    type: "currency",
    values: names.map(
      (_name, nameIndex) =>
        proportionInTable.values[nameIndex] * (total - subtotalInTable.total)
    ),
  };

  const splitValues = names.map((_name, nameIndex) =>
    round(proportionInTable.values[nameIndex] * total, 2)
  );
  const splitInTable: MathRow = {
    name: "Split",
    total: splitValues.reduce((acc, val) => acc + val, 0),
    type: "currency",
    values: splitValues,
  };

  mathTable = mathTable.concat([proportionInTable, feesInTable, splitInTable]);

  const split = names.reduce((acc, name, nameIndex) => {
    acc[name.name] = splitInTable.values[nameIndex];
    return acc;
  }, {} as { [key: string]: number });

  return {
    output: split,
    math: {
      header: ["Name", "Total", ...names.map((name) => name.name)],
      table: mathTable,
    },
  };
}

function errorObj(message: string) {
  return {
    error: message,
  };
}
