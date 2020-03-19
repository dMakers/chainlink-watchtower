# Chainlink watchtower

### Environment variables (`.env`)

| ENV_VAR              | Description                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| RPC_WSS_URL          | Ethereum WebSocket RPC url                                                                                                                            |
| ORACLE_ADDRESS       | Oracle contract address                                                                                                                               |
| RESPONSE_INTERVAL    | How many **minutes** the Watchtower will wait before fire the alert                                                                                   |
| PAGERDUTY_API_KEY    | PagerDuty API key. [How to gerenate API key](https://support.pagerduty.com/docs/generating-api-keys#section-generating-a-general-access-rest-api-key) |
| PAGERDUTY_SERVICE_ID | PagerDuty service ID. [How to get the service ID](#how-to-get-the-service-id)                                                                         |
| PAGERDUTY_USER_EMAIL | PagerDuty user email that has permissions to trigger incidents of the Service.                                                                        |

### Configure JOB_IDs

1. open `jobs.json` file and put all your JOBs in JSON format.

### How to get the service ID

1. Go to [services](https://peppersec.pagerduty.com/service-directory?direction=asc&query=&sort_by=name&team_ids=all) page.
1. Click to a service
1. The `PAGERDUTY_SERVICE_ID` will be in Browser address bar - somethink like `PWQKP7R` (e.g. `https://dmakers.pagerduty.com/services/PWQKP7R`).

## Run with Docker

1. `cp .env.example .env`
1. `docker-compose up -d`

## Develop

1. `npm i`
1. `cp .env.example .env`
1. `npm run start`
