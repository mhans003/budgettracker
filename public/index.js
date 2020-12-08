let transactions = [];
let myChart;

//Get all transactions from the database.
fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    //Save the retrieved data on global transactions variable.
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  //Reduce the transaction amounts to a single total.
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  //Output the total for the user.
  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  //Clear out the table.
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  //For each of the saved transactions (retrieved from database):
  transactions.forEach(transaction => {
    //Create and populate a table row.
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    //Insert this row into the new table.
    tbody.appendChild(tr);
  });
}

function populateChart() {
  //Reverse the transactions to be populated in the right order.
  let reversed = transactions.slice().reverse();
  let sum = 0;

  //Create date labels for the chart.
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  //Create the incremental values for the chart.
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  //If there is already a chart, get rid of it.
  if (myChart) {
    myChart.destroy();
  }

  //Prepare to draw the chart to the page.
  let ctx = document.getElementById("myChart").getContext("2d");

  //Create the chart using the data and labels.
  myChart = new Chart(ctx, {
    type: 'line',
      data: {
        labels,
        datasets: [{
            label: "Total Over Time",
            fill: true,
            backgroundColor: "#6666ff",
            data
        }]
    }
  });
}

function sendTransaction(isAdding) {
  //isAdding is a boolean value passed in depending on if the user is adding or subtracting a transation.
  //This will determine if a transaction is removed or added.

  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  //Validate user input. Output an error if needed.
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  } else {
    errorEl.textContent = "";
  }

  //Create the record by packaging the data up into a transaction object.
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  //If subtracting funds, convert amount to negative number.
  if (!isAdding) {
    transaction.value *= -1;
  }

  //Add this transaction to the beginning of current array of data.
  transactions.unshift(transaction);

  //Re-run logic to populate UI with new record.
  populateChart();
  populateTable();
  populateTotal();
  
  //Send the data to server to be stored.
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
  .then(response => {    
    return response.json();
  })
  .then(data => {
    //Output an error if needed.
    if (data.errors) {
      errorEl.textContent = "Missing Information";
    }
    else {
      //Clear the form.
      nameEl.value = "";
      amountEl.value = "";
    }
  })
  .catch(err => {
    //If the fetch failed, save in IndexedDB.
    saveRecord(transaction);

    //Clear the form.
    nameEl.value = "";
    amountEl.value = "";
  });
}

//Save the transaction in IndexedDB if not connected.
function saveRecord(transaction) {
  
}

//EVENT LISTENERS

document.querySelector("#add-btn").onclick = function() {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  sendTransaction(false);
};
