const apiToken = 'DHF7ABGJ7ZUGJQYC5P1KF1UE83RGEARC3I';
var contractAddress;
$(document).ready(function() {
    var tokenList = new Array();
    let pk;

    var accountAddress;
    $('#btnCreateWallet').click(function(error, result) {
        var user = web3.eth.accounts.create();
        console.log(user);
        accountAddress = user.address;
        $('#lblAccountAddress').empty().append(user.address);
        $('#lblPrivateKey').empty().append(user.privateKey);
        $('#divAlert1').show(500);



    });
    $('#btnUnlock').click(function(error, result) {
        $('#divAlert1').hide();
        var find = false;

        pk = $('#txtPrivateKey').val();

        var acc = web3.eth.accounts.privateKeyToAccount(pk);
        accountAddress = acc.address;
        if (acc.privateKey == pk)
            find = true;

        if (find) {
            getEtherBalance(accountAddress);

            tokenList = JSON.parse(localStorage.getItem(String(accountAddress)));
            console.log(tokenList);

            if (tokenList != null)
                listTokenBalance(accountAddress, tokenList);
            else
                $('#divAlert2').show(500);
        }
        /*
        var highestBlock = web3.eth.getBlock("latest").then();
        var lowestBlock = web3.eth.getBlock(0).then();
        Promise.all([highestBlock, lowestBlock]).then(function(values) {
            console.log(values[0].number, values[1].number);
            for (var i = 0; i <= highestBlock; i++) {
                web3.eth.getBlock(i).then((res) => { if (res.transactions.from == accountAddress) { console.log(res.transactions) } });
            }
        });
        */

        //get transaction history with etherscan.io api
        getTransactionHistory(accountAddress);
        //$('#divAlert2').css("display", "block");

    });


    $('#btnAddToken').click(function() {
        $('#divAlert2').hide();
        //0x88fEBF026D89D4c0658B3cc90e1d256bD2631B31
        contractAddress = $('#txtContractAddress').val();
        //var contractAddress = '0x88fEBF026D89D4c0658B3cc90e1d256bD2631B31';
        var myContract = getContract(contractAddress);

        var _name = myContract.methods.name().call().then();
        var _symbol = myContract.methods.symbol().call().then();
        var _decimals = myContract.methods.decimals().call().then();

        Promise.all([_name, _symbol, _decimals]).then(function(values) {
            var token = {
                address: contractAddress,
                name: values[0],
                sym: values[1],
                dec: values[2]
            };

            $('#lblTokenName').empty().append(values[0]);
            $('#lblTokenSymbol').empty().append(values[1]);
            $('#lblTokenDecimal').empty().append(values[2]);
            if (tokenList == null)
                tokenList = new Array();

            tokenList.push(token);
            localStorage.setItem(accountAddress, JSON.stringify(tokenList));
            listTokenBalance(accountAddress, tokenList);
        });



    });

    $('#btnSendEther').click(function() {

        //for test
        $('#btnSendEther').attr("disabled", true);

        let to = $('#txtEtherToAddress').val();
        let from = $('#txtEtherFromAddress').val();
        let amount = $('#txtEtherAmount').val();
        let pk = $('#txtEtherPrivateKey').val();


        let _nonce = web3.eth.getTransactionCount(from).then();
        let _chainid = web3.eth.net.getId().then();
        let _gassPrice = web3.eth.getGasPrice().then();


        Promise.all([_nonce, _chainid, _gassPrice])
            .then(function(values) {
                console.log(values[0], values[1], values[2]);
                let transactionObject = {
                    to: to,
                    from: from,
                    value: web3.utils.toWei(String(amount), 'ether'),
                    gas: 2000000,
                    chainId: web3.utils.toHex(values[1]),
                    nonce: web3.utils.toHex(values[0]),
                    networkId: 1,
                    gasPrice: web3.utils.toHex(values[2]),
                };
                console.log(transactionObject);

                web3.eth.accounts.signTransaction(transactionObject, pk)
                    .then((res) => {
                        web3.eth.sendSignedTransaction(res.rawTransaction)
                            .on('receipt', (res) => {
                                alert("Transaction mined. Tx hash is:" + res["transactionHash"]);
                                getEtherBalance(accountAddress);
                                getTransactionHistory(accountAddress);
                                $('#btnSendEther').attr("disabled", false);
                                console.log(res);

                            });
                    }).catch((error) => {
                        alert("Transaction failed.");
                        $('#btnSendEther').attr("disabled", false);
                        console.log(error)
                    });


            });


    });

    $('#btnSendToken').click(function() {
        //for test

        $('#btnSendToken').attr("disabled", true);

        let to = $('#txtToAddress').val();

        let accountAddress = $('#txtFromAddress').val();

        let amount = $('#txtTokenAmount').val();

        let pk = $('#txtPrivateKey').val();

        let _nonce = web3.eth.getTransactionCount(accountAddress).then();
        let _chainid = web3.eth.net.getId().then();
        let _gassPrice = web3.eth.getGasPrice().then();

        var myContract = getContract(contractAddress);

        let encoded_tx = myContract.methods.transfer(to, amount).encodeABI();

        let _gas = myContract.methods.transfer(to, amount).
        estimateGas({ from: accountAddress }).
        then();


        Promise.all([_nonce, _chainid, _gassPrice, _gas])
            .then(function(values) {
                console.log(values[0], values[1], values[2], values[3])
                let transactionObject = {
                    to: contractAddress,
                    from: accountAddress,
                    data: encoded_tx,
                    value: '0x0',
                    gas: web3.utils.toHex(values[3]),
                    chainId: web3.utils.toHex(values[1]),
                    nonce: web3.utils.toHex(values[0]),
                    networkId: 1,
                    gasPrice: web3.utils.toHex(values[2]),
                };
                console.log(transactionObject);
                web3.eth.accounts.signTransaction(transactionObject, pk)
                    .then((res) => {
                        web3.eth.sendSignedTransaction(res.rawTransaction)
                            .on('receipt', (res) => {
                                alert("Transaction mined. Tx hash is:" + res["transactionHash"]);
                                listTokenBalance(accountAddress, tokenList);
                                getEtherBalance(accountAddress);
                                $('#btnSendToken').attr("disabled", false);
                                console.log(res);
                            });
                    }).catch((error) => {
                        alert("Transaction failed.");
                        $('#btnSendToken').attr("disabled", false);
                        console.log(error);
                    });

            });

    });

    $('#lbltblTokenTxHistory').click(function() {
        getTransactionHistoryForTokens(accountAddress);
    });
});

