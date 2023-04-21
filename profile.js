import { getERC20Transfers, groupByTransactionHash, loadLabels, TranslateTransactions, formatSlackMessage } from './api.js'
import axios from 'axios'
import dotenv from 'dotenv'

const wallet = "0x6bA604963046512Cc0143693E9A52Faa2eB41ec2"//"0x0f89d54b02ca570de82f770d33c7b7cf7b3c3394"//"0x6bA604963046512Cc0143693E9A52Faa2eB41ec2"//process.argv[2]
const walletLabel = "MKR whale"
const startBlock = 70163203//17026633//70163203 
const endBlock = 70163203//17062206//70163203 
const chainId = 42161//1//42161
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
    console.log(groupedData)
    let ret = TranslateTransactions(groupedData, wallet_addr, dexLabelsMap)
    //console.log(ret)
    let msg = formatSlackMessage(chainId, ret, addressLabelsMap, {'addr':wallet_addr, 'label':walletLabel})
    console.log(msg)
}

