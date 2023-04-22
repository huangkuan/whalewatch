// node profile.js [chainId] [wallet] [startblock] [endblock]
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

import { getERC20Transfers, groupByTransactionHash, loadLabels, TranslateTransactions } from './api.js'
//import axios from 'axios'
//import dotenv from 'dotenv'


const chainId = process.argv[2]
const wallet = process.argv[3]
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
//const addressLabelsMap = loadLabels(csv_paths)

run(chainId, wallet, startBlock, endBlock)

async function run(cid, wallet_addr, sblock, eblock) {    
    let r = await getERC20Transfers(cid, wallet_addr, sblock, eblock)
    if (r.length <=0)
        return

    const groupedData  = groupByTransactionHash(r)
    let ret = TranslateTransactions(groupedData, wallet_addr, dexLabelsMap)
    console.log(ret)
}

