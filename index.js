require('dotenv').config()
const Web3 = require('web3')
const { toHex, sha3, toChecksumAddress } = require('web3-utils')
const JOBS = require('./jobs.json')
const { ORACLE_ADDRESS, RESPONSE_INTERVAL, ALERT_SERVICE, RPC_WSS_URL } = process.env

let alertService
switch(ALERT_SERVICE) {
  case 'opsgenie':
    alertService = require('./opsGenieAlert')
    break
  case 'pagerduty':
    alertService = require('./pagerDutyAlert')
    break
  default:
    throw new Error(`There is no such alert service "${ALERT_SERVICE}"`)
}
let provider = new Web3.providers.WebsocketProvider(RPC_WSS_URL)
const web3 = new Web3(provider)

function sendAsync({ method, params }) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      method,
      params,
      jsonrpc: 2.0,
      id: 1
    },
    (err, response) => {
      if (err) {
        reject(err)
      }
      if (response.error) {
        reject(response.error)
      } else {
        resolve(response.result)
      }
    }
    )
  })
}

async function checkFulfillment({ jobName, jobId, data }) {
  try {
    const isDone = await isFulfilledRequest(data.requestId)
    if (!isDone) {
      const description = `The ${jobName}(${jobId}) of ${data.requestId} REQUEST_ID was not fulfilled in ${RESPONSE_INTERVAL} minutes.`
      console.log(`\n[ Alert! ${description} ]\n`)
      alertService.send({ description, message: 'Failed fulfillment' })
    } else {
      console.log(`Request ${jobId} is fulfilled`)
    }
  } catch (e) {
    console.error(e)
  }
}

async function isFulfilledRequest(requestId) {
  const mappingPosition = '0'.repeat(63) + '2'
  const key = sha3(requestId + mappingPosition, { encoding: 'hex' })

  let commitment
  try{
    commitment  = await sendAsync({
      method: 'eth_getStorageAt',
      params: [
        toChecksumAddress(ORACLE_ADDRESS),
        key,
        'latest'
      ]
    })
  } catch(e) {
    console.error('sendAsync' ,e)
  }
  return commitment === '0x0000000000000000000000000000000000000000000000000000000000000000'
}

function main() {
  web3.eth.subscribe('newBlockHeaders').on('data', (block) => {
    // just to keep connection alive
    console.log(`\nRecieved new block #${block.number}. Keep waiting for the Chainlink requests.`)
  })

  for(let [jobName, jobId] of Object.entries(JOBS)) {
    web3.eth.subscribe('logs', {
      // address: '',
      topics: ['0xd8d7ecc4800d25fa53ce0372f13a416d98907a7ef3d8d3bdd79cf4fe75529c65', toHex(jobId)]
    }).on('data', (event) => {
      const data = web3.eth.abi.decodeLog([{ type:'bytes32',name:'jobId',indexed:true },{ type:'address',name:'requester' },{ type:'bytes32',name:'requestId', },{ type:'uint256',name:'payment', },{ type:'address',name:'callbackAddr', },{ type:'bytes4',name:'callbackFunctionId', },{ type:'uint256',name:'cancelExpiration', },{ type:'uint256',name:'dataVersion', },{ type:'bytes',name:'data', }],
        event.data,
        event.topics)
      console.log(`\n=========${jobName}==========`)
      console.log(`New request https://etherscan.io/tx/${event.transactionHash}`)
      console.log(`JOB_ID: ${jobId}\nREQUEST_ID: ${data.requestId}`)
      setTimeout(() => checkFulfillment({ jobName, jobId, data }), Number(RESPONSE_INTERVAL) * 60 * 1000)
    })
  }
}

main()
