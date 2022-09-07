const generateRandomString = (number) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < number; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const getUserByEmail = (users, email) => {
  let result = '';
  Object.keys(users).forEach((key) => {
    if (users[key].email === email) {
      result = key;
    }
  });
  return result;
};

const getUserDatabase = (urlDatabase, userID) => {
  const result = {};
  Object.keys(urlDatabase).forEach((key) => {
    if (urlDatabase[key].userID === userID) {
      result[key] = urlDatabase[key].longURL;
    }
  });
  return result;
};

const getUserInfo = (session, users) => {
  const userId = session.user_id;
  const userEmail = users[userId] ? users[userId].email : undefined;
  return { userId: userId, username: userEmail };
};

module.exports = { generateRandomString, getUserByEmail, getUserDatabase, getUserInfo };
