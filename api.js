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

export function loadFeaturedTokens(ps){
    const addressSet = new Set()
    for (let p of ps){
        const content = fs.readFileSync(p, 'utf8')
        const addressArr = content.split('\n')
        addressArr.forEach((obj) => {
            addressSet.add(obj)
        })
    }
    return addressSet
}

export async function getERC20Transfers(chainId, address, startBlock, endBlock, pageNum=1){
    let url = ''
    if (chainId == 1){
        url = `${conf.ES_API_MAIN}${conf.API_ERCTRANSFER}&address=${address}&page=${pageNum}&offset=100&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${conf.ES_API_KEY}`
    }else if (chainId == 42161){
        url = `${conf.AT_API_MAIN}${conf.API_ERCTRANSFER}&address=${address}&page=${pageNum}&offset=100&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${conf.AT_API_KEY}`
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

export function groupByTransactionHash(data){
    //groupping data by transaction hash
    if (!Array.isArray(data)){
        console.log("invalid data: " + data)
        return new Map()
    }

    const groupedData = data.reduce((groups, item) =>{
        const group = groups.get(item['hash']) || []
        group.push(item)
        groups.set(item['hash'], group)
        //console.log(groups.size)
        return groups
    }, new Map())
    
    return groupedData
}
//work in progress
export function filterByFeaturedTokens(data, tokenSet){
    /*
        We check all the ERC20 transfers in a transaction
    */
   let featuredTokenMap = new Map()
    for (const [k,v] of data){
        let bFeatured = false
        for (let item of v){
            //If any transfer involves a featured token, we inlcude them
            if (tokenSet.has(item['tokenSymbol'])){
                bFeatured = true
                break
            }
        }
        if (bFeatured)
            featuredTokenMap.set(k, v)
    }

    return featuredTokenMap
}

//Nested function
function hasDualDirection(w, erc20Transfers){
    //To be considered as a swap, the ERC20 transfers in a trancation need to have both directions.
    let hasFrom = false, hasTo = false
    for (let obj of erc20Transfers){
        if (obj['from'].toLowerCase() == w)
            hasFrom = true
        if (obj['to'].toLowerCase() == w)
            hasTo = true
    }
    return hasFrom && hasTo
}

export function TranslateTransactions(groupedData, wallet, dexlabelsMap, cexlabelsMap){
    let retMap = new Map()
    if (groupedData.size <= 0){
        console.log('reached the end')
        return retMap
    }
    console.log("Translating " + groupedData.size + " results")
    let w = wallet.toLowerCase()
    for (const [k,v] of groupedData){
        let groupResult = new Array()

        let tokenCombinedValueA = 0, tokenCombinedValueB = 0, tokenA = '', tokenB = '', tokenDecimalA = 0, tokenDecimalB = 0, blockNumber = 0
        if (!hasDualDirection(w, v)){
            for (let obj of v){
                let from = obj['from'].toLowerCase()
                let to = obj['to'].toLowerCase()
                blockNumber = parseInt(obj['blockNumber'])
                groupResult.push({
                    "blockNumber"   : blockNumber,
                    "from"          : from,
                    "to"            : to,
                    "type"          : "transfer",
                    "direction"     : (from == w)?"send":"receive",
                    "tokenA"        : obj['tokenSymbol'],
                    "tokenDecimalA" : parseInt(obj['tokenDecimal']),
                    "tokenValueA"   : parseFloat(obj['value'])/Math.pow(10, parseInt(obj['tokenDecimal']))
                })            
            }
        }else{
            for (let obj of v){
                let from = obj['from'].toLowerCase()
                let to = obj['to'].toLowerCase()
                blockNumber = parseInt(obj['blockNumber'])
                if (!dexlabelsMap.get(from) && !dexlabelsMap.get(to)){
                    //If neither address is a dex address, we won't need to do any work to aggregate the value of tokens.
                    //It is a transfer
                    groupResult.push({
                        "blockNumber"   : blockNumber,
                        "from"          : from,
                        "to"            : to,
                        "type"          : "transfer",
                        "direction"     : (from == w)?"send":"receive",//from the perspective of the wallet holder
                        "tokenA"        : obj['tokenSymbol'],
                        "tokenDecimalA" : parseInt(obj['tokenDecimal']),
                        "tokenValueA"   : parseFloat(obj['value'])/Math.pow(10, parseInt(obj['tokenDecimal']))
                    })
                    continue
                }

                if (from == w){
                    tokenA              = obj['tokenSymbol']
                    tokenDecimalA       = parseInt(obj['tokenDecimal'])
                    tokenCombinedValueA     += parseFloat(obj['value'])/Math.pow(10, tokenDecimalA)
                }else{
                    tokenB              = obj['tokenSymbol']
                    tokenDecimalB       = parseInt(obj['tokenDecimal'])
                    tokenCombinedValueB     += parseFloat(obj['value'])/Math.pow(10, tokenDecimalB)
                }
            }

            //After combining the values of the separated transfers, we add them to the groupResult
            if (tokenA != '' && tokenB !='' && tokenDecimalA !=0 && tokenDecimalB !=0){
                groupResult.push({
                    "blockNumber": blockNumber,
                    "type"       : "trade",
                    "direction"  : "swap",
                    "tokenA"        : tokenA,
                    "tokenValueA"   : tokenCombinedValueA,
                    "tokenDecimalA" : tokenDecimalA,
                    "tokenB"        : tokenB,
                    "tokenValueB"   : tokenCombinedValueB,
                    "tokenDecimalB" : tokenDecimalB,
                    "exchange"     : "DEX"
                })
            }

        }
        retMap.set(k, groupResult)
    
    }
    return retMap
    
}

export function formatSlackMessage(chainId, groupedData, addressLabelsMap, wallet){
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

    if (groupedData.size <= 0){
        console.log('reached the end')
        return retMessage
    }

    retMessage += `<${addressLinkPrefix}${wallet['addr']}#tokentxns| *${wallet['label']}*> [${chainId}]\n`
    for (const [k,v] of groupedData){
        for (let item of v){
            const from = (addressLabelsMap.get(item['from']))?addressLabelsMap.get(item['from']):item['from']
            const to = (addressLabelsMap.get(item['to']))?addressLabelsMap.get(item['to']):item['to']

            if (item['type'] == 'transfer'){
                if (item['direction'] == 'send')
                    retMessage += `<${txnLinkPrefix}${k}| Sent> ${item['tokenValueA'].toFixed(4)} ${item['tokenA']} to ${to} at block ${item['blockNumber']} \n`
                else
                    retMessage += `<${txnLinkPrefix}${k}| Received> ${item['tokenValueA'].toFixed(4)} ${item['tokenA']} from ${from} at block ${item['blockNumber']} \n`

            }else if (item['type'] == 'trade')
                retMessage += `<${txnLinkPrefix}${k}| Swapped> ${item['tokenValueA'].toFixed(4)} ${item['tokenA']} for ${item['tokenValueB'].toFixed(4)} ${item['tokenB']} via ${item['exchange']} at block ${item['blockNumber']} \n`
            else
                retMessage += ""
        }
    }

    return retMessage
}
