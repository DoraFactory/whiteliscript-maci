require("dotenv").config();
const { QueryClient, setupStakingExtension } = require("@cosmjs/stargate");
const { Tendermint34Client } = require("@cosmjs/tendermint-rpc");
const stakingQuery = require("cosmjs-types/cosmos/staking/v1beta1/query");
const pageQuery = require("cosmjs-types/cosmos/base/query/v1beta1/pagination");

function getEnvVariable (variableName) {
  const value = process.env[variableName];
  if (!value) {
    throw new Error(`Environment variable "${variableName}" is not defined.`);
  }
  return value;
}

async function main () {
  try {
    // Read config from environment variables
    const rpcEndpoint = getEnvVariable("RPC_ENDPOINT");
    const path = getEnvVariable("QUERY_PATH");
    const delegatorAddr = getEnvVariable("DELEGATOR_ADDRESS");
    const queryHeight = parseInt(getEnvVariable("QUERY_HEIGHT"), 10);

    const tmClient = await Tendermint34Client.connect(rpcEndpoint);
    const client = await QueryClient.withExtensions(tmClient, setupStakingExtension);

    let nextKey = undefined;
    let allDelegationResponses = [];
    let total = 0;

    do {

      const pagination = pageQuery.PageRequest.fromPartial({
        key: nextKey,
        offset: BigInt(0),
        limit: BigInt(50),
        countTotal: false,
        reverse: false,
      });

      const requestMessage = {
        delegatorAddr,
        pagination
      };

      const requestBytes = stakingQuery.QueryDelegatorDelegationsRequest.encode(requestMessage).finish();
      const queryResponse = await client.queryAbci(path, requestBytes, queryHeight);
      const response = stakingQuery.QueryDelegatorDelegationsResponse.decode(queryResponse.value);

      allDelegationResponses = allDelegationResponses.concat(response.delegationResponses);

      nextKey = response.pagination?.nextKey;

      if (total === 0 && response.pagination?.total) {
        total = Number(response.pagination.total);
      }

      console.log("Current fetched Page delegations number is :", response.delegationResponses.length);
    } while (nextKey && nextKey.length > 0);

    // Log the final results
    const decodedResponses = allDelegationResponses.map((item) => {
      const { delegation, balance } = item;
      return { delegation, balance };
    });

    console.log("The total number of Delegation Responses is:", decodedResponses.length);
    console.log("Delegation Responses:", decodedResponses);

  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);