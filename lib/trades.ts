import type { Tables } from "@/lib/supabase/database.types";

export type TradeEntry = Tables<"trade_entries">;
export type TradeEntryType = "BUY" | "SELL";

export type ItemSummary = {
  averageBuyPrice: number;
  averageSellPrice: number;
  itemName: string;
  realizedProfitLoss: number;
  remainingAmount: number;
  totalBoughtAmount: number;
  totalBoughtValue: number;
  totalSoldAmount: number;
  totalSoldValue: number;
  warning: boolean;
};

export type TradeSummary = {
  balance: number;
  items: ItemSummary[];
  totalProfit: number;
  totalBuyValue: number;
  totalSellValue: number;
  warningCount: number;
};

const creditsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const wholeNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function computeEntryTotalValue(entry: Pick<TradeEntry, "amount" | "unit_price">) {
  return entry.amount * entry.unit_price;
}

export function computeEntryChange(
  entry: Pick<TradeEntry, "amount" | "type" | "unit_price">,
) {
  const total = computeEntryTotalValue(entry);
  return entry.type === "SELL" ? total : -total;
}

export function summarizeTradeEntries(entries: TradeEntry[]): TradeSummary {
  const grouped = new Map<string, ItemSummary>();
  const inventoryByItem = new Map<
    string,
    {
      quantity: number;
      value: number;
    }
  >();

  let totalBuyValue = 0;
  let totalSellValue = 0;
  let balance = 0;

  const chronologicallySortedEntries = [...entries].sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.id.localeCompare(right.id);
  });

  for (const entry of chronologicallySortedEntries) {
    const normalizedItemName = entry.item_name.trim().replace(/\s+/g, " ");
    const key = normalizedItemName.toLowerCase();
    const current =
      grouped.get(key) ??
      ({
        averageBuyPrice: 0,
        averageSellPrice: 0,
        itemName: normalizedItemName,
        realizedProfitLoss: 0,
        remainingAmount: 0,
        totalBoughtAmount: 0,
        totalBoughtValue: 0,
        totalSoldAmount: 0,
        totalSoldValue: 0,
          warning: false,
        } satisfies ItemSummary);
    const inventory =
      inventoryByItem.get(key) ??
      ({
        quantity: 0,
        value: 0,
      } satisfies {
        quantity: number;
        value: number;
      });

    const totalValue = computeEntryTotalValue(entry);
    balance += computeEntryChange(entry);

    if (entry.type === "BUY") {
      current.totalBoughtAmount += entry.amount;
      current.totalBoughtValue += totalValue;
      inventory.quantity += entry.amount;
      inventory.value += totalValue;
      totalBuyValue += totalValue;
    } else {
      const averageCostBeforeSale =
        inventory.quantity > 0 ? inventory.value / inventory.quantity : 0;
      const coveredAmount = Math.min(entry.amount, Math.max(inventory.quantity, 0));
      const soldCostBasis = coveredAmount * averageCostBeforeSale;

      current.totalSoldAmount += entry.amount;
      current.totalSoldValue += totalValue;
      current.realizedProfitLoss += totalValue - soldCostBasis;
      inventory.quantity -= coveredAmount;
      inventory.value -= soldCostBasis;
      totalSellValue += totalValue;
    }

    grouped.set(key, current);
    inventoryByItem.set(key, inventory);
  }

  const items = Array.from(grouped.values())
    .map((item) => {
      item.averageBuyPrice =
        item.totalBoughtAmount > 0
          ? item.totalBoughtValue / item.totalBoughtAmount
          : 0;
      item.averageSellPrice =
        item.totalSoldAmount > 0
          ? item.totalSoldValue / item.totalSoldAmount
          : 0;
      item.remainingAmount = item.totalBoughtAmount - item.totalSoldAmount;
      item.warning = item.totalSoldAmount > item.totalBoughtAmount;
      return item;
    })
    .sort((left, right) => left.itemName.localeCompare(right.itemName));
  const totalProfit = items.reduce(
    (sum, item) => sum + item.realizedProfitLoss,
    0,
  );

  return {
    balance,
    items,
    totalProfit,
    totalBuyValue,
    totalSellValue,
    warningCount: items.filter((item) => item.warning).length,
  };
}

export function formatCredits(value: number) {
  return creditsFormatter.format(value);
}

export function formatDecimal(value: number) {
  return decimalFormatter.format(value);
}

export function formatWholeNumber(value: number) {
  return wholeNumberFormatter.format(value);
}

export function formatDateTime(value: string) {
  return dateFormatter.format(new Date(value));
}

export function createFilterQuery(filters: {
  edit?: string;
  episode?: string;
  item?: string;
}) {
  const params = new URLSearchParams();

  if (filters.item) {
    params.set("item", filters.item);
  }

  if (filters.episode) {
    params.set("episode", filters.episode);
  }

  if (filters.edit) {
    params.set("edit", filters.edit);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
