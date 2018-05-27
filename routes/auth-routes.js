const express = require("express");
const router = express.Router();
const User = require("../models/user");
const teamModel = require("../models/team")
const ensureLogin = require("connect-ensure-login");
const passport = require("passport");
const flash = require("connect-flash");
const bcrypt = require("bcryptjs");
const bcryptSalt = 10;
const session = require("express-session");


router.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  const salt = bcrypt.genSaltSync(bcryptSalt);
  const hashPass = bcrypt.hashSync(password, salt);

  if (username === "" && password === "") {
    res.status(400).json({
      message: 'Enter a username and password'
    })
    return;
  }
  if (username === "") {
    res.status(400).json({
      message: 'Please enter a username'
    });
    return;
  }
  if (password === "") {
    res.status(400).json({
      message: 'Please enter a password'
    });
    return;
  }

  User.findOne({
    username: username
  }, "username", (err, user) => {
    if (user !== null) {
      res.status(400).json({
        message: 'This username is already taken'
      });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = User({
      username: username,
      password: hashPass,
      // email: email
    });

    newUser.save((err) => {
      if (err) {
        res.status(400).json({
          message: 'Something went wrong'
        });
        return;
      }

      req.login(newUser, (err) => {
        if (err) {
          res.status(500).json({
            isLoggedIn: false,
            userInfo: null,
            message: 'Unauthorized'
          })
          return;
        }
        res.status(200).json(req.user);
      });

    });
  });
});

router.post('/login', (req, res, next) => {
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (user === null) {
        res.status(400).json({
          error: 'Username is invalid'
        });
        return;
      }
      const isPasswordGood =
        bcrypt.compareSync(req.body.password, user.password);
      if (isPasswordGood === false) {
        res.status(400).json({
          error: 'Password is invalid'
        });
        return;
      }

      req.login(user, (err) => {
        user.password = undefined;
        
        res.status(200).json({
          isLoggedIn: true,
          userInfo: user,
          message: 'Logged in'
        });
      }); // req.login
    })

    .catch((err) => {
      console.log('POST /login ERROR!');
      console.log(err);

      res.status(500).json({
        error: 'Log in database error'
      });
    });

}); // POST /login

router.delete('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.status(200).json({
    isLoggedIn: false,
    userInfo: null,
    message: 'Unauthorized'
  });
});

router.get('/loggedin', (req, res, next) => {
  console.log("Backend user: ", req.user)
  if (req.isAuthenticated()) {
    res.json({
      isLoggedIn: true,
      userInfo: req.user,
      message: 'Success'
    });
    return;
  } else {
    res.json({
      isLoggedIn: false,
      userInfo: null,
      message: 'Unauthorized'
    })
    return;
  }
})
router.get('/quicky', (req, res, next) => {
    username: req.user.username
    res.redirect('/api/quicky/:username');
})

router.post('/user/updateteams/:id', (req, res, next) => {
  const newTeam = new teamModel ({
    user: req.body.user,
    note: req.body.note,
    teamName: req.body.teamName,
    urgency: req.body.urgency,
    status: req.body.status,
    theme: req.body.theme
  }) 
  User.findById(req.params.id)
  .then((updatedUser) => {
    updatedUser.userInfo.teams.unshift(clone(newTeam.teamName))
    updatedUser.userInfo.save()
    res.json(updatedUser);
    newTeam.save()
  })
  .catch((err) => {
    res.json(err)
  })
})

// router.get('/quicky/:username', (req, res, next) => {
//   User.findOne({username: req.user.username})
//   .then((thisUser) => {
//     if (thisUser.username === req.params.username) {
//       res.json(thisUser.username)
//     }
//   })
//   .catch((err) => {
//     res.json(err);
//     return;
//   })
// })

router.post('/private', (req, res, next) => {
  if (req.isAuthenticated()) {
    res.json({
      message: 'This is a private message'
    });
    return;
  }
  res.status(403).json({
    message: 'Unauthorized'
  });
});

router.post('/user/update', (req, res, next) => {

})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(200).json(req.user);
  }
}


module.exports = router;