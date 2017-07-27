var isMomHappy = true;

// Promise
var willIGetNewPhone = new Promise(
    function (resolve, reject) {
        if (isMomHappy) {
            var phone = {
                brand: 'Samsung',
                color: 'black'
            };
            resolve(phone); // fulfilled
        } else {
            var reason = new Error('mom is not happy');
            reject(reason); // reject
        }

    }
);

// call our promise
var askMom = function () {
    console.log('before asking Mom'); // log before
    willIGetNewPhone
        .then(showOff)
        .then(function (fulfilled) {
            console.log(fulfilled);
        })
        .catch(function (error) {
            console.log(error.message);
        });
    console.log('after asking mom'); // log after
}

askMom();

var showOff = function (phone) {
    return new Promise(
        function (resolve, reject) {
            var message = 'Hey friend, I have a new ' +
                phone.color + ' ' + phone.brand + ' phone';

            resolve(message);
        }
    );
};


  var userNotRepeated = new Promise(
    function(resolve,reject){
      User.find({email: req.body.email},function(err,users){
        if (err) throw err;
        else errors = true;
        console.log(errors + "a");
      })
      resolve(errors);
    }
  );
  var addUser = function(errors){
    return new Promise(
      function(resolve,reject){
          console.log(errors+'b');

          if(errors)
          {
            console.log('Error');
            res.send("Error"); 
          }
          else
          {
            var newUser = User({
              first_name: req.body.first_name,
              last_name: req.body.last_name,
              email: req.body.email,
              role: req.body.role
            });

            console.log('Success');

            //console.log(newUser);

            newUser.save(function(err){
              if(err) throw err;

              else console.log('user created');
            });

            res.send("Success");

            

          }
          resolve("no repeated user");
      }
    );
  }

userNotRepeated.then(addUser(errors)).then(function(message){
  console.log(message);
})