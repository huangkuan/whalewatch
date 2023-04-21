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

import { getERC20Transfers, formatSlackMessage, getLatestBlock, loadLabels, loadWatchedWallets, loadFeaturedTokens, groupByTransactionHash,filterByFeaturedTokens, TranslateTransactions } from './api.js'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()
const conf = process.env
const SLACK_ALERT_CHANNEL   = "https://hooks.slack.com/services/" + conf.SLACK_FEATUREDTOKENS_WEBHOOKS
const chainId	            = parseInt(process.argv[2])
const watched_csv_path      = process.argv[3]
let BLOCKS_PER_10M          = 0
let APICALL_INTERVAL        = 500 //arbiscan api has much lower and unknown threshold and often throws 429 request error

if (chainId == 42161){
    BLOCKS_PER_10M = 2500 //based on arbiscan block time chart
    APICALL_INTERVAL = 600
}else if(chainId == 1){
    BLOCKS_PER_10M = 50
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
    './labelscsv/dex.csv', 
    './labelscsv/uniswap_arb.csv', 
    './labelscsv/uniswap_eth.csv',
    './labelscsv/cex.csv',
    './labelscsv/watched.csv']

const tokens_paths = [
    './featured_tokens.csv'
]

const addressLabelsMap = loadLabels(csv_paths)
console.log("Labeled addresses loaded")

const addressWatched = loadWatchedWallets(watched_csv_path)
console.log("Watched addresses loaded")

const tokenSet = loadFeaturedTokens(tokens_paths)
console.log("Featured tokens loaded")

const dexLabelsMap = loadLabels([
    './labelscsv/dex.csv', 
    './labelscsv/uniswap_arb.csv', 
    './labelscsv/uniswap_eth.csv'
])
console.log("DEX Labeled addresses loaded")

for (let i=0; i<addressWatched.length; i++){
    //To bypass the 5 requests/sec rate limit, we put a 300ms pause in between API calls
    setTimeout(() => {
        run(chainId, addressWatched[i], blockNum)
    }, i*APICALL_INTERVAL)
}

async function run(chainId, addr, blockNum) {    
    let r = await getERC20Transfers(chainId, addr['addr'], blockNum - BLOCKS_PER_10M, blockNum)
    if (r.length <=0)
        return
        
    const groupedData  = groupByTransactionHash(r)
    const filteredGroupedData = filterByFeaturedTokens(groupedData,tokenSet)

    if (filteredGroupedData.size <=0)
        return

    let ret = TranslateTransactions(filteredGroupedData, addr['addr'], dexLabelsMap)
    let resultStr = formatSlackMessage(chainId, ret, addressLabelsMap, addr)
    console.log(resultStr)
    
    try{
        await axios.post(SLACK_ALERT_CHANNEL, {text: resultStr})
    }catch(e){
        console.log("axios errors:")
        console.log(e)
        return
    }

}
