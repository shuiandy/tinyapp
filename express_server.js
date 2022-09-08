const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const {
  urlDatabase,
  users,
  getUserByEmail,
  getUserDatabase,
  generateRandomString,
  getUserInfo,
  checkUserPermission,
  timeConverter,
  countUniqueVisitors,
} = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'session',
    keys: ['mq9hDxBVDbspDR6n'], // secret key should not be hard-coded, but it's fine for this project
    maxAge: 24 * 60 * 60 * 1000,
  })
);

app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  // if user not logged in, redirect to login page
  if (!req.session.user_id || (req.session.user_id && !users[req.session.user_id])) {
    req.session = null;
    res.redirect('/login');
  } else {
    // if user logged in, redirect to urls page
    res.redirect('/urls');
  }
});

app.get('/urls', (req, res) => {
  // check if a user has a cookie but it's not in the database
  // if a user does not have a cookie, redirect to login page
  if (!req.session.user_id || (req.session.user_id && !users[req.session.user_id])) {
    req.session = null;
    return res.status(401).send('<h1><center>Please log in first</center></h1>');
  }
  // pass the user info and user data to header
  const userInfo = getUserInfo(req.session);
  const userData = getUserDatabase(req.session.user_id);

  const databaseVars = {
    urls: userData,
    username: userInfo.username,
  };
  return res.render('urls_index', databaseVars);
});

app.get('/urls/new', (req, res) => {
  // redirect to login page if the user is not logged in
  if (!req.session.user_id) {
    return res.redirect('/login');
  }

  const userInfo = getUserInfo(req.session);
  return res.render('urls_new', userInfo);
});

app.get('/urls/:id', (req, res) => {
  // check if user is authenticated
  // it can also check if a shorted URL existed
  // it can alsooo check if a shorted URL is belong to the current user
  const permission = checkUserPermission(req);
  if (!permission.permission) {
    return res.status(permission.status).send(permission.send);
  }

  const userInfo = getUserInfo(req.session);
  const userDatabase = getUserDatabase(req.session.user_id);
  const urlData = userDatabase[req.params.id];
  const userVariables = {
    id: req.params.id,
    longURL: urlData.longURL,
    username: userInfo.username,
    visits: urlData.visits,
    createTime: urlData.createTime,
    visitors: urlData.visitors,
    uniqueVisitors: urlData.uniqueVisitors,
  };
  return res.render('urls_show', userVariables);
});

app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('<h1><center> ID does not exist!</center></h1>');
  }
  // analytics function
  const visitorID = req.session.visitorID ? req.session.visitorID : generateRandomString(6);
  if (!req.session.visitorID) {
    req.session.visitorID = visitorID;
  }
  // update visitor analytics here
  const urlInfo = urlDatabase[req.params.id];
  urlInfo.visits += 1;
  urlInfo.visitors[urlInfo.visits] = { visitorID };
  urlInfo.uniqueVisitors = countUniqueVisitors(req.params.id, urlDatabase);

  return res.redirect(urlInfo.longURL);
});

app.post('/urls', (req, res) => {
  // unauthorized user should not use the service
  const userLogin = !!(req.session.user_id && users[req.session.user_id]);
  if (!userLogin) {
    return res.status(401).send('<h1><center>Please login to use ShortURL!</center></h1>');
  }
  const stringKey = generateRandomString(6);
  const timestamp = timeConverter(Math.floor(Date.now() / 1000));
  urlDatabase[stringKey] = {
    urlID: stringKey,
    longURL: req.body.longURL,
    userID: req.session.user_id,
    createTime: timestamp,
    visits: 0,
    visitors: {},
    uniqueVisitors: 0,
  };
  return res.redirect(`/urls/${stringKey}`);
});

app.put('/urls/:id', (req, res) => {
  // check if user is authenticated
  const permission = checkUserPermission(req);
  if (!permission.permission) {
    return res.status(permission.status).send(permission.send);
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  return res.redirect('/urls');
});

app.delete('/urls/:id', (req, res) => {
  // check if user is authenticated
  const permission = checkUserPermission(req);
  if (!permission.permission) {
    return res.status(permission.status).send(permission.send);
  }

  delete urlDatabase[req.params.id];
  return res.redirect('/urls');
});

app.get('/login', (req, res) => {
  // redirect to the main page if a user has logged in
  if (req.session && req.session.user_id) {
    return res.redirect('/urls');
  }

  // we didn't login, so user info should be empty
  const userInfo = getUserInfo('');
  return res.render('login_page', userInfo);
});

app.get('/register', (req, res) => {
  // redirect to the main page if a user has logged in
  if (req.session && req.session.user_id) {
    return res.redirect('/urls');
  }

  const userInfo = { username: req.session.username };
  return res.render('new_user', userInfo);
});

app.post('/login', (req, res) => {
  const userID = getUserByEmail(req.body.email);

  // authentication codes
  if (!users[userID]) {
    return res.status(403).send('<h1><center>User not found!</center></h1>');
  }
  if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    return res.status(403).send('<h1><center>Invaild password!</center></h1>');
  }

  req.session.user_id = userID;
  return res.redirect('/urls');
});

app.post('/register', (req, res) => {
  // error handling
  if (!req.body.email || !req.body.password) {
    return res.status(400).send('<h1><center>Please fill in your email or password.</center></h1>');
  }
  if (getUserByEmail(req.body.email)) {
    return res.status(400).send('<h1><center>Email address exists!</center></h1>');
  }
  // generate random userID
  const userID = generateRandomString(6);
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10),
  };
  req.session.user_id = userID;
  return res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('session');
  return res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
