var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , passport = require('passport')
  , Gmail = require('node-gmail-api')
  , plivo = require('plivo')
  , util = require('util')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , mongoose = require('mongoose')
  , session = require('express-session')
  , RedisStore = require('connect-redis')(session)
  , GoogleStrategy = require('passport-google-oauth2').Strategy;

var userModel = require('./userModel');
var User = mongoose.model('User');

let client = new plivo.Client('MANMJJYWY1ZTCWYTC1NZ', 'MjdjZmQyMGExYWFlYWYxMWY3NTVlYTY1OTE5NzNi');

var dbPath = "mongodb://localhost/GoogleAuthAndMailCheck";
// command to connect with database
db = mongoose.connect(dbPath);
mongoose.connection.once('open', function () {
  console.log("database connection success");
});


app.use(require('morgan')('combined'));
// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/
var GOOGLE_CLIENT_ID = "570609486769-q2039pk4tb3d335g39g2oas6bblrjp3e.apps.googleusercontent.com"
  , GOOGLE_CLIENT_SECRET = "SIetnHFdwPRiUxy5Lzkv1iCv";

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});


// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  //NOTE :
  //Carefull ! and avoid usage of Private IP, otherwise you will get the device_id device_name issue for Private IP during authentication
  //The workaround is to set up thru the google cloud console a fully qualified domain name such as http://mydomain:3000/ 
  //then edit your /etc/hosts local file to point on your private IP. 
  //Also both sign-in button + callbackURL has to be share the same url, otherwise two cookies will be created and lead to lost your session
  //if you use it.
  callbackURL: "http://localhost:3000/auth/google/callback",
  passReqToCallback: true
},
  function (request, accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      console.log(profile);
      // try to find the user based on their google id
      User.findOne({ 'id': profile.id }, function (err, user) {
        if (err)
          return done(err);

        if (user) {
          let flag = 0;
          if (user.mails.length != 0) {
            user.mails = [];
            user.save();
            flag = 1;
          }

          if (flag == 1) {
            gmail = new Gmail(accessToken)
            s = gmail.messages('label:inbox', { max: 50 })

            s.on('data', function (d) {
              user.mails.push(d);
              user.save();
            })

            s.on('end', function () {
              user.save();
              console.log("mail Pushed...");
              // if a user is found, log them in
              return done(null, user);
            })
          }

        } else {
          // if the user isnt in our database, create a new user
          var newUser = new User();

          // set all of the relevant information
          newUser.id = profile.id;
          newUser.token = accessToken;
          newUser.name = profile.displayName;
          newUser.email = profile.emails[0].value; // pull the first email

          gmail = new Gmail(accessToken)
          s = gmail.messages('label:inbox', { max: 50 })

          s.on('data', function (d) {
            newUser.mails.push(d);
            newUser.save();
          })

          s.on('end', function () {
            // save the user
            newUser.save(function (err) {
              if (err)
                throw err;
              return done(null, newUser);
            })
          })
            ;
        }
      });

    });
  }
));

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//Session to store User Information...
app.use(session({
  secret: 'cookie_secret',
  name: 'kaas',
  proxy: true,
  httpOnly: true,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());


app.get('/', function (req, res) {
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function (req, res) {
  console.log("User to be sent:", req.user);
  res.render('account', { user: req.user, error: false });
});

app.post('/mails/search', ensureAuthenticated, function (req, res) {
  console.log(req.body);

  User.findOne({ 'id': req.user.id }, function (err, user) {
    if (err)
      res.render('account', { error: err });
    if (user == null || user == undefined || user == "") {
      res.render('account', { error: "Sorry! User not Found." })
    }
    else {
      let searchMails = [];
      let flag = 0;
      console.log(user.mails.length);
      for (let i = 0; i < user.mails.length; i++) {
        let str = user.mails[i].snippet;
        let strfind = req.body.search;
        let value = str.includes(strfind);
        if (value) {
          searchMails.push(user.mails[i]);
        }
        if (i == (user.mails.length - 1)) {
          flag = 1;
        }
      }

      if (flag == 1) {
        res.render('mail', { mails: searchMails });

      }


    }

  })

});

app.get('/mails/detail/:id', ensureAuthenticated, function (req, res) {

  let mailId = req.params.id;

  User.findOne({ 'id': req.user.id }, function (err, user) {
    if (err)
      res.render('account', { error: err });
    if (user == null || user == undefined || user == "") {
      res.render('account', { error: "Sorry! User not Found." })
    }
    else {
      let searchMails = [];
      let flag = 0;
      console.log(user.mails.length);
      for (let i = 0; i < user.mails.length; i++) {

        if (user.mails[i].id == req.params.id) {
          searchMails.push(user.mails[i]);
          flag = 1;
          break;
        }

      }

      if (flag == 1) {
        res.render('mailDetail', { mail: searchMails[0] });

      }
    }

  })
})

app.post('/mail/send/sms/:id', ensureAuthenticated, function (req, res) {

  let mailText = "";
  User.findOne({ 'id': req.user.id }, function (err, user) {
    if (err)
      res.render('account', { error: err });
    if (user == null || user == undefined || user == "") {
      res.render('account', { error: "Sorry! User not Found." })
    }
    else {
      let flag = 0;
      for (let i = 0; i < user.mails.length; i++) {
        if (user.mails[i].id == req.params.id) {
          mailText = user.mails[i].snippet;
          flag = 1;
          break;
        }
      }
      if (flag == 1) {
        client.messages.create(
          '+919162772864',
          '+91' + req.body.mobileNumber,
          mailText
        ).then(function (message_created) {
          console.log(message_created)
          res.render('smsConfirm', { confirm: "SMS successFully Sent to" + req.body.mobileNumber })
        }, function (err) {
          res.render('smsConfirm', { confirm: err })
        });
      }

    }

  })


})

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google', passport.authenticate('google', {
  scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/plus.profile.emails.read']
}));
// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/account',
    failureRedirect: '/login'
  }));

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});


app.use(function (err, req, res, next) {
  console.log(err.status);
  res.status(err.status || 500);
  if (err.status == 404) {
    res.render('404', {
      message: err.message,
      error: err
    });
  } else {
    res.render('error', {
      message: err.message,
      error: err
    });
  }
});

app.listen(3000, function () {
  console.log('App listening on port 3000!');
});



// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("hello!" + req.user.name);
    return next();
  }
  else {
    res.redirect('/');
  }
}
