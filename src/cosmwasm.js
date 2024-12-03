const { QueryClient, setupStakingExtension } = require("@cosmjs/stargate");
const { Tendermint34Client } = require("@cosmjs/tendermint-rpc");
const { setupWasmExtension } = require("@cosmjs/cosmwasm-stargate");
const wasmQuery = require("cosmjs-types/cosmwasm/wasm/v1/query");
const wasmtypes = require("cosmjs-types/cosmwasm/wasm/v1/types")


function decodeModel(model) {
  const decodedKey = new TextDecoder().decode(model.key);

  const decodedValueBase64 = Buffer.from(model.value).toString('base64');
  const decodedValue = Buffer.from(decodedValueBase64, 'base64').toString('utf8');

  return {
    decodedKey,
    decodedValue,
  };
}

async function main() {
  const rpcEndpoint = "http://47.128.207.247:26657";
  
  const tmClient = await Tendermint34Client.connect(rpcEndpoint); 
  const client = await QueryClient.withExtensions(
    tmClient,
    setupWasmExtension
  );

  // query path
  const contractInfoPath = "/cosmwasm.wasm.v1.Query/ContractInfo";
  const allContractStatePath = "/cosmwasm.wasm.v1.Query/AllContractState"

  // const allContractStatePath = "/cosmwasm.wasm.v1.Query/SmartContractState"
  // const contractHistoryPath = "/cosmwasm.wasm.v1.Query/ContractHistory"

  // message type
  const contractAddressMessage = {
    address: "dora1zcm26s2q4zt37xt6hwngkf5kveav74c9utzr5q335zxj0z0ydutq9ayzrt",
  };
  const contractInfoBytes = wasmQuery.QueryContractInfoRequest.encode(contractAddressMessage).finish();
  const contractInfoResponse = await client.queryAbci(contractInfoPath, contractInfoBytes, 7166000);
  const contractInfoRaw = wasmQuery.QueryContractInfoResponse.decode(contractInfoResponse.value);
  console.log(contractInfoRaw)

  // key:whitelist
  // 试一下function和state的key查询

/*   const requestBytes = wasmQuery.QueryContractHistoryRequest.encode(contractAddressMessage).finish();
  const queryResponse = await client.queryAbci(contractHistoryPath, requestBytes, 7166000);
  const response = wasmQuery.QueryContractHistoryResponse.decode(queryResponse.value);
  console.log(response) */

  const requestBytes = wasmQuery.QueryAllContractStateRequest.encode(contractAddressMessage).finish();
  const queryResponse = await client.queryAbci(allContractStatePath, requestBytes, 7166000);
  const allContractState = wasmQuery.QueryAllContractStateResponse.decode(queryResponse.value);

  const decodedData = allContractState.models.map((model, index) => {
    try {
      const { decodedKey, decodedValue } = decodeModel(model);
  
      return {
        modelIndex: index + 1,
        decodedKey,
        decodedValue,
      };
    } catch (error) {
      console.error(`Failed to decode model ${index + 1}`, error);
      return {
        modelIndex: index + 1,
        decodedKey: "Error decoding key",
        decodedValue: "Error decoding value",
      };
    }
  });
  
  console.log(JSON.stringify(decodedData, null, 2));
}

main().catch(console.error);