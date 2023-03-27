import {uniswap_pools} from "../constants.js"


function AddUniswapPools2CSV(){
    for (let up of uniswap_pools){
        console.log("0" + up['pool'].slice(1) + ',' + 'Uniswap Pool,')
    }
    return 1
}


array2CSV()