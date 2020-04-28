require('dotenv').config()
const opsgenie = require('opsgenie-sdk')
const { OPSGENIE_API_KEY, USE_EU_ENDPOINT } = process.env

opsgenie.configure({
  host: USE_EU_ENDPOINT === 'true' ? 'https://api.eu.opsgenie.com' : 'https://api.opsgenie.com',
  api_key: OPSGENIE_API_KEY
})

function send({ message, description }) {
  return new Promise((res, rej) => {
    const create_alert_json = {
      message,
      description,
      entity : 'Chainlink',
      priority : 'P1'
    }
    opsgenie.alertV2.create(create_alert_json, function (error, alert) {
      if (error) {
        console.error(error)
        rej(error)
      } else {
        console.log('Create Alert Response:')
        console.log(alert)
        res(alert)
      }
    })
  })
}

module.exports = { send }
