const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
const urlDatabase = {
  b6UTxQ: {
    longURL: 'https://www.tsn.ca',
    userID: 'aJ48lW',
  },
  i3BoGr: {
    longURL: 'https://www.google.ca',
    userID: 'aJ48lW',
  },
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

const getUserDatabase = (userID) => {
  const result = {};
  Object.keys(urlDatabase).forEach((key) => {
    if (urlDatabase[key].userID === userID) {
      result[key] = urlDatabase[key].longURL;
    }
  });
  return result;
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  if (req.cookies.user_id && !users[req.cookies.user_id]) {
    res.clearCookie('user_id');
    req.cookies = {};
  }
  const userEmail = req.cookies.user_id ? users[req.cookies.user_id].email : undefined;
  const databaseVars = { urls: getUserDatabase(req.cookies.user_id), username: userEmail };
  res.render('urls_index', databaseVars);
});

app.post('/urls', (req, res) => {
  const userLogin = !!(req.cookies.user_id && users[req.cookies.user_id]);
  if (!userLogin) {
    res.status(401).send('Please login to use ShortURL!');
    return;
  }
  const stringKey = generateRandomString(6);
  urlDatabase[stringKey] = { longURL: req.body.longURL, userID: req.cookies.user_id };
  res.redirect('/urls');
});

app.get('/urls/new', (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect(302, '/login');
    return;
  }
  const userId = req.cookies.user_id;
  const userEmail = users[userId] ? users[userId].email : undefined;
  const variables = { username: userEmail };
  res.render('urls_new', variables);
});

app.get('/urls/:id', (req, res) => {
  const userId = req.cookies.user_id;
  const userEmail = users[userId] ? users[userId].email : undefined;
  const userDatabase = getUserDatabase(req.cookies.user_id);
  const templateVars = {
    id: req.params.id,
    longURL: userDatabase[req.params.id],
    username: userEmail,
  };
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  if (!(req.cookies && req.cookies.user_id)) {
    res.status(401).send('Please log in first!');
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send('ID does not exist!');
  } else if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
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
  const userDatabase = getUserDatabase(req.cookies.user_id);
  res.redirect(userDatabase[req.params.id]);
});

app.post('/urls/:id/edit', (req, res) => {
  if (!(req.cookies && req.cookies.user_id)) {
    res.status(401).send('Please log in first!');
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send('ID does not exist!');
  } else if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    res.status(401).send('You do not own this URL!');
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});

app.post('/urls/:id/delete', (req, res) => {
  if (!(req.cookies && req.cookies.user_id)) {
    res.status(401).send('Please log in first!');
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send('ID does not exist!');
  } else if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    res.status(401).send('You do not own this URL!');
  } else {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }
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
  if (req.cookies && req.cookies.user_id) {
    res.redirect('/urls');
  }
  const userId = req.cookies.user_id;
  const userEmail = users[userId] ? users[userId].email : undefined;
  const variables = { username: userEmail };
  res.render('login_page', variables);
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id').redirect('/urls');
});

app.get('/register', (req, res) => {
  if (req.cookies && req.cookies.user_id) {
    res.redirect('/urls');
    return;
  }
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
  res.cookie('user_id', userID);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
