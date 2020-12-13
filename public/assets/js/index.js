let transactions = [];
let myChart;

//At the start of the application, attempt to connect to MongoDB Atlas and retrieve data.
fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    //If there is anything in IndexedDB, save those items to MongoDB before starting application.
    if(verifyIndexedDB()) {
      useIndexedDB("budgettracker_mh", "transactions", "get")
        .then(results => {
          //For each item in IndexedDB, save it to MongoDB.
          console.log(`results found in indexeddb: ${results}`);
          results.forEach(result => {
            console.log(`Found result: ${result.name}.`);
            sendToDatabase(result);
          });

          //Now clear IndexedDB.
          clearStore("budgettracker_mh", "transactions");

          //Save DB data on global variable.
          transactions = data;

          console.log(`Data retrieved from MongoDB at start: ${transactions}`);

          populateTotal();
          populateTable();
          populateChart();
        });
    }
  })
  .catch(error => {
    console.log("Database not connected. Using offline mode.");
  });

function populateTotal() {
  //Reduce the transaction amounts to a single total.
  let total = transactions.reduce((total, t) => {
    return total + parseFloat(t.value);
  }, 0);

  //Output the total for the user.
  let totalEl = document.querySelector("#total");
  totalEl.textContent = parseFloat(total).toFixed(2);
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
      <td>${parseFloat(transaction.value).toFixed(2)}</td>
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
    sum += parseFloat(t.value);
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
    value: parseFloat(amountEl.value).toFixed(2),
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
  
  //Send the data to server to be stored, IF online.
  sendToDatabase(transaction, nameEl, amountEl);
}

function sendToDatabase(data, nameEl, amountEl) {
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(data),
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
      //Clear the form, if this is happening after clicking a button.
      if(nameEl) {
        nameEl.value = "";
      }

      if(amountEl) {
        amountEl.value = "";
      }
    }
  })
  .catch(err => {
    //Send the data to indexedDB if there is no internet connection.
    useIndexedDB("budgettracker_mh", "transactions", "put", data);

    //Clear the form, if this is happening after clicking a button.
    if(nameEl) {
      nameEl.value = "";
    }

    if(amountEl) {
      amountEl.value = "";
    }
  });
}

//EVENT LISTENERS

document.querySelector("#add-btn").onclick = function() {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  sendTransaction(false);
};

//INDEXEDDB 

//Ensure that IndexedDB is possible in the browser.
function verifyIndexedDB() {
  if (!window.indexedDB) {
    console.log("Your browser doesn't support IndexedDB. There may be a problem saving/storing budget data.");
    alert("Your browser doesn't support IndexedDB. There may be a problem saving/storing budget data.");
    return false;
  } else {
    return true;
  }
}

//This function interacts with IndexedDB to perform CRUD operations. 'Object' will be ommitted when getting from the DB.
//The fourth argument 'object' will contain the properties of a new transaction when "putting" into the DB
//The fourth argument 'object' will contain an ID when deleting. 
function useIndexedDB(databaseName, storeName, method, object) {
  return new Promise((resolve, reject) => {
    //Open IndexedDB using the DB name passed in.
    const request = window.indexedDB.open(databaseName, 1);
    let db,
      tx,
      store;

    request.onupgradeneeded = function(e) {
      const db = request.result;
      //Create the name of the transactions store.
      db.createObjectStore(storeName, { keyPath: "key", autoIncrement: true});
    };

    request.onerror = function(e) {
      //Log an error if needed.
      console.log("There was an error");
      alert("Something went wrong with IndexedDB.");
    };

    //If the request to open IndexedDB is successful:
    request.onsuccess = function(e) {
      //Identify the DB.
      db = request.result;

      //Create a transaction with the desired store.
      tx = db.transaction(storeName, "readwrite");
      store = tx.objectStore(storeName);

      db.onerror = function(e) {
        console.log("error");
        alert("Something went wrong trying to access the correct store.");
      };
      //If the method passed in is 'put', store the passed in object.
      if (method === "put") {
        store.put(object);
        console.log("record inserted into IndexedDB");
      } else if (method === "get") {
        //If the method is 'get', grab all the items stored in indexedDB.
        const all = store.getAll();
        all.onsuccess = function() {
          //Resolve the promise.
          resolve(all.result);
        };
        //If the method is 'delete', delete the transaction with the ID passed iin.
      } else if (method === "delete") {
        store.delete(object._id);
      }
      tx.oncomplete = function() {
        //Close the DB once operation is finished.
        db.close();
      };
    };
  });
}

function clearStore(databaseName, storeName) {
  const request = window.indexedDB.open(databaseName, 1);

  //Request a delete on the object store once the database is open.
  request.onsuccess = function(event) {
    db = request.result;

    let deleteTransaction = db.transaction(storeName, "readwrite");

    deleteTransaction.onerror = function(event) {
      console.log("Something went wrong opening a delte transaction.");
    }

    let objectStore = deleteTransaction.objectStore(storeName);

    let objectStoreRequest = objectStore.clear();

    objectStoreRequest.onsuccess = function(event) {
      console.log("Delete Successful");
    }
  }
}