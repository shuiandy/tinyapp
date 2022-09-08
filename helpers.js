const urlDatabase = {};
const users = {};

const generateRandomString = (number) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < number; i += 1) {
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

const getUserInfo = (session) => {
  const userId = session ? session.user_id : undefined;
  const username = users[userId] ? users[userId].email : undefined;
  return { userId, username };
};

const checkUserPermission = (req) => {
  if (!(req.session && req.session.user_id)) {
    return {
      status: 401,
      send: '<h1><center>Please log in first!</center></h1>',
      permission: false,
    };
  }
  if (!urlDatabase[req.params.id]) {
    return {
      status: 404,
      send: '<h1><center>URL does not exist!</center></h1>',
      permission: false,
    };
  }
  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return {
      status: 401,
      send: '<h1><center>You do not own this URL!</center></h1>',
      permission: false,
    };
  }
  return { status: 200, send: '', permission: true };
};

const countUniqueVisitors = (id) => {
  const visitors = new Set();
  let result = 0;

  Object.keys(urlDatabase[id].visitors).forEach((key) => {
    const visitor = urlDatabase[id].visitors[key].visitorID;
    if (!visitors.has(visitor)) {
      result += 1;
      visitors.add(visitor);
    }
  });
  return result;
};

const getUserDatabase = (userID) => {
  const result = {};
  Object.keys(urlDatabase).forEach((key) => {
    const userData = urlDatabase[key];
    if (urlDatabase[key].userID === userID) {
      result[key] = {
        longURL: userData.longURL,
        createTime: userData.createTime,
        visits: userData.visits,
        uniqueVisitors: userData.uniqueVisitors,
      };
    }
  });
  return result;
};
const timeConverter = (timestamp) => {
  const a = new Date(timestamp * 1000);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const year = a.getFullYear();
  const month = months[a.getMonth()];
  const date = a.getDate();
  const hour = a.getHours();
  const min = a.getMinutes() < 10 ? `0${a.getMinutes()}` : a.getMinutes();
  const sec = a.getSeconds() < 10 ? `0${a.getSeconds()}` : a.getSeconds();
  const time = `${date} ${month} ${year} ${hour}:${min}:${sec}`;
  return time;
};

module.exports = {
  urlDatabase,
  users,
  generateRandomString,
  getUserByEmail,
  getUserDatabase,
  getUserInfo,
  checkUserPermission,
  timeConverter,
  countUniqueVisitors,
};
