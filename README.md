# Whalewatch Prototype plan:
To have a simple UI that displays what the smart wallets are buying or selling right now. 
1. a.As a start, we will collect smart wallet addresses from varioius resources such as known twitter accounts, Nansen and Etherscan.
   b.In the forseeable future, we can monitor the swaps of Dexes to automatically collect addresses.
2. We need a way to tell the PnL of a specific wallet
3. Based on 2, we then can tell what tokens the smart wallet is best at trading.
4.  1) Based on 3, we then can monitor the trading behavior of a cluster of smart wallets.
    2) In the forseeable future, we can also include large amount of token buy or sell even if the wallets are not labeled as "smart".
5. If a user sees a large enough cluster of smart wallets buy or sell a token, the user can follow the same trade.



Rate limit of Etherscan API: 5 calls per second, 100k calls per day
#index.js file is the starting point
Include below in an .env file

ES_API_KEY  = D34PXUZ7YRGSW1GFPQNCUF1SA7VU9TUQ1Q
ES_API_MAIN = https://api.etherscan.io/api?
AT_API_KEY          = E65X7P422HUZ7J2CRMYCTUPMZ7P6JYJHUW
AT_API_MAIN         = https://api.arbiscan.io/api?
ES_BLOCKRANGE       = 'startblock=16887475'
AT_BLOCKRANGE       = 'startblock=72825000'
API_ERCTRANSFER     = 'module=account&action=tokentx'


#nothing yet
