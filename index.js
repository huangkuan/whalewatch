import got from 'got'
import * as dotenv from 'dotenv'
import * as fs from 'fs'


dotenv.config()
const conf = process.env
const walletAddress = '0xe11970f2f3de9d637fb786f2d869f8fea44195ac'
const url_es = `${conf.ES_API_MAIN}${conf.API_ERCTRANSFER}&address=${walletAddress}&page=3&offset=100&${conf.ES_BLOCKRANGE}&sort=asc&apikey=${conf.ES_API_KEY}`
const url_at = `${conf.AT_API_MAIN}${conf.API_ERCTRANSFER}&address=${walletAddress}&page=1&${conf.AT_BLOCKRANGE}&sort=asc&apikey=${conf.AT_API_KEY}`
const arb_blocks_hour = 1500

const blockNum = await getBlockByTime(42161)
console.log(`Latest block: ${blockNum}`)
if (blockNum <= 0){
    console.log("Invalid block number")
    process.exit(code)
}
const addressLabelsMap = loadLabels()
console.log("Labeled addresses loaded")

const addressWatched = loadWatchedWallets()
console.log("Watched addresses loaded")

for (let addr of addressWatched){
    let r = await getERC20Transfers(42161, addr, blockNum-arb_blocks_hour*310)
    parseAPIResponse(r, addressLabelsMap, addr)
}

function loadWatchedWallets(){
    //const content = fs.readFileSync('wallets2watch.csv', 'utf8')
    const content = fs.readFileSync('test.csv', 'utf8')
    const rows = content.split('\n')
    let addressArr = []
    for (let r of rows){
        addressArr.push(r.split(",")[0])
    }
    return addressArr
}

function loadLabels(){
    console.log("Loading labeled addresses")
    const content = fs.readFileSync('exchange_labels.csv', 'utf8')
    const addressArr = content.split('\n')
    const addressMap = new Map()
    addressArr.forEach((obj) => {
        let row = obj.split(',')
        addressMap.set(row[0], row[1])
    })
    return addressMap
}

async function getBlockByTime(chainId){

    let ts = parseInt(Date.now()/1000)
    let url = ''

    if (chainId == 1){
        url = `${conf.ES_API_MAIN}${conf.API_BLOCKNUMBER}&timestamp=${ts}&closest=before&apiKey=${conf.ES_API_KEY}`
    }
    else if (chainId == 42161){
        url = `${conf.AT_API_MAIN}${conf.API_BLOCKNUMBER}&timestamp=${ts}&closest=before&apiKey=${conf.AT_API_KEY}`
    }else{
    }

    try{
        const ret = await got.post(url).json()
        //console.log(parseInt(ret['result']))
        return parseInt(ret['result'])
    }catch(e){
        console.log(e)
        return 0
    }

}

async function getERC20Transfers(chainId, address, startBlock){
    let url = ''
    if (chainId == 1){
        url = `${conf.ES_API_MAIN}${conf.API_ERCTRANSFER}&address=${address}&page=1&offset=100&startblock=${startBlock}&sort=asc&apikey=${conf.ES_API_KEY}`
    }else if (chainId == 42161){
        url = `${conf.AT_API_MAIN}${conf.API_ERCTRANSFER}&address=${address}&page=1&offset=100&startblock=${startBlock}&sort=asc&apikey=${conf.AT_API_KEY}`
    }
    console.log(url)
    try{
        let ret = await got.post(url).json()
        console.log(ret)
        if (ret['status'] != 1){
            console.log("API Error: " + ret['result'])
            return null
        }

        return ret['result']
    }catch(e){
        console.log('Unknown API ERROR')
        return null
    }
}

function parseAPIResponse(data, addressMap, wallet){
    console.log(data)
        
    if (data.length == 0)
        console.log('reache the end')
    else{
        console.log("Parsing " + data.length + " results")
    }

    for (let a of data){
        let from          = addressMap.get(a['from'])?addressMap.get(a['from']):a['from']
        let to            = addressMap.get(a['to'])?addressMap.get(a['to']):a['to']
        const tokenDecimal  = parseInt(a['tokenDecimal'])
        const tokenValue    = parseInt(a['value'])/Math.pow(10, tokenDecimal)
        from = (from == wallet)?"self":from
        to = (to == wallet)?"self":to
        console.log(` from ${from} to ${to} for ${tokenValue} ${a['tokenSymbol']} at ${a['timeStamp']}`)
    }
}