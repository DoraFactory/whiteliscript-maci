const { QueryClient, setupStakingExtension } = require("@cosmjs/stargate");
const { Tendermint34Client } = require("@cosmjs/tendermint-rpc");
const { setupWasmExtension } = require("@cosmjs/cosmwasm-stargate");
const wasmQuery = require("cosmjs-types/cosmwasm/wasm/v1/query");

async function main () {
  const rpcEndpoint = "https://vota-archive-rpc.dorafactory.org/";

  const tmClient = await Tendermint34Client.connect(rpcEndpoint);
  const client = await QueryClient.withExtensions(
    tmClient,
    setupWasmExtension
  );

  const contractInfoPath = "/cosmwasm.wasm.v1.Query/ContractInfo";
  const smartContractStatePath = "/cosmwasm.wasm.v1.Query/SmartContractState"

  const contractAddressMessage = {
    address: "dora1zcm26s2q4zt37xt6hwngkf5kveav74c9utzr5q335zxj0z0ydutq9ayzrt",
  };
  const contractInfoBytes = wasmQuery.QueryContractInfoRequest.encode(contractAddressMessage).finish();
  const contractInfoResponse = await client.queryAbci(contractInfoPath, contractInfoBytes, 7166000);
  const contractInfoRaw = wasmQuery.QueryContractInfoResponse.decode(contractInfoResponse.value);
  console.log(`contract info is:`)
  console.log(contractInfoRaw)

  // construct the query methond and parameters for the queryData
  const queryDataMsg = {
    white_info: {
      sender: "dora1zzsep9mmykwqtdj0zlv2r96ycleuhdq2fx3qzd"
    }
  };

  const queryData = new TextEncoder().encode(JSON.stringify(queryDataMsg));

  const smartContractStateMessage = {
    // contract address
    address: "dora1zcm26s2q4zt37xt6hwngkf5kveav74c9utzr5q335zxj0z0ydutq9ayzrt",
    // query data
    queryData
  };

  const smartContractStateBytes = wasmQuery.QuerySmartContractStateRequest.encode(smartContractStateMessage).finish();
  const smartContractStateResponse = await client.queryAbci(smartContractStatePath, smartContractStateBytes, 7166000);
  const smartContractStateRaw = wasmQuery.QuerySmartContractStateResponse.decode(smartContractStateResponse.value);
  let smartContractStateResult = new TextDecoder("utf-8").decode(smartContractStateRaw.data)
  console.log(`white info is:`)
  console.log(smartContractStateResult);
}

main().catch(console.error);