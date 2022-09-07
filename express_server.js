const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { getUserByEmail, getUserDatabase, generateRandomString, getUserInfo } = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'session',
    keys: ['test'],
    maxAge: 24 * 60 * 60 * 1000,
  })
);
app.set('view engine', 'ejs');
const urlDatabase = {};

const users = {};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }
  if (req.session.user_id && !users[req.session.user_id]) {
    req.session = null;
  }
  const userInfo = getUserInfo(req.session === null ? null : req.session, users);
  const databaseVars = {
    urls: getUserDatabase(urlDatabase, req.session.user_id),
    username: userInfo.username,
  };
  res.render('urls_index', databaseVars);
});

app.post('/urls', (req, res) => {
  const userLogin = !!(req.session.user_id && users[req.session.user_id]);
  if (!userLogin) {
    res.status(401).send('Please login to use ShortURL!');
    return;
  }
  const stringKey = generateRandomString(6);
  urlDatabase[stringKey] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const userID = getUserByEmail(users, req.body.email);
  if (!users[userID]) {
    res.status(403).send('User not found!');
    return;
  }
  if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    res.status(403).send('Invaild password!');
    return;
  }
  req.session.user_id = userID;
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  if (req.session && req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  const userInfo = getUserInfo('', users);
  res.render('login_page', userInfo);
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  if (req.session && req.session.user_id) {
    res.redirect('/urls');
    return;
  }
  const userInfo = { username: req.session.username };
  res.render('new_user', userInfo);
});

app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.sendStatus(400).send('Please fill in your email or password.');
    return;
  }
  if (getUserByEmail(users, req.body.email)) {
    res.sendStatus(400).send('Email address exists!');
    return;
  }
  const userID = generateRandomString(6);
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  };
  req.session.user_id = userID;
  res.redirect('/urls');
});

app.post('/urls/:id/edit', (req, res) => {
  if (!(req.session && req.session.user_id)) {
    res.status(401).send('Please log in first!');
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send('ID does not exist!');
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.status(401).send('You do not own this URL!');
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});

app.post('/urls/:id/delete', (req, res) => {
  if (!(req.session && req.session.user_id)) {
    res.status(401).send('Please log in first!');
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send('ID does not exist!');
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.status(401).send('You do not own this URL!');
  } else {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }
});
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect(302, '/login');
    return;
  }

  const userInfo = getUserInfo(req.session, users);
  res.render('urls_new', userInfo);
});

app.get('/urls/:id', (req, res) => {
  const userInfo = getUserInfo(req.session, users);
  const userDatabase = getUserDatabase(urlDatabase, req.session.user_id);
  const templateVars = {
    id: req.params.id,
    longURL: userDatabase[req.params.id],
    username: userInfo.username,
  };
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  if (!(req.session && req.session.user_id)) {
    res.status(401).send('Please log in first!');
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send('ID does not exist!');
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.status(401).send('You do not own this URL!');
  } else {
    res.redirect(`/urls/${req.params.id}`);
  }
});

app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).send('No URL record in database!');
    return;
  }
  const userDatabase = getUserDatabase(urlDatabase, req.session.user_id);
  res.redirect(userDatabase[req.params.id]);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
