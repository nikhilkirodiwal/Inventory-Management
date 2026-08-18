// seedSalaryEntries.js
//
// Adds monthly salary entries directly into DayBook documents.
//
// Sites:
// 1. Ujala Cygnus Moradabad UP
// 2. Metro Hospital, Haridwar
// 3. Jeevan Anmol Hospital
// 4. Sehgal Nursing Home
// 5. Pushpanjali Hospital
// 6. Arora Hospital (Bharatpur Raj)
//
// Months:
// Metro + Pushpanjali : January 2026 - May 2026
// Ujala + Jeevan + Sehgal + Arora : May 2026
//
// Salary is entered on the 28th of each month.
//
// Anand Trauma Centre is NOT touched.
//
// Run:
// node seedSalaryEntries.js
// ============================================================

import mongoose from "mongoose";
import dotenv from "dotenv";
import DayBook from "./models/dayBook.js";

dotenv.config();

// ============================================================
// DATABASE
// ============================================================

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

// ============================================================
// SHOP / SITE IDS
// ============================================================

const shops = [
  {
    name: "Ujala Cygnus Moradabad UP",
    shopId: "6a82d73e1a779efb71774208",
    months: [1, 2, 3, 4, 5],
  },

  {
    name: "Metro Hospital, Haridwar",
    shopId: "6a82d8551a779efb7177420c",
    months: [1, 2, 3, 4, 5],
  },

  {
    name: "Jeevan Anmol Hospital",
    shopId: "6a82d9221a779efb7177420e",
    months: [5],
  },

  {
    name: "Sehgal Nursing Home",
    shopId: "6a82d96c1a779efb71774210",
    months: [5],
  },

  {
    name: "Pushpanjali Hospital",
    shopId: "6a82d9bd1a779efb71774212",
    months: [1, 2, 3, 4, 5],
  },

  {
    name: "Arora Hospital (Bharatpur Raj)",
    shopId: "6a82da0e1a779efb71774214",
    months: [5],
  },
];

// ============================================================
// EMPLOYEES
// ============================================================

const employees = {
  "6a82d73e1a779efb71774208": [
    {
      name: "Rakesh Kumar",
      amount: 14000,
    },
    {
      name: "Amit Sharma",
      amount: 12000,
    },
    {
      name: "Pooja Verma",
      amount: 9000,
    },
    {
      name: "Vikas Singh",
      amount: 7500,
    },
    {
      name: "Neha Gupta",
      amount: 8000,
    },
    {
      name: "Rahul Yadav",
      amount: 6000,
    },
  ],

  "6a82d8551a779efb7177420c": [
    {
      name: "Suresh Kumar",
      amount: 15000,
    },
    {
      name: "Deepak Meena",
      amount: 12000,
    },
    {
      name: "Anjali Sharma",
      amount: 9500,
    },
    {
      name: "Manoj Singh",
      amount: 8000,
    },
    {
      name: "Kavita Kumari",
      amount: 7500,
    },
    {
      name: "Rohit Kumar",
      amount: 5500,
    },
    {
      name: "Sunil Yadav",
      amount: 6000,
    },
  ],

  "6a82d9221a779efb7177420e": [
    {
      name: "Rajesh Gupta",
      amount: 14000,
    },
    {
      name: "Mohit Sharma",
      amount: 11500,
    },
    {
      name: "Priya Singh",
      amount: 9000,
    },
    {
      name: "Ashok Kumar",
      amount: 7500,
    },
    {
      name: "Nisha Verma",
      amount: 8000,
    },
  ],

  "6a82d96c1a779efb71774210": [
    {
      name: "Mahesh Singh",
      amount: 13000,
    },
    {
      name: "Arun Kumar",
      amount: 11000,
    },
    {
      name: "Renu Sharma",
      amount: 9000,
    },
    {
      name: "Dinesh Yadav",
      amount: 7500,
    },
    {
      name: "Meena Devi",
      amount: 7000,
    },
    {
      name: "Pankaj Kumar",
      amount: 5500,
    },
  ],

  "6a82d9bd1a779efb71774212": [
    {
      name: "Vijay Sharma",
      amount: 15000,
    },
    {
      name: "Naveen Kumar",
      amount: 12500,
    },
    {
      name: "Shweta Singh",
      amount: 9500,
    },
    {
      name: "Karan Verma",
      amount: 8000,
    },
    {
      name: "Ritu Kumari",
      amount: 7500,
    },
    {
      name: "Lokesh Yadav",
      amount: 6000,
    },
    {
      name: "Gaurav Singh",
      amount: 6500,
    },
  ],

  "6a82da0e1a779efb71774214": [
    {
      name: "Harish Kumar",
      amount: 14000,
    },
    {
      name: "Mukul Sharma",
      amount: 11500,
    },
    {
      name: "Sunita Verma",
      amount: 9000,
    },
    {
      name: "Ramesh Singh",
      amount: 7500,
    },
    {
      name: "Asha Devi",
      amount: 8000,
    },
  ],
};

