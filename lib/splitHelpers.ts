import { v4 as uuidv4 } from "uuid";
import { notNullOrUndefined } from "./utils";

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
  output?: { [key: string]: number };
  warning?: string;
  outputStats?: {
    sum: number;
    subtotal: number;
  };
} {
  let errorMessage = "";

  const total = splitDetails.total;
  if (total === undefined || isNaN(total)) {
    errorMessage = "No total cost provided";
    return {
      error: errorMessage,
    };
  }

  const names = splitDetails.names;

  const namesOnlyStr = names.map((name) => name.name);
  if (namesOnlyStr.length !== new Set(namesOnlyStr).size)
    return {
      error: "Duplicate names found in the list of names",
    };
  const items = splitDetails.items;

  const subtotal = items.reduce((acc, item) => {
    if (item.cost === undefined) {
      errorMessage = "No cost provided for an item";
      return 0;
    }

    return acc + item.cost;
  }, 0);

  if (errorMessage !== "")
    return {
      error: errorMessage,
    };

  if (subtotal > total)
    return { error: "Subtotal is greater than total cost." };

  const subtotalsPerPerson = names.reduce((acc, name) => {
    acc[name.name] = 0;
    return acc;
  }, {} as { [key: string]: number });

  items.forEach((item) => {
    // Should never fallback to 0 because we already throw error earlier
    const itemCost = item.cost ?? 0;

    if (isNaN(itemCost) && item.nameIds.length > 0)
      errorMessage = "At least one item cost is not set";

    if (itemCost > 0 && item.nameIds.length === 0)
      errorMessage = "At least one item has a cost not assigned to somebody";

    const perPersonUnitCost = itemCost / item.nameIds.length;

    item.nameIds.forEach((nameId) => {
      const name = names.find((n) => n.id === nameId)?.name;
      if (name) subtotalsPerPerson[name] += perPersonUnitCost;
    });
  });

  if (errorMessage !== "")
    return {
      error: errorMessage,
    };

  const split = names.reduce((acc, name) => {
    acc[name.name] = (subtotalsPerPerson[name.name] / subtotal) * total;
    return acc;
  }, {} as { [key: string]: number });

  const sum = Object.entries(split).reduce(
    (acc, [_key, value]) => acc + value,
    0
  );

  return {
    output: split,
    outputStats: {
      sum,
      subtotal,
    },
  };
}
