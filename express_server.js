const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

const users = {};
const generateRandomString = (number) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < number; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const getUserByEmail = (email) => {
  let result = '';
  Object.keys(users).forEach((key) => {
    if (users[key].email === email) {
      result = key;
    }
  });
  return result;
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const userEmail = req.cookies.user_id ? users[req.cookies.user_id].email : undefined;
  const databaseVars = { urls: urlDatabase, username: userEmail };
  res.render('urls_index', databaseVars);
});
app.post('/urls', (req, res) => {
  const stringKey = generateRandomString(6);
  console.log(stringKey);
  urlDatabase[stringKey] = req.body.longURL;
  res.redirect('/urls');
});

app.get('/urls/new', (req, res) => {
  const variables = { username: req.cookies.username };
  res.render('urls_new', variables);
});

app.get('/urls/:id', (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies.username,
  };
  res.render('urls_show', templateVars);
});
app.post('/urls/:id', (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.get('/u/:id', (req, res) => {
  res.redirect(urlDatabase[req.params.id]);
});
app.post('/urls/:id/edit', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});
app.post('/login', (req, res) => {
  const userId = getUserByEmail(req.body.email);
  if (!users[userId]) {
    res.status(403).send('User not found!');
    return;
  }
  if (users[userId].password !== req.body.password) {
    res.status(403).send('Invaild password!');
    return;
  }
  res.cookie('user_id', userId);
  res.redirect('/urls');
});
app.get('/login', (req, res) => {
  const variables = { username: req.cookies.user_id };
  res.render('login_page', variables);
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id').redirect('/urls');
});

app.get('/register', (req, res) => {
  const userInfo = { username: req.cookies.username };
  res.render('new_user', userInfo);
});

app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.sendStatus(400).send('Please fill in your email or password.');
    return;
  }
  if (getUserByEmail(req.body.email)) {
    res.sendStatus(400).send('Email address exists!');
    return;
  }
  const userID = generateRandomString(6);
  users[userID] = { id: userID, email: req.body.email, password: req.body.password };
  console.log(users);
  res.cookie('user_id', userID);
  res.redirect('/urls');
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
