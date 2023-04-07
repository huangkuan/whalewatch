//The cronjob code
//node scheduled.js -chainid 1 -addresslist xxx.csv 
if (isNaN(process.argv[2])){
    console.log("Please enter a chainid")
    process.exit(-1)
}

if (process.argv[3] === undefined){
    console.log("Please enter a csv file name")
    process.exit(-1)
}

import { getERC20Transfers, formatSlackMessage, getLatestBlock, loadLabels, loadWatchedWallets } from './api.js'
import axios from 'axios'
import * as dotenv from 'dotenv'

dotenv.config()
const conf = process.env
const SLACK_ALERT_CHANNEL   = "https://hooks.slack.com/services/" + conf.SLACK_WEBHOOKS

const chainId	            = parseInt(process.argv[2])
const csv_path              = process.argv[3]
let BLOCKS_PER_10M          = 0
let APICALL_INTERVAL        = 600 //arbiscan api has much lower and unknown threshold and often throws 429 request error

if (chainId == 42161){
    BLOCKS_PER_10M = 7000
    APICALL_INTERVAL = 600
}else if(chainId == 1){
    BLOCKS_PER_10M = 70
    APICALL_INTERVAL = 250
}else{
    console.log("Unknown chain id.")
    process.exit(-1)
}


const blockNum = await getLatestBlock(chainId)
console.log(`Latest block: ${blockNum}`)


if (blockNum <= 0){
    console.log("Invalid block number")
    process.exit(-1)
}
const csv_paths = [
    './labelscsv/dexcex.csv',
    './labelscsv/uniswap_arb.csv',
    './labelscsv/uniswap_eth.csv',
    './labelscsv/watched.csv'
  ]
const addressLabelsMap = loadLabels(csv_paths)
console.log("Labeled addresses loaded")

const addressWatched = loadWatchedWallets(csv_path)
console.log("Watched addresses loaded")

for (let i=0; i<addressWatched.length; i++){
    //To bypass the 5 requests/sec rate limit, we put a 300ms pause in between API calls
    setTimeout(() => {
        run(chainId, addressWatched[i], blockNum)
    }, i*APICALL_INTERVAL)
}

async function run(chainId, addr, blockNum) {
    let endBlock = blockNum - BLOCKS_PER_10M
    //console.log("Downloading blocks:" + endBlock + " -- " + blockNum)
    
    let r = await getERC20Transfers(chainId, addr['addr'], blockNum - BLOCKS_PER_10M)
    if (r.length <=0)
        return

    let resultStr = formatSlackMessage(chainId, r, addressLabelsMap, addr)
    console.log(resultStr)
    
    try{
        await axios.post(SLACK_ALERT_CHANNEL, {text: resultStr})
    }catch(e){
        console.log("axios errors:")
        console.log(e)
        return
    }

}
