export const PERSON_NAME_FIELDS = [
  { key: "counterSale", label: "Counter Sale" },
  { key: "kitchenSale", label: "Kitchen Sale" },
  { key: "coffeeShop", label: "Coffee Shop" },
  { key: "officialCr", label: "Official Cr." },
  { key: "personalCr", label: "Personal Cr.", credited: true },
  { key: "upiReceived", label: "UPI Received" },
  { key: "purchaseCredit", label: "Purchase Credit" },
  { key: "expenseSubnames", label: "Expense subnames" },
  { key: "overtime", label: "Overtime" },
  { key: "salary", label: "Salary" },
  { key: "advance", label: "Advance" },
];

export const emptyPersonNames = () =>
  Object.fromEntries(
    PERSON_NAME_FIELDS.map(({ key }) => [key, key === "expenseSubnames" ? {} : []]),
  );

export const emptySaleTabNames = () => ({
  kitchenSale: [],
  coffeeShop: [],
  counterSale: [],
});

export const normalizeExpenseSubnames = (value) => {
  if (Array.isArray(value)) {
    return Object.fromEntries(value.filter(Boolean).map((name) => [name, []]));
  }
  return value && typeof value === "object" ? value : {};
};

export const flattenExpenseSubnames = (value) =>
  Object.keys(normalizeExpenseSubnames(value));

export function loadPersonNames() {
  return emptyPersonNames();
}
