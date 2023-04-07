import * as fs from 'fs'
import * as dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()
const conf = process.env


export function loadWatchedWallets(p="test.csv"){
    const content = fs.readFileSync(p, 'utf8')
    const rows = content.split('\n')
    let addressArr = []
    for (let r of rows){
        addressArr.push({"addr":r.split(",")[0].toLowerCase(), "label":r.split(",")[1]})
    }
    return addressArr
}

export function loadLabels(ps){
    const addressMap = new Map()
    for (let p of ps){
      const content = fs.readFileSync(p, 'utf8')
      const addressArr = content.split('\n')
      addressArr.forEach((obj) => {
          let row = obj.split(',')
          addressMap.set(row[0].toLowerCase(), row[1])
      })
    }
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
        //console.log(ret['data']['result'])
        return ret['data']['result']
    }catch(e){
        console.log('Unknown API ERROR:')
        console.log(e['response']['status'])
        console.log(e['response']['statusText'])
        
        return []
    }
    
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


export function formatSlackMessage(chainId, data, addressLabelsMap, wallet){
    let retMessage = ""
    let addressLinkPrefix = "", txnLinkPrefix = ""
    if (chainId == 42161){
        addressLinkPrefix = "https://arbiscan.io/address/"
        txnLinkPrefix     = "https://arbiscan.io/tx/" 
    }else if (chainId == 1){
        addressLinkPrefix = "https://etherscan.io/address/"
        txnLinkPrefix     = "https://etherscan.io/tx/"
    }else{
        console.log("Invalid chainId")
        return retMessage
    }

    if (data.length == 0){
        console.log('reache the end')
        return retMessage
    }else{
        console.log("Parsing " + data.length + " results")
    }

    retMessage += `<${addressLinkPrefix}${wallet['addr']}#tokentxns| *${wallet['label']}*>\n`

    //groupping data by transaction hash
    const groupedData = data.reduce((groups, item) =>{
        //console.log(groups)
        const group = groups[item['hash']] || []
        group.push(item)
        groups[item['hash']] = group
        return groups
    }, {})

    for (const [k,v] of Object.entries(groupedData)){
        if (v.length != 2){
            //if a transaction does not have excatly 2 transfers, we do nothing
            for (let item of v){
                const tokenDecimal  = parseInt(item['tokenDecimal'])
                const tokenValue    = parseFloat(item['value'])/Math.pow(10, tokenDecimal)
                let addressFrom     = item['from'].toLowerCase()
                let addressTo       = item['to'].toLowerCase()
                if (addressFrom == wallet['addr']){
                    //send
                    addressTo   = addressLabelsMap.get(addressTo)?addressLabelsMap.get(addressTo):addressTo
                    retMessage += `<${txnLinkPrefix}${k}| Sent> ${tokenValue.toFixed(2)} ${item['tokenSymbol']} to ${addressTo} at ${item['timeStamp']}` + '\n'
                }else if (addressTo == wallet['addr']){
                    //receive
                    addressFrom = addressLabelsMap.get(addressFrom)?addressLabelsMap.get(addressFrom):addressFrom
                    retMessage += `<${txnLinkPrefix}${k}| Received> ${tokenValue.toFixed(2)} ${item['tokenSymbol']} from ${addressFrom} at ${item['timeStamp']}` + '\n'
                }else{
                    //unknown
                }
            }
        }else{
            //If there are two transfers in a transaction, we combine them into a swap message
            //swap x value of Token A for y value of Token B via Exchange at Time
            let tokenA="",tokenDecimalA="", tokenValueA=0.0, tokenB="", tokenDecimalB="", tokenValueB=0.0, exchange="", time=""
            if (wallet['addr'] == v[0]['from'].toLowerCase()){
                tokenA         = v[0]['tokenSymbol']
                tokenDecimalA  = parseInt(v[0]['tokenDecimal'])
                tokenValueA    = parseFloat(v[0]['value'])/Math.pow(10, tokenDecimalA)
                tokenB         = v[1]['tokenSymbol']
                tokenDecimalB  = parseInt(v[1]['tokenDecimal'])
                tokenValueB    = parseFloat(v[1]['value'])/Math.pow(10, tokenDecimalB)
                exchange       = addressLabelsMap.get(v[0]['to'].toLowerCase())?addressLabelsMap.get(v[0]['to'].toLowerCase()):v[0]['to'].toLowerCase()
                time           = v[0]['timeStamp']
            }else{
                tokenA         = v[1]['tokenSymbol']
                tokenDecimalA  = parseInt(v[1]['tokenDecimal'])
                tokenValueA    = parseFloat(v[1]['value'])/Math.pow(10, tokenDecimalA)
                tokenB         = v[0]['tokenSymbol']
                tokenDecimalB  = parseInt(v[0]['tokenDecimal'])
                tokenValueB    = parseFloat(v[0]['value'])/Math.pow(10, tokenDecimalB)
                exchange       = addressLabelsMap.get(v[1]['to'].toLowerCase())?addressLabelsMap.get(v[1]['to'].toLowerCase()):v[1]['to'].toLowerCase()
                time           = v[1]['timeStamp']
            }

            retMessage += `<${txnLinkPrefix}${k}| Swapped> ${tokenValueA.toFixed(2)} ${tokenA} for ${tokenValueB.toFixed(2)} ${tokenB} via ${exchange} at ${time}\n`
        }
    }

    return retMessage
}