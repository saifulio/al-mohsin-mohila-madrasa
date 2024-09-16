document.addEventListener("DOMContentLoaded", () => {
  // Fetch donations and expenditures from the backend API
  Promise.all([fetchCsv("/api/donations"), fetchCsv("/api/expenditures")]).then(
    ([donationData, expenditureData]) => {
      // Add a flag to differentiate between donations and expenditures
      donationData.forEach((row) => (row.type = "donation"));
      expenditureData.forEach((row) => (row.type = "expenditure"));

      // Combine both datasets
      const combinedData = [...donationData, ...expenditureData];

      // Group by month and render tables
      const groupedByMonth = groupByMonth(combinedData);
      renderMonthlyTables(groupedByMonth);
    }
  );
});

// Function to fetch CSV data from the backend API
function fetchCsv(url) {
  return fetch(url)
    .then((response) => response.text())
    .then((csvText) => {
      return new Promise((resolve) => {
        Papa.parse(csvText, {
          header: true,
          complete: function (results) {
            resolve(results.data);
          },
        });
      });
    });
}

// Group data by month (YYYY-MM format)
function groupByMonth(data) {
  const monthGroups = {};

  data.forEach((row) => {
    const date = new Date(row.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`; // YYYY-MM format

    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = [];
    }

    monthGroups[monthKey].push(row);
  });

  return monthGroups;
}

// Render each table and summary (balance) by month, with the latest month at the top
function renderMonthlyTables(groupedData) {
  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = ""; // Clear content

  // First, calculate cumulative balances from oldest to newest
  const cumulativeBalances = calculateCumulativeBalances(groupedData);

  // Sort months in descending order (latest first) for rendering
  const sortedMonths = Object.keys(groupedData).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  sortedMonths.forEach((month) => {
    const monthData = groupedData[month];

    // Format the month to "Month, Year" format
    const formattedMonth = formatMonthYear(month);

    // Create and insert table for the month
    const table = createTable(monthData, formattedMonth);
    contentDiv.appendChild(table);

    // Get the cumulative balance and balance for the month
    const { balanceForMonth, cumulativeBalanceAtEndOfMonth } =
      cumulativeBalances[month];

    // Render the balance summary
    const summary = renderBalanceSummary(
      balanceForMonth,
      cumulativeBalanceAtEndOfMonth
    );
    contentDiv.appendChild(summary);
  });
}

// Calculate balances and cumulative balances in chronological order (oldest to newest)
function calculateCumulativeBalances(groupedData) {
  let cumulativeBalance = 0; // Start cumulative balance at 0
  const balances = {};

  // Sort months in ascending order (oldest first) for calculation
  const sortedMonths = Object.keys(groupedData).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  sortedMonths.forEach((month) => {
    const monthData = groupedData[month];

    // Calculate balance for the current month
    const { totalDonations, totalExpenditures } =
      calculateBalanceForMonth(monthData);
    const balanceForMonth = totalDonations - totalExpenditures;

    // Update cumulative balance
    cumulativeBalance += balanceForMonth;

    // Debugging: Log balances for each month
    console.log(
      `Month: ${month}, Balance: ${balanceForMonth}, Cumulative Balance: ${cumulativeBalance}`
    );

    // Store both month balance and cumulative balance
    balances[month] = {
      balanceForMonth,
      cumulativeBalanceAtEndOfMonth: cumulativeBalance,
    };
  });

  return balances;
}

// Helper function to calculate donations and expenditures for a month
function calculateBalanceForMonth(data) {
  let totalDonations = 0;
  let totalExpenditures = 0;

  data.forEach((row) => {
    const amount = parseFloat(row.amount) || 0;
    if (row.type === "donation") {
      totalDonations += amount;
    } else if (row.type === "expenditure") {
      totalExpenditures += amount;
    }
  });

  return { totalDonations, totalExpenditures };
}

// Render the balance summary for the month and cumulative balance
function renderBalanceSummary(
  balanceForMonth = 0,
  cumulativeBalanceAtEndOfMonth = 0
) {
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "summary";

  const balanceHtml = `<h2>Balance for Month (BDT): ${balanceForMonth.toFixed(
    2
  )}</h2>`;
  const cumulativeBalanceHtml = `<h3>Balance at the End of the Month (BDT): ${cumulativeBalanceAtEndOfMonth.toFixed(
    2
  )}</h3>`;

  summaryDiv.innerHTML = balanceHtml + cumulativeBalanceHtml;
  return summaryDiv;
}

function createTable(data, formattedMonth) {
  const table = document.createElement("table");
  table.className = "donation-table"; // Optional class for styling

  const thead = document.createElement("thead");
  thead.innerHTML = `
      <tr>
          <th colspan="5">Transactions for ${formattedMonth}</th>
      </tr>
      <tr>
          <th>Name</th>
          <th>Date</th>
          <th>Phone Number</th>
          <th>Amount (BDT)</th>
          <th>Items</th>
      </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  data.forEach((row) => {
    const tableRow = document.createElement("tr");
    tableRow.innerHTML = `
          <td>${row.name}</td>
          <td>${row.date}</td>
          <td>${row.phone}</td>
          <td>${row.amount}</td>
          <td>${row.items || ""}</td>
      `;

    // Apply different background colors based on the type
    tableRow.style.backgroundColor =
      row.type === "donation" ? "#d4f7d4" : "#f7d4d4"; // Green for donations, Red for expenditures

    tbody.appendChild(tableRow);
  });

  table.appendChild(tbody);

  return table;
}

// Calculate balance for the month and return the balance and total donations/expenditures
function calculateBalanceSummary(data, cumulativeBalance) {
  let totalDonations = 0;
  let totalExpenditures = 0;

  data.forEach((row) => {
    const amount = parseFloat(row.amount) || 0;
    if (row.type === "donation") {
      totalDonations += amount;
    } else if (row.type === "expenditure") {
      totalExpenditures += amount;
    }
  });

  const balanceForMonth = totalDonations - totalExpenditures;
  const cumulativeBalanceAtEndOfMonth = cumulativeBalance + balanceForMonth;

  return {
    totalDonations,
    totalExpenditures,
    balanceForMonth,
    cumulativeBalanceAtEndOfMonth,
  };
}

// Helper function to convert YYYY-MM to "Month, Year" format
function formatMonthYear(dateString) {
  const [year, month] = dateString.split("-");
  const date = new Date(year, month - 1); // Subtract 1 from month since JavaScript months are 0-based
  const monthName = date.toLocaleString("default", { month: "long" });
  return `${monthName}, ${year}`;
}
