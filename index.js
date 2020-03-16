require('dotenv').config()
const Web3 = require('web3')
const { toHex, sha3 } = require('web3-utils')
const { alert } = require('./pagerDutyAlert')

const JOBS = require('./jobs.json')
const { ORACLE_ADDRESS, RPC_WSS_URL, RESPONCE_INTERVAL } = process.env

const web3 = new Web3(new Web3.providers.WebsocketProvider(RPC_WSS_URL))

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
  const isDone = await isFulfilledRequest(data.requestId)
  if (!isDone) {
    const message = `The ${jobName}(${jobId}) of ${data.requestId} REQUEST_ID was not fulfilled in ${RESPONCE_INTERVAL} minutes.`
    console.log(`\n[ Alert! ${message} ]\n`)
    alert(message)
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
        ORACLE_ADDRESS,
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
      setTimeout(() => checkFulfillment({ jobName, jobId, data }), Number(RESPONCE_INTERVAL) * 60 * 1000)
    })
  }
}

main()
