/* const protobuf = require("protobufjs");
const axios = require("axios");
const path = require("path");


const run = async () => {
  const protoPath = path.resolve(__dirname, "./proto"); 
  const root = await protobuf.load(path.join(protoPath, "cosmos/staking/v1beta1/query.proto")); 

  const RequestType = root.lookupType("cosmos.staking.v1beta1.QueryDelegatorDelegationsRequest");


  const message = RequestType.create({
    delegator_addr: "dora1rlc5ha2xcfnts7f2tf8haauuzpm0nmvusvf3ng"
  });


  const data = RequestType.encode(message).finish();


  const dataHex = Buffer.from(data).toString("hex");


  const response = await axios.post("http://47.128.207.247:26657/", {
    jsonrpc: "2.0",
    method: "abci_query",
    id: 1,
    params: {
      path: "/cosmos.staking.v1beta1.Query/DelegatorDelegations",
      data: dataHex,
      height: "7166000",
      prove: false
    }
  });

  console.log(response.data);
};

run().catch(console.error);

 */



const { QueryClient, setupStakingExtension } = require("@cosmjs/stargate");
const { Tendermint34Client } = require("@cosmjs/tendermint-rpc");
const stakingQuery = require("cosmjs-types/cosmos/staking/v1beta1/query");
// const staking = require("cosmjs-types/cosmos/staking/v1beta1/staking")
// const coin = require("cosmjs-types/cosmos/base/v1beta1/coin")

async function main() {
  const rpcEndpoint = "http://47.128.207.247:26657";
  
  const tmClient = await Tendermint34Client.connect(rpcEndpoint); 
  const client = await QueryClient.withExtensions(
    tmClient,
    setupStakingExtension
  );

  // query path
  const path = "/cosmos.staking.v1beta1.Query/DelegatorDelegations";
  const requestMessage = {
    delegatorAddr: "dora1rlc5ha2xcfnts7f2tf8haauuzpm0nmvusvf3ng",
  };
  const requestBytes = stakingQuery.QueryDelegatorDelegationsRequest.encode(requestMessage).finish();

  const queryResponse = await client.queryAbci(path, requestBytes, 7166000);

  const response = stakingQuery.QueryDelegatorDelegationsResponse.decode(queryResponse.value);

  const decodedResponses = response.delegationResponses.map((item) => {

    delegation = item.delegation
    balance = item.balance

    return { delegation, balance };
  });


  console.log("Decoded Delegation Responses:", decodedResponses);
  console.log("data list length is:", decodedResponses.length);

}

main().catch(console.error);