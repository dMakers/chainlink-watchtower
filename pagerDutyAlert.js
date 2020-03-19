require('dotenv').config()
const pdClient = require('node-pagerduty')
const { PAGERDUTY_API_KEY, PAGERDUTY_SERVICE_ID, PAGERDUTY_USER_EMAIL } = process.env

var pagerDuty = new pdClient(PAGERDUTY_API_KEY)

function send(message) {
  const payload = {
    'incident': {
      'type': 'incident',
      'title': 'The Chainlink node is down',
      'service': {
        'id': PAGERDUTY_SERVICE_ID,
        'type': 'service_reference'
      },
      'urgency': 'high',
      'body': {
        'type': 'incident_body',
        'details': message
      },
    }
  }
  try {
    return pagerDuty.incidents.createIncident(PAGERDUTY_USER_EMAIL, payload)
  } catch (e) {
    console.error('pagerduty', e)
  }
}

module.exports = { send }
