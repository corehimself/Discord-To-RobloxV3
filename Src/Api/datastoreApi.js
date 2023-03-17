const { universeID, datastoreApiKey } = require('../Credentials/Config.json');

const axios = require('axios').default;
const crypto = require('crypto');

async function handleDatastoreAPI(entryKey, data) {
  const JSONValue = JSON.stringify(data);
  const contentMD5 = crypto.createHash("md5").update(JSONValue).digest("base64");

  try {
    const response = await axios.post(`https://apis.roblox.com/datastores/v1/universes/${universeID}/standard-datastores/datastore/entries/entry`, JSONValue, {
      params: {
        "datastoreName": "DTRD",
        "entryKey": entryKey
      },
      headers: {
        "x-api-key": datastoreApiKey,
        "content-md5": contentMD5,
        "content-type": "application/json"
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(`Error with datastore API | ${error.message}`);
  }
}

module.exports = { handleDatastoreAPI };