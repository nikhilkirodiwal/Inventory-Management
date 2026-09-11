import EntryField from "../models/entryField.js";

const NAME_KEYS = [
  "counterSale",
  "kitchenSale",
  "coffeeShop",
  "officialCr",
  "personalCr",
  "upiReceived",
  "purchaseCredit",
  "expenseSubnames",
  "overtime",
  "salary",
  "advance",
];
const TAB_NAME_KEYS = ["kitchenSale", "coffeeShop", "counterSale"];

const getShopId = (req) => {
  if (["admin", "staff"].includes(req.user?.role)) return req.user.shop;
  if (req.user?.role === "superadmin") return req.query.shop || req.body?.shop;
  return null;
};

const normalizeNames = (names = {}) =>
  Object.fromEntries(
    NAME_KEYS.map((key) => {
      if (key === "expenseSubnames") {
        const rawSource = names[key];
        const source = rawSource instanceof Map
          ? Object.fromEntries(rawSource)
          : rawSource;
        if (Array.isArray(source)) {
          return [
            key,
            Object.fromEntries(
              source
                .map((value) => String(value || "").trim())
                .filter(Boolean)
                .map((value) => [value, []]),
            ),
          ];
        }
        const nested = {};
        Object.entries(source && typeof source === "object" ? source : {}).forEach(
          ([category, values]) => {
            const outer = String(category || "").trim();
            if (!outer) return;
            const unique = [];
            (Array.isArray(values) ? values : []).forEach((value) => {
              const name = String(value || "").trim();
              if (name && !unique.some((item) => item.toLowerCase() === name.toLowerCase())) {
                unique.push(name);
              }
            });
            nested[outer] = unique.slice(0, 200);
          },
        );
        return [key, nested];
      }
      const values = Array.isArray(names[key]) ? names[key] : [];
      const unique = [];
      values.forEach((value) => {
        const name = String(value || "").trim();
        if (name && !unique.some((item) => item.toLowerCase() === name.toLowerCase())) {
          unique.push(name);
        }
      });
      return [key, unique.slice(0, 200)];
    }),
  );

const normalizeTabNames = (value = {}) => {
  const source = value instanceof Map ? Object.fromEntries(value) : value;
  return Object.fromEntries(
    TAB_NAME_KEYS.map((key) => {
      const unique = [];
      (Array.isArray(source?.[key]) ? source[key] : []).forEach((value) => {
        const name = String(value || "").trim();
        if (name && !unique.some((item) => item.toLowerCase() === name.toLowerCase())) {
          unique.push(name);
        }
      });
      return [key, unique.slice(0, 100)];
    }),
  );
};

const requireShop = (req, res) => {
  const shop = getShopId(req);
  if (!shop) {
    res.status(403).json({ success: false, message: "Shop is required" });
    return null;
  }
  return shop;
};

export const getEntryFields = async (req, res) => {
  try {
    const shop = requireShop(req, res);
    if (!shop) return;
    const doc = await EntryField.findOne({ shop }).lean();
    res.json({
      success: true,
      data: normalizeNames(doc?.names || {}),
      tabNames: normalizeTabNames(doc?.saleTabNames || doc?.names?.saleTabNames || {}),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEntryFields = async (req, res) => {
  try {
    const shop = requireShop(req, res);
    if (!shop) return;
    const body = req.body || {};
    const names = normalizeNames(body.names || body);
    const tabNames = normalizeTabNames(body.tabNames || body.saleTabNames || {});
    const doc = await EntryField.findOneAndUpdate(
      { shop },
      { $set: { shop, names, saleTabNames: tabNames } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    res.json({
      success: true,
      data: normalizeNames(doc.names),
      tabNames: normalizeTabNames(doc.saleTabNames || doc.names?.saleTabNames || {}),
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
