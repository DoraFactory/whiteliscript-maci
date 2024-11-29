require("dotenv").config(); 
const { QueryClient, setupStakingExtension } = require("@cosmjs/stargate");
const { Tendermint34Client } = require("@cosmjs/tendermint-rpc");
const stakingQuery = require("cosmjs-types/cosmos/staking/v1beta1/query");

function getEnvVariable(variableName) {
  const value = process.env[variableName];
  if (!value) {
    throw new Error(`Environment variable "${variableName}" is not defined.`);
  }
  return value;
}

async function main() {
  try {
    // read config from env
    const rpcEndpoint = getEnvVariable("RPC_ENDPOINT"); 
    const path = getEnvVariable("QUERY_PATH"); 
    const delegatorAddr = getEnvVariable("DELEGATOR_ADDRESS"); 
    const queryHeight = parseInt(getEnvVariable("QUERY_HEIGHT"), 10);

    const tmClient = await Tendermint34Client.connect(rpcEndpoint);
    const client = await QueryClient.withExtensions(tmClient, setupStakingExtension);

    const requestMessage = { delegatorAddr };

    const requestBytes = stakingQuery.QueryDelegatorDelegationsRequest.encode(requestMessage).finish();
    const queryResponse = await client.queryAbci(path, requestBytes, queryHeight);
    const response = stakingQuery.QueryDelegatorDelegationsResponse.decode(queryResponse.value);
    console.log(response)

    const decodedResponses = response.delegationResponses.map((item) => {
      const { delegation, balance } = item;
      return { delegation, balance };
    });

    console.log("Decoded Delegation Responses:", decodedResponses);
    console.log("Number of Delegation Responses:", decodedResponses.length);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1); 
  }
}

main().catch(console.error);