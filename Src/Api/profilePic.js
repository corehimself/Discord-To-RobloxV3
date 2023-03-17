const axios = require('axios');

const getAvatarUrl = async (userId) => {
    const robloxResponse = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
    const avatarUrl = robloxResponse.data.data[0].imageUrl;

    return avatarUrl;
};

module.exports = { getAvatarUrl };