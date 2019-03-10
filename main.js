if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {

    //injected: https://ropsten.infura.io/v3/0aa895a9055748b18dd833289ec34e65

    //web3provide: http://localhost:8545
    web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/0aa895a9055748b18dd833289ec34e65"));
    console.log(web3);
}