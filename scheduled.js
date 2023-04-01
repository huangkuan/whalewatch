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

import { getERC20Transfers, parseAPIResponse, getLatestBlock, loadLabels, loadWatchedWallets } from './api.js'
import axios from 'axios'

const SLACK_ALERT_CHANNEL   = "https://hooks.slack.com/services/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"

const chainId	            = parseInt(process.argv[2])
const csv_path              = process.argv[3]
let BLOCKS_PER_15M           = 0

if (chainId == 42161){
    BLOCKS_PER_15M = 10000
}else if(chainId == 1){
    BLOCKS_PER_15M = 100
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

const addressLabelsMap = loadLabels()
console.log("Labeled addresses loaded")

const addressWatched = loadWatchedWallets(csv_path)
console.log("Watched addresses loaded")

for (let i=0; i<addressWatched.length; i++){
    //To bypass the 5 requests/sec rate limit, we put a 250ms pause in between API calls
    setTimeout(() => {
        run(chainId, addressWatched[i], blockNum)
    }, i*250)
}

async function run(chainId, addr, blockNum) {
    let endBlock = blockNum - BLOCKS_PER_15M
    console.log("Downloading blocks:" + endBlock + " -- " + blockNum)
    
    let r = await getERC20Transfers(chainId, addr['addr'], blockNum - BLOCKS_PER_15M)
    if (r.length <=0)
        return

    let resultStr = parseAPIResponse(chainId, r, addressLabelsMap, addr)
    //console.log(resultStr)
    await axios.post(SLACK_ALERT_CHANNEL, {text: resultStr})

}