function choosedToken(var1, var2) {
    console.log(var1);
    contractAddress = var1;
    $('#txtTokenAmount').attr('placeholder', "0" + var2);
}

function getContract(address) {
    let erc20ContractABI = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }];
    let Contract = new web3.eth.Contract(erc20ContractABI, address);
    return Contract;
}

function getTransactionHistory(address) {
    $('#tblTxHistory tr').remove();
    $.ajax({
        url: 'http://api-ropsten.etherscan.io/api?module=account&action=txlist&address=' + address + '&startblock=0&endblock=99999999&sort=asc&apikey=' + apiToken,
        success: function(data) {
            //console.log(data["result"]);
            data["result"].forEach((tx) => {
                //console.log(tx);
                //console.log(tx["value"], tx["from"], tx["to"], tx["blockNumber"], tx["timeStamp"], tx["hash"], tx["isError"]);
                //if to="" === contract creation

                let to = tx["to"];
                if (tx["to"] == "")
                    to = "Contract Creation";

                //fa-IR
                let date = new Date(tx["timeStamp"] * 1000).toLocaleDateString("en-US");
                let time = new Date(tx["timeStamp"] * 1000).toLocaleTimeString("en-US");



                let error = "confirmed";
                if (tx["isError"] == 1)
                    error = "failed";
                let url = "'https://etherscan.io/tx/" + tx["hash"] + "'";

                let value = tx["value"] / 1000000000000000000;


                let html3 = "<tr><td><a href=" + url + ">" + tx["hash"] +
                    "</td></a><td>" + tx["from"] +
                    "</td><td>" + to + "</td><td>" + tx["blockNumber"] +
                    "</td><td>" + value + "</td><td>" + error + "</td><td>" + date + "</td><td>" + time + "</td></tr>";
                $('#tblTxHistory').append(html3);
            });
        }
    });

}

function getTransactionHistoryForTokens(address) {

    $('#tblTokenTxHistory tr').remove();
    $.ajax({
        url: 'http://api-ropsten.etherscan.io/api?module=account&action=tokentx&address=' + address + '&startblock=0&endblock=999999999&sort=asc&apikey=' + apiToken,
        success: function(data) {
            console.log(data);
            console.log(data["result"]);
            data["result"].forEach((tx) => {
                //console.log(tx);
                //console.log(tx["value"], tx["from"], tx["to"], tx["blockNumber"], tx["timeStamp"], tx["hash"], tx["isError"]);
                //if to="" === contract creation

                let to = tx["to"];
                if (tx["to"] == "")
                    to = "Contract Creation";

                //fa-IR
                let date = new Date(tx["timeStamp"] * 1000).toLocaleDateString("en-US");
                let time = new Date(tx["timeStamp"] * 1000).toLocaleTimeString("en-US");



                let error = "confirmed";
                if (tx["isError"] == 1)
                    error = "failed";
                let url = "'https://etherscan.io/tx/" + tx["hash"] + "'";

                let html3 = "<tr><td><a href=" + url + ">" + tx["hash"] +
                    "</td></a><td>" + tx["from"] +
                    "</td><td>" + to + "</td><td>" + tx["blockNumber"] +
                    "</td><td>" + tx["value"] + "</td><td>" + error + "</td><td>" + date + "</td><td>" + time + "</td></tr>";
                $('#tblTokenTxHistory').append(html3);
            });
        }
    });

}

function listTokenBalance(accountAddress, t) {
    $('#lst').empty();
    $('#lblTokenBalance').empty();

    if (t != null && t.length > 0) {

        t.forEach(element => {

            let contract = getContract(element.address);
            contract.methods.balanceOf(accountAddress).call().
            then((res) => {
                var html = '<br /><label>balance(' + element.sym + '): </label><span>' + (element.dec != 0 ? (res / element.dec) : res) + '</span>';
                $('#lblTokenBalance').append(html);

                var html2 = '<li class="list-group-item" style="cursor:pointer" onClick="choosedToken(\'' + element.address + '\',\'' + element.sym + '\')"><label>balance(' + element.sym + '): </label><span>' + (element.dec != 0 ? (res / element.dec) : res) + '</span></li>';
                $('#lst').append(html2);

            });

        });
    }
}

function getEtherBalance(accountAddress) {
    $('#lblAddress').empty().append(accountAddress);
    web3.eth.getBalance(accountAddress).then((res) => { $('#lblEtherBalance').empty().append(res / 1000000000000000000); });
}