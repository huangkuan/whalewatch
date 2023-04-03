import * as fs from 'fs'
import * as dotenv from 'dotenv'
import web3 from 'web3'
import axios from 'axios'

dotenv.config()
const conf = process.env


export function loadWatchedWallets(p="wallets2watch.csv"){
    const content = fs.readFileSync(p, 'utf8')
    const rows = content.split('\n')
    let addressArr = []
    for (let r of rows){
        addressArr.push({"addr":r.split(",")[0], "label":r.split(",")[1]})
    }
    return addressArr
}

export function loadLabels(p="exchange_labels.csv"){
    const content = fs.readFileSync(p, 'utf8')
    const addressArr = content.split('\n')
    const addressMap = new Map()
    addressArr.forEach((obj) => {
        let row = obj.split(',')
        addressMap.set(row[0], row[1])
    })
    return addressMap
}

export async function getERC20Transfers(chainId, address, startBlock, pageNum=1){
    let url = ''
    if (chainId == 1){
        url = `${conf.ES_API_MAIN}${conf.API_ERCTRANSFER}&address=${address}&page=${pageNum}&offset=100&startblock=${startBlock}&sort=asc&apikey=${conf.ES_API_KEY}`
    }else if (chainId == 42161){
        url = `${conf.AT_API_MAIN}${conf.API_ERCTRANSFER}&address=${address}&page=${pageNum}&offset=100&startblock=${startBlock}&sort=asc&apikey=${conf.AT_API_KEY}`
    }
    console.log(url)
    try{
        let ret = await axios.post(url)
        console.log(ret['data']['result'])
        return ret['data']['result']
    }catch(e){
        console.log('Unknown API ERROR')
        return []
    }
    
}

//Format response for Slack
export function parseAPIResponse(chainId, data, addressMap, wallet){
    
    let parsedRet = ""
    
    if (data.length == 0){
        console.log('reache the end')
        return parsedRet
    }else{
        console.log("Parsing " + data.length + " results")
    }

    if (chainId == 42161){
        parsedRet = wallet['label'] + " https://arbiscan.io/address/" + wallet['addr'] + "\n"
    }else if (chainId == 1){
        parsedRet = wallet['label'] + " https://etherscan.io/address/" + wallet['addr'] + "\n"
    }else{
        console.log("Invalid chainId")
        return parsedRet
    }

    for (let a of data){
        let from          = addressMap.get(a['from'])?addressMap.get(a['from']):a['from']
        let to            = addressMap.get(a['to'])?addressMap.get(a['to']):a['to']
        const tokenDecimal  = parseInt(a['tokenDecimal'])
        const tokenValue    = parseInt(a['value'])/Math.pow(10, tokenDecimal)
        from = (from == wallet)?"self":from
        to = (to == wallet)?"self":to
        parsedRet += ` from ${from} to ${to} for ${tokenValue} ${a['tokenSymbol']} at ${a['timeStamp']}`
        parsedRet += "\n"
        //console.log(` from ${from} to ${to} for ${tokenValue} ${a['tokenSymbol']} at ${a['timeStamp']}`)
    }

    return parsedRet
}

export async function getLatestBlock(chainId){
    let url = ''

    if (chainId == 1){
        url = `${conf.ES_API_MAIN}${conf.API_BLOCKNUMBER}&apiKey=${conf.ES_API_KEY}`
    }
    else if (chainId == 42161){
        url = `${conf.AT_API_MAIN}${conf.API_BLOCKNUMBER}&apiKey=${conf.AT_API_KEY}`
    }else{
    }

    try{
        const ret = await axios.post(url)
        return parseInt(ret['data']['result'])
    }catch(e){
        console.log(e)
        return 0
    }

}
