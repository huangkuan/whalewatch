# Whalewatch Prototype plan:
To have a simple UI or alert system that monitors what the smart wallets are buying or selling currently. 

## V0:
1. As a start, we will manually collect a list of smart wallets from known Twitter accounts, Nansen and Etherscan.
2. We regularly check the latest ERC20 transfer activities related to those wallets.
3. We build a way to tell whether that ERC20 transfer is trade related, how much was being traded.
4. A user can leverage this information from step 3 and hints from other 3rd party tools to make a decision. Definitely not a clear signal but a good step one.


## V1:
1. We build a way to tell the PnL of trading specific tokens by a smart wallet. 
2. Based on 1, we can then tell what tokens the wallet is best at trading. This provides a more confident signal to an end user.
3. Based on 2, we can identify a cluster of smart wallets which are better at trading a specific token. This provides a more confident signal to an end user.

## Future thoughts: 
There are lots of directions we can go. We can either expand that algorithm onto different verticals outside of trading or dig deeper into trading.

## MISC
Rate limit of Etherscan API: 5 calls per second, 100k calls per day
#index.js file is the starting point

Include below in an .env file
'''
ES_API_KEY  = D34PXUZ7YRGSW1GFPQNCUF1SA7VU9TUQ1Q
ES_API_MAIN = https://api.etherscan.io/api?
AT_API_KEY          = E65X7P422HUZ7J2CRMYCTUPMZ7P6JYJHUW
AT_API_MAIN         = https://api.arbiscan.io/api?
ES_BLOCKRANGE       = 'startblock=16887475'
AT_BLOCKRANGE       = 'startblock=72825000'
API_ERCTRANSFER     = 'module=account&action=tokentx'
'''

#nothing yet
