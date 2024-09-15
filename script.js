document.addEventListener("DOMContentLoaded", () => {
  Promise.all([fetchCsv("donation.csv"), fetchCsv("expenditure.csv")]).then(
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

// Function to fetch CSV data and parse it using PapaParse
function fetchCsv(file) {
  return fetch(file)
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

// Render each table and summary by month
function renderMonthlyTables(groupedData) {
  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = ""; // Clear content

  Object.keys(groupedData).forEach((month) => {
    const monthData = groupedData[month];

    // Create and insert table
    const table = createTable(monthData, month);
    contentDiv.appendChild(table);

    // Calculate and insert summary (total amount + donated items)
    const summary = calculateSummary(monthData);
    contentDiv.appendChild(summary);
  });
}

function createTable(data, month) {
  const table = document.createElement("table");
  table.className = "donation-table"; // Optional class for styling

  const thead = document.createElement("thead");
  thead.innerHTML = `
        <tr>
            <th colspan="5">Transactions for ${month}</th>
        </tr>
        <tr>
            <th data-column="name" data-order="asc">Name</th>
            <th data-column="date" data-order="asc">Date</th>
            <th data-column="phone" data-order="asc">Phone Number</th>
            <th data-column="amount" data-order="asc">Amount (BDT)</th>
            <th data-column="items" data-order="asc">Items</th>
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
      row.type === "donation" ? "#d4f7d4" : "#f7d4d4";

    tbody.appendChild(tableRow);
  });

  table.appendChild(tbody);

  return table;
}

// Calculate total amount and items for the current month
function calculateSummary(data) {
  let totalAmount = 0;
  const itemSet = new Set();

  data.forEach((row) => {
    const amount = parseFloat(row.amount) || 0;
    totalAmount += amount;

    if (row.items) {
      const items = row.items.split(",").map((item) => item.trim());
      items.forEach((item) => itemSet.add(item));
    }
  });

  const summaryDiv = document.createElement("div");
  summaryDiv.className = "summary";

  const totalAmountHtml = `<h2>Total Amount for Month (BDT): ${totalAmount.toFixed(
    2
  )}</h2>`;
  const itemsHtml = `<h3>Donated Items:</h3><ul>${Array.from(itemSet)
    .map((item) => `<li>${item}</li>`)
    .join("")}</ul>`;

  summaryDiv.innerHTML = totalAmountHtml + itemsHtml;
  return summaryDiv;
}
