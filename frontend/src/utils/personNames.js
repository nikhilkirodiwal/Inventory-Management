export const PERSON_NAME_FIELDS = [
  { key: "kitchenSale", label: "Kitchen Sale person names" },
  { key: "coffeeShop", label: "Coffee Shop person names" },
  { key: "counterSale", label: "Counter Sale person names" },
  { key: "officialCr", label: "Official Cr." },
  { key: "personalCr", label: "Personal Cr.", credited: true },
  { key: "upiReceived", label: "UPI Received" },
  { key: "salary", label: "Salary" },
  { key: "advance", label: "Advance" },
  { key: "overtime", label: "Overtime" },
  { key: "expenseSubnames", label: "Expense subnames" },
  { key: "purchaseCredit", label: "Purchase Credit" },
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
