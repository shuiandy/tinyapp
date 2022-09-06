const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

const users = {};

const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const databaseVars = { urls: urlDatabase, username: req.cookies.username };
  res.render('urls_index', databaseVars);
});
app.post('/urls', (req, res) => {
  const stringKey = generateRandomString();
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
  res.cookie('username', req.body.username).redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username').redirect('/urls');
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
