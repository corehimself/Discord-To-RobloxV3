const axios = require('axios').default;

async function checkName(userToCheck, userOrID) {
  let baseURL = '';
  if (userOrID === 'username') {
    baseURL = `https://users.roblox.com/v1/usernames/users`;
  } else {
    baseURL = `https://api.roblox.com/users/${userToCheck}`;
  }
  let body = {
    "usernames": [userToCheck],
    "excludeBannedUsers": true
  }
  
  try {
    const response = await axios.post(baseURL, body);
    const returnedData = response.data.data[0];

    if (returnedData.id !== undefined) {
      return {id: returnedData.id, name: returnedData.name};
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(`Error with name check API: ${error.message}`);
  }
}

module.exports = { checkName };