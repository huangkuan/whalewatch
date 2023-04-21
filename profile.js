import { getERC20Transfers, groupByTransactionHash, loadLabels, TranslateTransactions, formatSlackMessage } from './api.js'
import axios from 'axios'
import dotenv from 'dotenv'

if (isNaN(process.argv[2])){
    console.log("Please enter a chainid")
    process.exit(-1)
}

if (process.argv[3] === undefined){
    console.log("Please enter a wallet address")
    process.exit(-1)
}

if (process.argv[4] === undefined){
    console.log("Please enter a start block")
    process.exit(-1)
}

if (process.argv[5] === undefined){
    console.log("Please enter an end block")
    process.exit(-1)
}

const chainId = process.argv[2]//42161
const wallet = process.argv[3]//"0x0f89d54b02ca570de82f770d33c7b7cf7b3c3394"
//const walletLabel = "MKR whale"
const startBlock = process.argv[4]
const endBlock = process.argv[5] 
const csv_paths = [
    './labelscsv/dex.csv', 
    './labelscsv/uniswap_arb.csv', 
    './labelscsv/uniswap_eth.csv',
    './labelscsv/cex.csv',
    './labelscsv/watched.csv']

const dexLabelsMap = loadLabels(['./labelscsv/dex.csv', './labelscsv/uniswap_arb.csv', './labelscsv/uniswap_eth.csv'])
const cexLabelsMap = loadLabels(['./labelscsv/cex.csv'])
const addressLabelsMap = loadLabels(csv_paths)

run(chainId, wallet, startBlock, endBlock)

async function run(cid, wallet_addr, sblock, eblock) {    
    let r = await getERC20Transfers(cid, wallet_addr, sblock, eblock)
    if (r.length <=0)
        return

    const groupedData  = groupByTransactionHash(r)
    //console.log(groupedData)
    let ret = TranslateTransactions(groupedData, wallet_addr, dexLabelsMap)
    console.log(ret)
    //let msg = formatSlackMessage(chainId, ret, addressLabelsMap, {'addr':wallet_addr, 'label':walletLabel})
    //console.log(msg)
}

