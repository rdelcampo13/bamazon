var mysql = require("mysql");
var inquirer = require("inquirer");
var numberOfProducts = 0;

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "",
  database: "bamazon_db"
});

connection.connect(function(err) {
  if (err) throw err;
  start();
});

function start () {
  var query = "SELECT * FROM products";
  connection.query(query, function(err, res) {

    if (err) throw err;

    console.log('');
    console.log('------------ Welcome to Bamazon! ---------');
    console.log('');
    console.log('ID | Product Name | Price');
    console.log('');

    for (var i = 0; i < res.length; i++) {
      console.log(res[i].item_id + ' | ' + res[i].product_name + ' | Price: $' + res[i].price);
      numberOfProducts++;
    };

    console.log('');
    console.log('-----------------------------------------');
    console.log('');

    startShopping();
  });

};

var startShopping = function() {
  inquirer
    .prompt([
      {
        name: "id",
        type: "input",
        message: "What is the ID of the product you would like to buy?",
        validate: function(number) {
          return !(number === '') && !isNaN(number) && Number.isInteger(parseFloat(number)) && (number <= numberOfProducts) && (number > 0);
        },
      },
      {
        name: "quantity",
        type: "input",
        message: "How many would you like to buy?",
        validate: function(number) {
          return !(number === '') && !isNaN(number) && Number.isInteger(parseFloat(number)) && (number > 0);
        },
      }
    ])
  .then(function(product) {

    var query = "SELECT * FROM products WHERE ?";
    connection.query(query,
      {
        item_id: product.id,
      },
      function(err, res) {

        if (err) throw err;

        if (product.quantity <= parseInt(res[0].stock_quantity)) {
          var newQuantity = parseInt(res[0].stock_quantity) - parseInt(product.quantity);
          var updateQuery = "UPDATE products SET ? WHERE ?";

          connection.query(updateQuery,
            [
              {
                stock_quantity: newQuantity
              },
              {
                item_id: product.id
              }
            ],
            function(err) {

            if (err) throw err;
            console.log('');
            console.log('You order has been fulfilled!');
            console.log('Yout total is $' + (parseInt(res[0].stock_quantity) * parseInt(product.quantity)) + ".");
            console.log('');
            finishShopping();

          });

        }
        else {
          console.log('');
          console.log("Insufficient quantity! We only have " + res[0].stock_quantity + " of this item in inventory.");
          console.log('');
          finishShopping();
        };

    });

  });
}

var finishShopping = function() {
  inquirer
    .prompt({
      name: "finishShopping",
      type: "list",
      message: "Would you like to continue shopping?",
      choices: ["Yes, please.", "No, thanks."]
    })
    .then(function(answer) {
      // based on their answer, either call the bid or the post functions
      if (answer.finishShopping === "Yes, please.") {
        start();
      }
      else {
        connection.end();

        console.log('');
        console.log('Visit us again soon!');
        console.log('');
      }
    });
}
