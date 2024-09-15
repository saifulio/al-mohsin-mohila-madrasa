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

// Render each table and summary (balance) by month
// Render each table and summary (balance) by month, with the latest month at the top
function renderMonthlyTables(groupedData) {
  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = ""; // Clear content

  let cumulativeBalance = 0; // To track the cumulative balance

  // Sort months in descending order (latest first)
  const sortedMonths = Object.keys(groupedData).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  sortedMonths.forEach((month) => {
    const monthData = groupedData[month];

    // Create and insert table for the month
    const table = createTable(monthData, month);
    contentDiv.appendChild(table);

    // Calculate balance for the month and update cumulative balance
    const balanceSummary = calculateBalanceSummary(
      monthData,
      cumulativeBalance
    );
    cumulativeBalance += balanceSummary.balanceForMonth; // Update cumulative balance

    // Render the balance summary
    contentDiv.appendChild(renderBalanceSummary(balanceSummary));
  });
}

// Function to create a table for the transactions of a month
function createTable(data, month) {
  const table = document.createElement("table");
  table.className = "donation-table"; // Optional class for styling

  const thead = document.createElement("thead");
  thead.innerHTML = `
      <tr>
          <th colspan="5">Transactions for ${month}</th>
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

// Function to render the balance summary for the month and cumulative balance
function renderBalanceSummary(summary) {
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "summary";

  const balanceHtml = `<h2>Balance for Month (BDT): ${summary.balanceForMonth.toFixed(
    2
  )}</h2>`;
  const cumulativeBalanceHtml = `<h3>Balance at the End of the Month (BDT): ${summary.cumulativeBalanceAtEndOfMonth.toFixed(
    2
  )}</h3>`;
  const donationsHtml = `<h4>Total Donations: ${summary.totalDonations.toFixed(
    2
  )} BDT</h4>`;
  const expendituresHtml = `<h4>Total Expenditures: ${summary.totalExpenditures.toFixed(
    2
  )} BDT</h4>`;

  summaryDiv.innerHTML =
    balanceHtml + cumulativeBalanceHtml + donationsHtml + expendituresHtml;
  return summaryDiv;
}
