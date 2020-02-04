Take the `config.example.json` and edit it with your credentials and save as `config.json`. You can leave the 2nd and or 3rd Sonarr stuff empty if you are not using more than one instance of sonarr.

If you are using docker then do NOT create a config.json. Use environmental variables instead.
An example of docker run is below:


docker run -d \
  --name='plex_discord_role_management' \
  -e TZ=<timezone> \
  -e 'botToken'='YOUR_DISCORD_BOT_TOKEN' \
  -e 'defaultPrefix'='!' \
  -e 'node_hook_ip'='THE_IP_ADDRESS_OF_THE_HOST_MACHINE' \
  -e 'node_hook_port'='YOUR_HOST_PORT' \
  -e 'tautulli_ip'='YOUR_TAUTULLI_IP_ADDRESS' \
  -e 'tautulli_port'='YOUR_TAUTULLI_PORT' \
  -e 'tautulli_api_key'='YOUR_TAUTULLI_API_KEY' \
  -e 'sonarr_ip'='YOUR_SONARR_IP_ADDRESS' \
  -e 'sonarr_port'='YOUR_SONARR_PORT' \
  -e 'sonarr_api_key'='YOUR_SONARR_API_KEY' \
  -e 'sonarr_ip_2'='OPTIONAL_ADDITIONAL_SONARR_IP_ADDRESS' \
  -e 'sonarr_port_2'='OPTIONAL_ADDITIONAL_SONARR_PORT' \
  -e 'sonarr_api_key_2'='OPTIONAL_ADDITIONAL_SONARR_API_KEY' \
  -e 'sonarr_ip_3'='OPTIONAL_ADDITIONAL_SONARR_IP_ADDRESS' \
  -e 'sonarr_port_3'='OPTIONAL_ADDITIONAL_SONARR_PORT' \
  -e 'sonarr_api_key_3'='OPTIONAL_ADDITIONAL_SONARR_API_KEY' \
  -e 'DEBUG_MODE'='0' \
  -p 'YOUR_HOST_PORT:3000/tcp' \
  -v '/PATH/TO/YOUR/HOST/APPDATA':'/app/config':'rw'   \
  cyaondanet/plex_discord_role_management:latest