// ============================================================
// MONTH NAMES
// ============================================================

const monthNames = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
};

// ============================================================
// HELPERS
// ============================================================

const getMonthlySalary = (shopId) => {
  const staff = employees[shopId] || [];

  return staff.reduce(
    (total, employee) => total + employee.amount,
    0
  );
};

const getDateForMonth = (month) => {
  // Salary payment date = 28th
  return new Date(Date.UTC(2026, month - 1, 28));
};

// ============================================================
// SEED
// ============================================================

const seedSalaryEntries = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("\n==========================================");
    console.log("CONNECTED TO MONGODB");
    console.log("==========================================\n");

    let createdCount = 0;
    let updatedCount = 0;

    let totalSalaryEntries = 0;
    let totalSalaryAmount = 0;

    for (const shop of shops) {
      const shopEmployees = employees[shop.shopId];

      if (!shopEmployees || shopEmployees.length === 0) {
        console.log(`⚠️ No employees configured for ${shop.name}`);
        continue;
      }

      console.log("------------------------------------------");
      console.log(`SHOP: ${shop.name}`);
      console.log(`SHOP ID: ${shop.shopId}`);
      console.log(`EMPLOYEES: ${shopEmployees.length}`);
      console.log("------------------------------------------");

      const monthlySalary = getMonthlySalary(shop.shopId);

      console.log(
        `Monthly Salary: ₹${monthlySalary.toLocaleString("en-IN")}`
      );

      for (const month of shop.months) {
        const salaryDate = getDateForMonth(month);

        // --------------------------------------------------
        // Find existing DayBook
        // --------------------------------------------------

        let dayBook = await DayBook.findOne({
          shop: shop.shopId,
          date: salaryDate,
        });

        // --------------------------------------------------
        // Salary entries
        // --------------------------------------------------

        const salaryEntries = shopEmployees.map((employee) => ({
          name: employee.name,
          amount: employee.amount,
        }));

        const salaryTotal = salaryEntries.reduce(
          (total, entry) => total + entry.amount,
          0
        );

        // --------------------------------------------------
        // If DayBook already exists
        // --------------------------------------------------

        if (dayBook) {
          /*
           * Keep all existing DayBook data.
           *
           * We only replace:
           * salary
           * salaryEntries
           *
           * Then recalculate:
           * cashExpenses
           * cashInHand
           * closingCash
           */

          dayBook.salaryEntries = salaryEntries;
          dayBook.salary = salaryTotal;

          // ----------------------------------------------
          // Existing expense map
          // ----------------------------------------------

          let otherExpensesTotal = 0;

          if (dayBook.expenseEntries) {
            for (const value of dayBook.expenseEntries.values()) {
              otherExpensesTotal += Number(value || 0);
            }
          }

          // ----------------------------------------------
          // Cash Expenses
          // ----------------------------------------------

          dayBook.cashExpenses =
            otherExpensesTotal +
            Number(dayBook.salary || 0) +
            Number(dayBook.advance || 0);

          // ----------------------------------------------
          // Cash In Hand
          //
          // Total Cash
          //   - Cash Expenses
          //   - Cash To Office
          // ----------------------------------------------

          dayBook.cashInHand =
            Number(dayBook.totalCash || 0) -
            Number(dayBook.cashExpenses || 0) -
            Number(dayBook.cashToOffice || 0);

          // Backward compatibility
          dayBook.closingCash = dayBook.cashInHand;

          await dayBook.save();

          updatedCount++;

          console.log(
            `✅ UPDATED ${monthNames[month]} 2026 | ` +
              `${salaryEntries.length} employees | ` +
              `₹${salaryTotal.toLocaleString("en-IN")}`
          );
        }

        // --------------------------------------------------
        // If DayBook doesn't exist
        // --------------------------------------------------

        else {
          /*
           * There is no DayBook for this salary date.
           *
           * Create a salary-only DayBook.
           *
           * Other financial values remain zero.
           */

          dayBook = new DayBook({
            shop: shop.shopId,

            date: salaryDate,

            openingCash: 0,

            kitchenSale: 0,
            kitchenSubTabs: [],
            kitchenSaleEntries: [],

            coffeeShop: 0,
            coffeeShopSale: 0,
            coffeeSubTabs: [],
            coffeeShopEntries: [],

            officialCr: 0,
            officialCrEntries: [],

            personalCr: 0,
            personalCrEntries: [],

            upiReceived: 0,

            cafeSale: 0,
            cafeNight: 0,

            totalSale: 0,

            totalCash: 0,

            cashToOffice: 0,
            cashToOfficeEntries: [],

            salary: salaryTotal,
            salaryEntries,

            advance: 0,
            advanceEntries: [],

            expenseEntries: {},

            cashExpenses: salaryTotal,

            cashInHand: -salaryTotal,

            closingCash: -salaryTotal,
          });

          await dayBook.save();

          createdCount++;

          console.log(
            `🆕 CREATED ${monthNames[month]} 2026 | ` +
              `${salaryEntries.length} employees | ` +
              `₹${salaryTotal.toLocaleString("en-IN")}`
          );
        }

        totalSalaryEntries += salaryEntries.length;
        totalSalaryAmount += salaryTotal;
      }

      console.log("");
    }

    // ======================================================
    // FINAL SUMMARY
    // ======================================================

    console.log("\n==========================================");
    console.log("SALARY SEED COMPLETED");
    console.log("==========================================");

    console.log(`DayBooks Created : ${createdCount}`);
    console.log(`DayBooks Updated : ${updatedCount}`);

    console.log(
      `Salary Entries   : ${totalSalaryEntries}`
    );

    console.log(
      `Total Salary     : ₹${totalSalaryAmount.toLocaleString(
        "en-IN"
      )}`
    );

    console.log("==========================================\n");

    // ======================================================
    // SHOP-WISE SUMMARY
    // ======================================================

    console.log("SHOP-WISE SUMMARY");
    console.log("==========================================");

    for (const shop of shops) {
      const shopEmployees = employees[shop.shopId];

      const monthlySalary = getMonthlySalary(shop.shopId);

      const numberOfMonths = shop.months.length;

      const totalShopSalary =
        monthlySalary * numberOfMonths;

      console.log(`\n${shop.name}`);

      console.log(
        `Employees: ${shopEmployees.length}`
      );

      console.log(
        `Months: ${shop.months
          .map((month) => monthNames[month])
          .join(", ")}`
      );

      console.log(
        `Monthly: ₹${monthlySalary.toLocaleString("en-IN")}`
      );

      console.log(
        `Total: ₹${totalShopSalary.toLocaleString("en-IN")}`
      );
    }

    console.log("\n==========================================");
    console.log("DONE");
    console.log("==========================================\n");
  } catch (error) {
    console.error("\n❌ SALARY SEED FAILED");
    console.error(error);
  } finally {
    await mongoose.disconnect();

    console.log("MongoDB connection closed.");
  }
};

// ============================================================
// RUN
// ============================================================

seedSalaryEntries();