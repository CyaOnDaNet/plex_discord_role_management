If you are using docker than do NOT edit the config.json. Use environmental variables instead.
An example of docker create is below:


docker create \
  --name='plex_discord_role_management' \
  -e TZ=<timezone> \
  -e 'botToken'='YOUR_DISCORD_BOT_TOKEN' \
  -e 'defaultPrefix'='!' \
  -e 'tautulli_ip'='YOUR_TAUTULLI_IP_ADDRESS' \
  -e 'tautulli_port'='YOUR_TAUTULLI_PORT' \
  -e 'tautulli_api_key'='YOUR_TAUTULLI_API_KEY' \
  -e 'sonarr_ip'='YOUR_SONARR_IP_ADDRESS' \
  -e 'sonarr_port'='YOUR_SONARR_PORT' \
  -e 'sonarr_api_key'='YOUR_SONARR_API_KEY' \
  -e 'node_hook_ip'='THE_IP_ADDRESS_OF_THE_HOST_MACHINE' \
  -e 'node_hook_port'='YOUR_HOST_PORT' \
  -p 'YOUR_HOST_PORT:3000/tcp' \
  -v '/PATH/TO/YOUR/HOST/APPDATA':'/config':'rw'   \
  cyaondanet/plex_discord_role_management:latest
