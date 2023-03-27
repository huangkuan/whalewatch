import got from 'got'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config()
const conf = process.env
const walletAddress = '0xe11970f2f3de9d637fb786f2d869f8fea44195ac'
const url_es = `${conf.ES_API_MAIN}${conf.API_ERCTRANSFER}&address=${walletAddress}&page=3&offset=100&${conf.ES_BLOCKRANGE}&sort=asc&apikey=${conf.ES_API_KEY}`
const url_at = `${conf.AT_API_MAIN}${conf.API_ERCTRANSFER}&address=${walletAddress}&page=1&${conf.AT_BLOCKRANGE}&sort=asc&apikey=${conf.AT_API_KEY}`

var addressLabelsMap = loadDB()
console.log("parsing csv done")
const dataES = await got.post(url_es).json()
const dataAT = await got.post(url_at).json()
console.log("Ethereum")
parseAPIResponse(dataES, addressLabelsMap)
/*
console.log("Arbitrum")
parseAPIResponse(dataAT)
*/

function loadDB(){
    const content = fs.readFileSync('cexlabels.csv', 'utf8')
    const addressArr = content.split('\n')
    const addressMap = new Map()
    addressArr.forEach((obj) => {
        let row = obj.split(',')
        addressMap.set(row[0], row[1])
    })
    return addressMap
}

function parseAPIResponse(data, addressMap){
    if (data['result'].length == 0)
        console.log('reading the end')
    console.log(data['result'].length)

    /*
    for (let a of data['result']){
        const from          = addressMap.get(a['from'])?addressMap.get(a['from']):a['from']
        const to            = addressMap.get(a['to'])?addressMap.get(a['to']):a['to']
        const tokenDecimal  = parseInt(a['tokenDecimal'])
        const tokenValue    = parseInt(a['value'])/Math.pow(10, tokenDecimal)
        console.log(` from ${from} to ${to} for ${tokenValue} ${a['tokenSymbol']} at ${a['timeStamp']}`)
    }*/
}

function getBlockByTime(){

}


function retrieveAndParse(){
    
}