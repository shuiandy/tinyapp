const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const {
  getUserByEmail,
  getUserDatabase,
  generateRandomString,
  getUserInfo,
  checkUserPermission,
} = require('./helpers');

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

app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
const urlDatabase = {};

const users = {};

app.get('/', (req, res) => res.redirect('/urls'));

app.get('/urls', (req, res) => {
  if (!req.session.user_id || (req.session.user_id && !users[req.session.user_id])) {
    req.session = null;
    return res.redirect('/login');
  }
  const userInfo = getUserInfo(req.session === null ? null : req.session, users);
  const databaseVars = {
    urls: getUserDatabase(urlDatabase, req.session ? req.session.user_id : null),
    username: userInfo.username,
  };
  return res.render('urls_index', databaseVars);
});

app.post('/urls', (req, res) => {
  const userLogin = !!(req.session.user_id && users[req.session.user_id]);
  if (!userLogin) {
    return res.status(401).send('Please login to use ShortURL!');
  }
  const stringKey = generateRandomString(6);
  urlDatabase[stringKey] = { longURL: req.body.longURL, userID: req.session.user_id };
  return res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const userID = getUserByEmail(users, req.body.email);
  if (!users[userID]) {
    return res.status(403).send('User not found!');
  }
  if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    return res.status(403).send('Invaild password!');
  }
  req.session.user_id = userID;
  return res.redirect('/urls');
});

app.get('/login', (req, res) => {
  if (req.session && req.session.user_id) {
    return res.redirect('/urls');
  }
  const userInfo = getUserInfo('', users);
  return res.render('login_page', userInfo);
});

app.post('/logout', (req, res) => {
  req.session = null;
  return res.redirect('/urls');
});

app.get('/register', (req, res) => {
  if (req.session && req.session.user_id) {
    return res.redirect('/urls');
  }
  const userInfo = { username: req.session.username };
  return res.render('new_user', userInfo);
});

app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.sendStatus(400).send('Please fill in your email or password.');
  }
  if (getUserByEmail(users, req.body.email)) {
    return res.sendStatus(400).send('Email address exists!');
  }
  const userID = generateRandomString(6);
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  };
  req.session.user_id = userID;
  return res.redirect('/urls');
});

app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }

  const userInfo = getUserInfo(req.session, users);
  return res.render('urls_new', userInfo);
});

app.put('/urls/:id', (req, res) => {
  // check if user is authenticated
  const permission = checkUserPermission(req, urlDatabase);
  if (!permission.permission) {
    return res.status(permission.status).send(permission.send);
  }
  urlDatabase[req.params.id].longURL = req.body.longURL;
  return res.redirect('/urls');
});

app.delete('/urls/:id', (req, res) => {
  // check if user is authenticated
  const permission = checkUserPermission(req, urlDatabase);
  if (!permission.permission) {
    return res.status(permission.status).send(permission.send);
  }
  delete urlDatabase[req.params.id];
  return res.redirect('/urls');
});

app.get('/urls/:id', (req, res) => {
  // check if user is authenticated
  const permission = checkUserPermission(req, urlDatabase);
  if (!permission.permission) {
    return res.status(permission.status).send(permission.send);
  }

  const userInfo = getUserInfo(req.session, users);
  const userDatabase = getUserDatabase(urlDatabase, req.session.user_id);
  const templateVars = {
    id: req.params.id,
    longURL: userDatabase[req.params.id],
    username: userInfo.username,
  };
  return res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  // check if user is authenticated
  const permission = checkUserPermission(req, urlDatabase);
  if (!permission.permission) {
    return res.status(permission.status).send(permission.send);
  }

  return res.redirect(`/urls/${req.params.id}`);
});

app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('No URL record in database!');
  }

  const userDatabase = getUserDatabase(urlDatabase, req.session.user_id);
  return res.redirect(userDatabase[req.params.id]);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
