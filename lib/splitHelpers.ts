export type SplitDetails = {
  total?: number;
  names: Array<string>;
  items: Array<Item>;
};

export type Item = {
  cost?: number;
  itemName?: string;
  names: Array<string>;
};

// TODO: remove any names in subarrays that aren't in the main names array
export function convertJsonIntoSplitDetails(input: string): SplitDetails {
  const json: { [key: string]: any } = JSON.parse(input);

  const total = json["total"];
  const names = json["names"] as Array<string>;
  const rawItems = json["items"] as Array<{ [key: string]: any }>;

  const items: Array<Item> = rawItems.map((rawItem) => {
    const itemCost = rawItem["cost"];
    const itemName = rawItem["itemName"];

    const namesInItem = rawItem["names"] as Array<string>;

    return {
      cost: itemCost !== undefined ? parseInt(itemCost) : undefined,
      itemName: itemName,
      names: namesInItem,
    };
  });

  return {
    total: total !== undefined ? parseInt(total) : undefined,
    names: names,
    items: items,
  };
}

// Returns dictionary of each person's bill, split by proportion of subtotal paid
export function calculateSplit(splitDetails: SplitDetails) {
  let errorMessage = "";

  const total = splitDetails.total;
  if (total === undefined) {
    errorMessage = "No total cost provided";
    return {
      error: errorMessage,
    };
  }

  const names = splitDetails.names;
  const items = splitDetails.items;

  const subtotal = items.reduce((acc, item) => {
    if (item.cost === undefined) {
      errorMessage = "No cost provided for an item";
      return 0;
    }

    return acc + item.cost;
  }, 0);

  if (errorMessage !== "") {
    return {
      error: errorMessage,
    };
  }

  const subtotalsPerPerson = names.reduce((acc, name) => {
    acc[name] = 0;
    return acc;
  }, {} as { [key: string]: number });

  items.forEach((item) => {
    // Should never fallback to 0 because we already throw error earlier
    const itemCost = item.cost ?? 0;

    const perPersonUnitCost = itemCost / item.names.length;

    item.names.forEach((name) => {
      subtotalsPerPerson[name] += perPersonUnitCost;
    });
  });

  const split = names.reduce((acc, name) => {
    acc[name] = (subtotalsPerPerson[name] / subtotal) * total;
    return acc;
  }, {} as { [key: string]: number });

  return split;
}
