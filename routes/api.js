const router = require("express").Router();
const Transaction = require("../models/transaction.js");

//Post one transaction to the database using the request body destructured.
router.post("/api/transaction", ({body}, res) => {
  //Create the transaction with the request body.
  Transaction.create(body)
    .then(dbTransaction => {
      //Send back the result as json.
      res.json(dbTransaction);
    })
    .catch(err => {
      //Otherwise, send an error.
      res.status(404).json(err);
    });
});

//Post multiple transactions to the database.
router.post("/api/transaction/bulk", ({body}, res) => {
    Transaction.insertMany(body)
      .then(dbTransaction => {
        //Send back the json result.
        res.json(dbTransaction);
      })
      .catch(err => {
        //Otherwise, send an error.
        res.status(404).json(err);
      });
});

//Get the transactions from the database. 
router.get("/api/transaction", (req, res) => {
  //Sorted by order of date, get all transactions (exclude ID and __v fields)
  Transaction.find({}, {_id: 0, __v: 0}).sort({date: -1})
    .then(dbTransaction => {
      //Using the results, send back json data.
      res.json(dbTransaction);
    })
    .catch(err => {
      //Otherwise, send an error.
      res.status(404).json(err);
    });
});

module.exports = router;