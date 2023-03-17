------- 
-- Made by: corehimself
-- Created: 2/28/2023
-- Updated: 3/17/2023
-------
-- // Configuration
local DEBUG_MODE = false;
local Cooldown = (math.random(6, 14));

-- // Services
local PlayersService = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")

-- // Variables
local MainStore = DataStoreService:GetDataStore("DTRD")

local BanMethods = {
	[1] = {Name = "Ban", Message = "You are banned until %s for the following reason: %s", Lengths = {hr = 1, day = 24, wk = 168, mo = 720, yr = 8760}},
	[2] = {Name = "Kick", Message = "You were kicked from the server for: %s"},
	[3] = {Name = "Unban", Message = "You have been unbanned"}
}

-- // Functions
local function GetData(plr)
	local plrData = {};
	local succ, info = pcall(function()
		return MainStore:GetAsync("user_"..plr.UserId, {plrData})
	end)

	if not succ then
		warn("Failed to get data for player "..plr.Name.." with error: "..info)
	end

	return info
end

local function UpdateData(plr, method, time, reason, banEndtime)
	local success, response = pcall(function()
		MainStore:UpdateAsync("user_"..plr.UserId, function(old)
			if old.method == "Ban" and old.time then
				return { method = method, time = time, reason = reason, banEndtime = banEndtime }
			end
		end)
	end)
	
	if (method == "Kick" or method == "Unban" or method == "Warn" or method == nil) then
		MainStore:SetAsync("user_"..plr.UserId, false, nil)
	end
	
	if not success then
		warn("Failed to update data for player "..plr.Name.." with error: "..response)
	end
	return success
end

local function HandleBanMethod(plr, method, time, reason)
	local banMethod = nil
	for _, info in ipairs(BanMethods) do
		if info.Name == method then
			banMethod = info
			break
		end
	end

	if banMethod ~= nil then
		if banMethod == BanMethods[1] then -- Ban
			local timeLength, timeUnit = string.match(time, "(%d+)(%a+)")
			timeLength = tonumber(timeLength)
			if timeLength and timeUnit then
				local lengthInHours = banMethod.Lengths[timeUnit]
				if lengthInHours then
					local banDuration = (timeLength * lengthInHours * 3600)
					local banEndTime = os.time() + banDuration
					local currTime = os.time()
					local timeLeft = tonumber(banEndTime - currTime)

					if timeLeft > 0 then
						UpdateData(plr, method, timeLeft, reason, banEndTime)
						plr:Kick(string.format(banMethod.Message, os.date("%c", banEndTime), reason))
					else
						UpdateData(plr, nil, nil, nil, nil);
						CheckPlayer(plr)
					end
				else
					warn("Invalid time unit provided.")
				end
			elseif time == "Permanent" then
				plr:Kick(string.format(banMethod.Message, time, reason))
			else
				local currTime = os.time()
				local plrData = GetData(plr)["banEndtime"]
				local banEndTime = plrData
				local timeLeft = (tonumber(banEndTime - currTime))

				if timeLeft > 0 then
					UpdateData(plr, method, timeLeft, reason, banEndTime)
					plr:Kick(string.format(banMethod.Message, os.date("%c", banEndTime), reason))
				else
					warn("TIMLEFT:",timeLeft)
					UpdateData(plr, nil, nil, nil, nil);
					CheckPlayer(plr)
				end

			end
		elseif banMethod == BanMethods[2] then -- Kick
			plr:Kick(string.format(banMethod.Message, reason))
		elseif banMethod == BanMethods[3] then -- Unban
			UpdateData(plr, nil, nil, nil, nil);
			warn("Player "..plr.Name.." has been unbanned.")
		end
	end
end

local function CheckPlayer(plr)
	spawn(function()
		while task.wait(Cooldown) do
			if plr then
				local data = GetData(plr)

				if type(data) == "table" and data.method ~= nil and data.time ~= nil and data.reason ~= nil then
					HandleBanMethod(plr, data.method, data.time, data.reason)
				elseif data and data.method == "Unban" then
					UpdateData(plr, nil, nil, nil, nil);
					warn("Player "..plr.Name.." has been unbanned.")
				elseif data and (data.method == "Kick" or data.method == "Warn") and data.reason ~= nil then
					warn'data update'
					UpdateData(plr, nil, nil, nil, nil);
					plr:Kick("You have been kicked for: "..tostring(data.reason));
				else
					if DEBUG_MODE then
						warn(data)
					end
				end
			end
		end
	end)
end

-- // Init
local function PlayerAdded(plr)
	local data = GetData(plr)

	if type(data) == "table" then
		if data.method ~= nil and data.time ~= nil then
			HandleBanMethod(plr, data.method, data.time, data.reason)
		elseif data.method == "Unban" or data.method == "Kick" then
			UpdateData(plr, nil, nil, nil, nil);
			CheckPlayer(plr)
		elseif data.method == "Warn" and data.reason ~= nil then
			UpdateData(plr, nil, nil, nil, nil);
			plr:Kick("You have been kicked for: "..tostring(data.reason));
		end
	else
		CheckPlayer(plr)
	end
end

PlayersService.PlayerAdded:Connect(PlayerAdded)

return { CheckPlayer = CheckPlayer, HandleBanMethod = HandleBanMethod, GetData = GetData, UpdateData = UpdateData }